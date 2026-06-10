import type { AdminUser } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockGetMe,
  mockSendOtp,
  mockVerifyOtp,
} from "@/lib/mock/data-store";
import { getToken } from "./token";

export async function sendOtp(email: string): Promise<{ message: string }> {
  return apiFetchOrMock(
    "/auth/send-otp",
    () => mockSendOtp(email),
    { method: "POST", body: JSON.stringify({ email }) },
  );
}

export async function verifyOtp(
  email: string,
  otp: string,
): Promise<{ token: string; user: AdminUser }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API !== "false") {
    const result = mockVerifyOtp(email, otp);
    if (!result) throw new Error("Invalid or expired code.");
    return result;
  }
  return apiFetchOrMock(
    "/auth/verify-otp",
    () => {
      const result = mockVerifyOtp(email, otp);
      if (!result) throw new Error("Invalid or expired code.");
      return result;
    },
    { method: "POST", body: JSON.stringify({ email, otp }) },
  );
}

export async function getMe(): Promise<AdminUser> {
  return apiFetchOrMock("/auth/me", () => {
    const user = mockGetMe(getToken());
    if (!user) throw new Error("Unauthorized");
    return user;
  });
}

export async function logout(): Promise<void> {
  return apiFetchOrMock(
    "/auth/logout",
    () => undefined,
    { method: "POST" },
  );
}
