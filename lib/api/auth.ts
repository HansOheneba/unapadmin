import type { AdminUser } from "@/types";
import { ApiError, executeOrMock, useMockApi } from "./client";
import {
  mockGetMe,
  mockSendOtp,
  mockVerifyOtp,
} from "@/lib/mock/data-store";
import { clearToken, getToken, setToken } from "./token";

export async function sendOtp(email: string): Promise<{ message: string }> {
  return executeOrMock("auth.send-otp", () => mockSendOtp(email), {
    method: "POST",
    body: { email },
  });
}

/**
 * In real API mode this hits a dedicated BFF route (not the generic
 * /api/backend proxy) because it needs to seal the JWT into an httpOnly
 * cookie server-side rather than returning it to client JS.
 */
export async function verifyOtp(
  email: string,
  otp: string,
): Promise<AdminUser> {
  if (useMockApi()) {
    const result = mockVerifyOtp(email, otp);
    if (!result) throw new Error("Invalid or expired code.");
    setToken(result.token);
    return result.user;
  }

  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code: otp }),
    credentials: "same-origin",
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.success === false) {
    throw new ApiError(
      json?.message ?? "Invalid or expired code.",
      res.status,
    );
  }

  const user = json?.data?.user as AdminUser | undefined;
  if (!user) throw new Error("Invalid or expired code.");
  return user;
}

export async function getMe(): Promise<AdminUser> {
  return executeOrMock("auth.me", () => {
    const user = mockGetMe(getToken());
    if (!user) throw new Error("Unauthorized");
    return user;
  });
}

export async function logout(): Promise<void> {
  if (useMockApi()) {
    clearToken();
    return;
  }
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => undefined);
}
