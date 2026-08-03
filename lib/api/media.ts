import { ApiError, unwrapJson, useMockApi } from "./client";
import {
  handleUnauthorized,
  isUnauthorizedStatus,
} from "./handle-unauthorized";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Client-side max for image picks. Uploads go to same-origin `/media-upload/...`
 * which Next rewrites to the API (see next.config.ts) — avoids CORS and the
 * Vercel `/api/backend` function 4.5MB body limit.
 */
export const MAX_UPLOAD_LABEL = "10MB";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083";

const MEDIA_UPLOAD_PATH = "/workflow/execute/media.upload";

/**
 * Same-origin path rewritten to the API (see next.config.ts). Keeps the
 * browser on this origin (no CORS) while the file never enters /api/backend.
 */
const MEDIA_UPLOAD_ENDPOINT = `/media-upload${MEDIA_UPLOAD_PATH}`;

function logMediaError(stage: string, err: unknown, extra?: Record<string, unknown>) {
  const base =
    err instanceof Error
      ? {
          name: err.name,
          message: err.message,
          stack: err.stack,
          ...(err instanceof ApiError ? { status: err.status } : {}),
        }
      : { raw: String(err) };

  console.error(`[media] ERROR @ ${stage}`, { ...base, ...extra });
}

/** Client-side gate — call before any network upload. */
export function validateImageFile(file: File): string | null {
  const sizeMb = file.size / (1024 * 1024);
  if (!file.size) return "Selected file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${sizeMb.toFixed(1)}MB. Images must be ${MAX_UPLOAD_LABEL} or smaller.`;
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return "Use a JPEG, PNG, or WebP image.";
  }
  if (!file.type && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    return "Use a JPEG, PNG, or WebP image.";
  }
  return null;
}

/** Reads a file as a base64 data URL, used as the mock-mode "upload". */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function extractUploadResult(raw: unknown): { url: string; key?: string } {
  if (!raw || typeof raw !== "object") {
    throw new ApiError("Upload response was empty.", 502);
  }

  const obj = raw as Record<string, unknown>;
  const nested =
    obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : obj;

  const urlCandidates = [
    nested.url,
    nested.fileUrl,
    nested.src,
    nested.location,
    nested.uploadUrl,
  ];
  const url = urlCandidates.find(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
  if (!url) {
    throw new ApiError(
      "Upload succeeded but response had no image url.",
      502,
    );
  }

  const key =
    typeof nested.key === "string"
      ? nested.key
      : typeof nested.path === "string"
        ? nested.path
        : undefined;

  return { url, key };
}

function assertUsableMediaUrl(url: string, endpoint: string) {
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    (url.length > 2048 && !/^https?:\/\//i.test(url))
  ) {
    console.error("[media] upload returned non-URL payload", {
      endpoint,
      urlLength: url.length,
      urlPrefix: url.slice(0, 64),
    });
    throw new ApiError(
      "Upload did not return a usable image URL. Got embedded file data instead.",
      502,
    );
  }
}

function tokenDebug(token: string) {
  return {
    present: true,
    length: token.length,
    prefix: token.slice(0, 12),
    suffix: token.slice(-6),
  };
}

async function fetchMediaToken(): Promise<string> {
  console.log("[media] → fetch media-token");
  let res: Response;
  try {
    res = await fetch("/api/auth/media-token", {
      method: "GET",
      credentials: "same-origin",
    });
  } catch (err) {
    logMediaError("media-token network", err, {
      endpoint: "/api/auth/media-token",
    });
    throw new ApiError(
      err instanceof Error
        ? `Could not reach upload credentials endpoint: ${err.message}`
        : "Could not reach upload credentials endpoint.",
      0,
    );
  }

  const json = (await res.json().catch((parseErr) => {
    logMediaError("media-token JSON parse", parseErr, { status: res.status });
    return {};
  })) as {
    success?: boolean;
    message?: string;
    data?: { token?: string };
  };

  console.log("[media] ← media-token", {
    httpStatus: res.status,
    ok: res.ok,
    success: json.success,
    hasToken: !!json.data?.token,
    token: json.data?.token ? tokenDebug(json.data.token) : null,
    message: json.message ?? null,
  });

  if (!res.ok || !json.data?.token) {
    const status = res.status || 401;
    const err = new ApiError(
      json.message ?? "Could not get upload credentials. Sign in again.",
      status,
    );
    logMediaError("media-token rejected", err, { response: json });
    if (isUnauthorizedStatus(status)) {
      handleUnauthorized();
    }
    throw err;
  }

  return json.data.token;
}

export type UploadProgress = {
  percent: number;
  loaded: number;
  total: number;
};

/**
 * Multipart upload via same-origin rewrite → API media.upload.
 * Uses XHR so upload progress can drive the UI progress bar.
 */
function postMultipartDirect(
  file: File,
  token: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ url: string; key?: string }> {
  const form = new FormData();
  form.append("file", file, file.name);

  const endpoint = MEDIA_UPLOAD_ENDPOINT;
  const authHeader = `Bearer ${token}`;

  console.log("[media] → same-origin rewrite upload", {
    endpoint,
    rewrittenTo: `${API_ORIGIN}${MEDIA_UPLOAD_PATH}`,
    field: "file",
    name: file.name,
    size: file.size,
    type: file.type || "(empty)",
    hasAuthorization: true,
    authorizationScheme: "Bearer",
    token: tokenDebug(token),
    authHeaderLength: authHeader.length,
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      );
      onProgress?.({
        percent,
        loaded: event.loaded,
        total: event.total,
      });
    };

    xhr.onload = () => {
      const text = xhr.responseText ?? "";
      let json: unknown = null;
      if (text.trim()) {
        try {
          json = JSON.parse(text);
        } catch (parseErr) {
          logMediaError("direct upload response parse", parseErr, {
            endpoint,
            httpStatus: xhr.status,
            bodyPreview: text.slice(0, 500),
          });
          json = text.slice(0, 500);
        }
      }

      console.log("[media] ← same-origin rewrite upload", {
        endpoint,
        httpStatus: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        response: json,
      });

      if (xhr.status < 200 || xhr.status >= 300) {
        const message =
          json && typeof json === "object"
            ? ((json as { message?: string; error?: string }).message ??
              (json as { error?: string }).error)
            : undefined;
        const err = new ApiError(
          message ?? `Upload failed (HTTP ${xhr.status})`,
          xhr.status,
        );
        logMediaError("rewrite upload HTTP error", err, {
          endpoint,
          rewrittenTo: `${API_ORIGIN}${MEDIA_UPLOAD_PATH}`,
          httpStatus: xhr.status,
          response: json,
          hasAuthorization: true,
          token: tokenDebug(token),
        });
        reject(err);
        return;
      }

      try {
        const unwrapped = unwrapJson(json);
        const result = extractUploadResult(unwrapped);
        assertUsableMediaUrl(result.url, endpoint);
        onProgress?.({ percent: 100, loaded: file.size, total: file.size });
        console.log("[media] rewrite upload ok", {
          endpoint,
          url: result.url,
          key: result.key ?? null,
        });
        resolve(result);
      } catch (err) {
        logMediaError("rewrite upload result extract", err, {
          endpoint,
          response: json,
        });
        reject(err);
      }
    };

    xhr.onerror = () => {
      const err = new ApiError("Upload network error.", 0);
      logMediaError("rewrite upload network", err, {
        endpoint,
        rewrittenTo: `${API_ORIGIN}${MEDIA_UPLOAD_PATH}`,
        hasAuthorization: true,
        token: tokenDebug(token),
        file: { name: file.name, size: file.size, type: file.type || "(empty)" },
      });
      reject(err);
    };

    xhr.onabort = () => {
      reject(new ApiError("Upload cancelled.", 0));
    };

    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", authHeader);
    xhr.send(form);
  });
}

export async function uploadImage(
  file: File,
  options?: { onProgress?: (progress: UploadProgress) => void },
): Promise<{ url: string; key?: string }> {
  const sizeMb = file.size / (1024 * 1024);
  const onProgress = options?.onProgress;

  console.log("[media] uploadImage called", {
    name: file.name,
    size: file.size,
    sizeMb: Number(sizeMb.toFixed(2)),
    type: file.type || "(empty)",
    mock: useMockApi(),
    apiOrigin: API_ORIGIN,
    uploadPath: MEDIA_UPLOAD_ENDPOINT,
  });

  const validationError = validateImageFile(file);
  if (validationError) {
    logMediaError("validation", new Error(validationError), {
      name: file.name,
      size: file.size,
    });
    throw new Error(validationError);
  }

  if (useMockApi()) {
    onProgress?.({ percent: 30, loaded: 0, total: file.size });
    const url = await readAsDataUrl(file);
    onProgress?.({ percent: 100, loaded: file.size, total: file.size });
    console.log("[media] mock upload ok", { dataUrlLength: url.length });
    return { url };
  }

  try {
    onProgress?.({ percent: 0, loaded: 0, total: file.size });
    const token = await fetchMediaToken();
    console.log("[media] auth ready for rewrite upload", tokenDebug(token));
    return await postMultipartDirect(file, token, onProgress);
  } catch (err) {
    logMediaError("uploadImage", err, {
      name: file.name,
      size: file.size,
      apiOrigin: API_ORIGIN,
    });
    throw err;
  }
}
