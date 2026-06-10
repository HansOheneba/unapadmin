import { getToken } from "./token";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(
      (err as { error?: string }).error ?? `HTTP ${res.status}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiFetchOrMock<T>(
  path: string,
  mockFn: () => T | Promise<T>,
  options?: RequestInit,
): Promise<T> {
  if (useMockApi()) return mockFn();
  try {
    return await apiFetch<T>(path, options);
  } catch {
    return mockFn();
  }
}
