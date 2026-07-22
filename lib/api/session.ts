/**
 * Server-only session cookie config shared by the BFF route handlers
 * (`app/api/auth/*`, `app/api/backend/*`). The admin JWT lives only in this
 * httpOnly cookie — it never reaches client-side JS or localStorage in real
 * API mode, so it survives reloads and isn't exposed to XSS.
 */
export const SESSION_COOKIE = "unap_admin_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
