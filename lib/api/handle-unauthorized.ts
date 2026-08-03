import { useAuthStore } from "@/lib/auth-store";

let redirecting = false;

/**
 * Expired / invalid session: clear local state and send the user to login.
 * No toast, no retry UI — hard navigation stops further error rendering.
 */
export function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  if (redirecting) return;
  if (window.location.pathname.startsWith("/login")) return;

  redirecting = true;
  useAuthStore.getState().logout();
  void fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => undefined);
  window.location.replace("/login");
}

export function isUnauthorizedStatus(status: number): boolean {
  return status === 401;
}
