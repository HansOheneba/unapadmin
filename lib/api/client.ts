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
function apiBase(): string {
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
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as Envelope;
  return "success" in obj || ("data" in obj && ("message" in obj || "errors" in obj));
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
  return payload.data;
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

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch (err) {
    console.error("[api] network error", method, url, body ?? null, err);
    throw err;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[api] error", method, url, res.status, err);
    throw new ApiError(errorMessage(err, res.status), res.status);
  }

  if (res.status === 204) return undefined;
  return unwrap(await res.json());
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

/** Uploads a file via multipart/form-data to POST /media/upload. */
export async function uploadFile(
  file: File,
): Promise<{ url: string; key?: string }> {
  const form = new FormData();
  form.append("file", file);
  const url = `${apiBase()}/media/upload`;

  const res = await fetch(url, {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[api] error", "POST", url, res.status, err);
    throw new ApiError(errorMessage(err, res.status), res.status);
  }

  return unwrap(await res.json()) as { url: string; key?: string };
}
