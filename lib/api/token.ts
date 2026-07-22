// Only used in mock API mode (see lib/api/auth.ts). In real API mode the
// admin JWT lives in an httpOnly session cookie managed by the BFF routes
// (lib/api/session.ts, app/api/auth/*, app/api/backend/*) and never touches
// client JS.
const TOKEN_KEY = "unap-admin-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
