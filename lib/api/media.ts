import { ApiError, apiBase, unwrapJson, useMockApi } from "./client";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Client-side max for image picks. Note: uploads still go through the Vercel
 * BFF (`/api/backend`), which hard-caps bodies around 4.5MB — larger files may
 * still fail with FUNCTION_PAYLOAD_TOO_LARGE until uploads bypass that proxy.
 */
export const MAX_UPLOAD_LABEL = "10MB";

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

  const urlCandidates = [nested.url, nested.fileUrl, nested.src, nested.location];
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

async function postMultipart(
  path: string,
  file: File,
): Promise<{ url: string; key?: string }> {
  const form = new FormData();
  form.append("file", file, file.name);

  const endpoint = `${apiBase()}${path}`;
  console.log("[media] → multipart upload", {
    endpoint,
    field: "file",
    name: file.name,
    size: file.size,
    type: file.type || "(empty)",
  });

  // Do not set Content-Type manually — the browser must add the multipart boundary.
  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });

  const text = await res.text();
  let json: unknown = null;
  if (text.trim()) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text.slice(0, 500);
    }
  }

  console.log("[media] ← multipart upload", {
    endpoint,
    httpStatus: res.status,
    ok: res.ok,
    response: json,
  });

  if (!res.ok) {
    const message =
      json && typeof json === "object"
        ? ((json as { message?: string; error?: string }).message ??
          (json as { error?: string }).error)
        : undefined;
    throw new ApiError(
      message ?? `Upload failed (HTTP ${res.status})`,
      res.status,
    );
  }

  const unwrapped = unwrapJson(json);
  const result = extractUploadResult(unwrapped);

  if (
    result.url.startsWith("data:") ||
    result.url.startsWith("blob:") ||
    (result.url.length > 2048 && !/^https?:\/\//i.test(result.url))
  ) {
    console.error("[media] upload returned non-URL payload", {
      endpoint,
      urlLength: result.url.length,
      urlPrefix: result.url.slice(0, 64),
    });
    throw new ApiError(
      "Upload did not return a usable image URL. Got embedded file data instead.",
      502,
    );
  }

  return result;
}

export async function uploadImage(file: File): Promise<{ url: string; key?: string }> {
  const sizeMb = file.size / (1024 * 1024);
  console.log("[media] uploadImage called", {
    name: file.name,
    size: file.size,
    sizeMb: Number(sizeMb.toFixed(2)),
    type: file.type || "(empty)",
    mock: useMockApi(),
  });

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (useMockApi()) {
    const url = await readAsDataUrl(file);
    console.log("[media] mock upload ok", { dataUrlLength: url.length });
    return { url };
  }

  try {
    return await postMultipart("/media/upload", file);
  } catch (restErr) {
    console.warn("[media] REST /media/upload failed, trying workflow", {
      message: restErr instanceof Error ? restErr.message : String(restErr),
      status: restErr instanceof ApiError ? restErr.status : undefined,
    });
    try {
      return await postMultipart("/workflow/execute/media.upload", file);
    } catch (workflowErr) {
      console.warn("[media] workflow media.upload also failed", {
        message:
          workflowErr instanceof Error
            ? workflowErr.message
            : String(workflowErr),
        status:
          workflowErr instanceof ApiError ? workflowErr.status : undefined,
      });
      throw workflowErr;
    }
  }
}
