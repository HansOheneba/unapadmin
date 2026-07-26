import type { Paginated } from "@/types";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083";
const WORKFLOW_PREFIX = "/workflow/execute";

/**
 * Browser traffic goes through the same-origin BFF proxy (`/api/backend/*`,
 * see app/api/backend/[...path]/route.ts) so the admin JWT stays in an
 * httpOnly cookie instead of client JS, and so there's no cross-origin CORS
 * call to the API host. Server-side calls (rare in this client-heavy app)
 * hit the API origin directly.
 */
export function apiBase(): string {
  if (typeof window !== "undefined") return "/api/backend";
  return API_ORIGIN;
}

export function useMockApi(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | undefined;

type RequestOptions = {
  method?: HttpMethod;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

type Envelope = {
  success?: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  errors?: unknown;
};

function toQueryString(query?: Record<string, QueryValue>): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function isEnvelope(payload: unknown): payload is Envelope {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  const obj = payload as Envelope & Record<string, unknown>;
  if ("success" in obj) return true;
  // Bare `{ data: T }` REST wrappers (no success/message) — but not if this
  // already looks like a domain entity (orders/products have their own fields).
  if (!("data" in obj) || obj.data === undefined) return false;
  const looksLikeEntity =
    typeof obj.id === "string" ||
    typeof obj.slug === "string" ||
    typeof obj.email === "string" ||
    Array.isArray(obj.items) ||
    Array.isArray(obj.variants);
  return !looksLikeEntity;
}

function unwrap(payload: unknown): unknown {
  if (!isEnvelope(payload)) return payload;
  if (payload.success === false) {
    const status =
      typeof (payload as { status?: unknown }).status === "number"
        ? ((payload as { status: number }).status)
        : 400;
    throw new ApiError(
      payload.message ?? payload.error ?? "Request failed",
      status,
    );
  }
  let data = payload.data;
  // Some workflow handlers double-wrap: { success, data: { success, data } }
  if (isEnvelope(data) && data.success !== false) {
    data = data.data;
  }
  return data;
}

/** Public alias for callers that already have a parsed JSON body. */
export function unwrapJson(payload: unknown): unknown {
  return unwrap(payload);
}

function errorMessage(err: unknown, status: number): string {
  if (!err || typeof err !== "object") return `HTTP ${status}`;
  const obj = err as Envelope;
  if (typeof obj.message === "string" && obj.message) return obj.message;
  if (typeof obj.error === "string" && obj.error) return obj.error;
  return `HTTP ${status}`;
}

async function request(
  path: string,
  { method = "GET", query, body }: RequestOptions = {},
): Promise<unknown> {
  const url = `${apiBase()}${path}${toQueryString(query)}`;

  console.log("[api] request", {
    method,
    endpoint: url,
    query: query ?? null,
    payload: body ?? null,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch (err) {
    console.error("[api] network error", {
      method,
      endpoint: url,
      query: query ?? null,
      payload: body ?? null,
      err,
    });
    throw err;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[api] error", {
      method,
      endpoint: url,
      status: res.status,
      query: query ?? null,
      payload: body ?? null,
      response: err,
    });
    throw new ApiError(errorMessage(err, res.status), res.status);
  }

  if (res.status === 204) {
    console.log("[api] response", { method, endpoint: url, status: 204, data: null });
    return undefined;
  }

  // Some endpoints return 200 with an empty body — don't throw on JSON parse.
  const text = await res.text();
  if (!text.trim()) {
    console.log("[api] response", { method, endpoint: url, status: res.status, data: null });
    return undefined;
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("[api] error", {
      method,
      endpoint: url,
      status: res.status,
      response: text.slice(0, 200),
    });
    throw new ApiError("Invalid JSON response from API", res.status);
  }

  console.log("[api] response", {
    method,
    endpoint: url,
    status: res.status,
    data: json,
  });
  return unwrap(json);
}

/** Admin usecases go through POST/GET `/workflow/execute/:usecase`. */
export async function execute<T>(
  usecase: string,
  options?: RequestOptions,
): Promise<T> {
  return request(`${WORKFLOW_PREFIX}/${usecase}`, options) as Promise<T>;
}

/**
 * Direct REST paths (v2 additions that are not yet workflow usecases,
 * e.g. `/riders`, `/search`, `/media/upload`).
 */
export async function rest<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  return request(path, options) as Promise<T>;
}

/**
 * Normalizes a list response into this app's flat `Paginated<T>` shape.
 * After envelope unwrap, backends may return either a bare array or
 * `{ data, total, page, pageSize, totalPages }`.
 */
export async function executePaginated<T>(
  usecase: string,
  options?: RequestOptions,
): Promise<Paginated<T>> {
  const payload = await execute<unknown>(usecase, options);

  if (Array.isArray(payload)) {
    return {
      data: payload as T[],
      total: payload.length,
      page: 1,
      pageSize: payload.length,
      totalPages: 1,
    };
  }

  const obj = (payload ?? {}) as {
    data?: T[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
  const items = obj.data ?? [];
  const page = obj.page ?? (options?.query?.page as number | undefined) ?? 1;
  const pageSize =
    obj.pageSize ??
    (options?.query?.pageSize as number | undefined) ??
    items.length;
  const total = obj.total ?? items.length;

  return {
    data: items,
    total,
    page,
    pageSize,
    totalPages:
      obj.totalPages ?? Math.max(1, Math.ceil(total / (pageSize || 1))),
  };
}

export async function restPaginated<T>(
  path: string,
  options?: RequestOptions,
): Promise<Paginated<T>> {
  const payload = await rest<unknown>(path, options);

  if (Array.isArray(payload)) {
    return {
      data: payload as T[],
      total: payload.length,
      page: 1,
      pageSize: payload.length,
      totalPages: 1,
    };
  }

  const obj = (payload ?? {}) as {
    data?: T[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
  const items = obj.data ?? [];
  const page = obj.page ?? (options?.query?.page as number | undefined) ?? 1;
  const pageSize =
    obj.pageSize ??
    (options?.query?.pageSize as number | undefined) ??
    items.length;
  const total = obj.total ?? items.length;

  return {
    data: items,
    total,
    page,
    pageSize,
    totalPages:
      obj.totalPages ?? Math.max(1, Math.ceil(total / (pageSize || 1))),
  };
}

/**
 * Runs `mockFn` while mock mode is on. Once real API mode is enabled
 * (`NEXT_PUBLIC_USE_MOCK_API=false`), real errors are surfaced instead of
 * silently falling back to mock data, so integration issues are visible.
 */
export async function executeOrMock<T>(
  usecase: string,
  mockFn: () => T | Promise<T>,
  options?: RequestOptions,
): Promise<T> {
  if (useMockApi()) return mockFn();
  return execute<T>(usecase, options);
}

export async function executePaginatedOrMock<T>(
  usecase: string,
  mockFn: () => Paginated<T> | Promise<Paginated<T>>,
  options?: RequestOptions,
): Promise<Paginated<T>> {
  if (useMockApi()) return mockFn();
  return executePaginated<T>(usecase, options);
}

export async function restOrMock<T>(
  path: string,
  mockFn: () => T | Promise<T>,
  options?: RequestOptions,
): Promise<T> {
  if (useMockApi()) return mockFn();
  return rest<T>(path, options);
}

export async function restPaginatedOrMock<T>(
  path: string,
  mockFn: () => Paginated<T> | Promise<Paginated<T>>,
  options?: RequestOptions,
): Promise<Paginated<T>> {
  if (useMockApi()) return mockFn();
  return restPaginated<T>(path, options);
}

/**
 * Downloads a file response (CSV, etc.) through the BFF proxy and triggers
 * a browser save. Used for workflow export usecases that return raw text.
 */
export async function downloadApiFile(
  path: string,
  filename: string,
  query?: Record<string, QueryValue>,
): Promise<void> {
  const url = `${apiBase()}${path}${toQueryString(query)}`;

  console.log("[api] request", {
    method: "GET",
    endpoint: url,
    query: query ?? null,
    payload: null,
  });

  const res = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[api] error", {
      method: "GET",
      endpoint: url,
      status: res.status,
      response: err,
    });
    throw new ApiError(errorMessage(err, res.status), res.status);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

/**
 * Multipart FormData to a workflow usecase. Caller builds FormData;
 * Content-Type is left unset so the browser sets the boundary.
 */
export async function executeMultipart<T>(
  usecase: string,
  form: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const url = `${apiBase()}${WORKFLOW_PREFIX}/${usecase}`;
  const fileNames = form
    .getAll("files")
    .map((v) => (v instanceof File ? v.name : String(v)));

  console.log("[api] multipart request", {
    method,
    endpoint: url,
    fields: [...form.keys()],
    files: fileNames,
  });

  const res = await fetch(url, {
    method,
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

  console.log("[api] multipart response", {
    method,
    endpoint: url,
    status: res.status,
    data: json,
  });

  if (!res.ok) {
    throw new ApiError(errorMessage(json, res.status), res.status);
  }

  return unwrap(json) as T;
}

/** @deprecated Prefer `uploadImage` from `lib/api/media` (richer logging + fallbacks). */
export async function uploadFile(
  file: File,
): Promise<{ url: string; key?: string }> {
  const { uploadImage } = await import("./media");
  return uploadImage(file);
}
