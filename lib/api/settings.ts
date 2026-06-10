import type { AdminUser, StoreSettings } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockGetAdmins,
  mockGetSettings,
  mockInviteAdmin,
  mockRemoveAdmin,
  mockUpdateSettings,
} from "@/lib/mock/data-store";

export async function getSettings(): Promise<StoreSettings> {
  return apiFetchOrMock("/settings", mockGetSettings);
}

export async function updateSettings(
  patch: Partial<StoreSettings>,
): Promise<StoreSettings> {
  return apiFetchOrMock(
    "/settings",
    () => mockUpdateSettings(patch),
    { method: "PATCH", body: JSON.stringify(patch) },
  );
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiFetchOrMock("/admin-users", mockGetAdmins);
}

export async function inviteAdminUser(body: {
  name: string;
  email: string;
  role: AdminUser["role"];
}): Promise<AdminUser> {
  return apiFetchOrMock(
    "/admin-users",
    () => mockInviteAdmin(body.name, body.email, body.role),
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function removeAdminUser(id: string): Promise<void> {
  return apiFetchOrMock(
    `/admin-users/${id}`,
    () => mockRemoveAdmin(id),
    { method: "DELETE" },
  );
}
