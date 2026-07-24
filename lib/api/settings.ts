import type { AdminUser, StoreSettings } from "@/types";
import { restOrMock } from "./client";
import {
  mockGetAdmins,
  mockGetSettings,
  mockInviteAdmin,
  mockRemoveAdmin,
  mockUpdateAdminRole,
  mockUpdateSettings,
} from "@/lib/mock/data-store";

export const EMPTY_SETTINGS: StoreSettings = {
  adminEmailForOrders: "",
  adminEmailForLowStock: "",
  lowStockThreshold: 5,
};

export function normalizeSettings(raw: unknown): StoreSettings {
  const obj = (raw ?? {}) as Partial<Record<keyof StoreSettings, unknown>>;
  const threshold = obj.lowStockThreshold;
  return {
    adminEmailForOrders:
      typeof obj.adminEmailForOrders === "string"
        ? obj.adminEmailForOrders
        : EMPTY_SETTINGS.adminEmailForOrders,
    adminEmailForLowStock:
      typeof obj.adminEmailForLowStock === "string"
        ? obj.adminEmailForLowStock
        : EMPTY_SETTINGS.adminEmailForLowStock,
    lowStockThreshold:
      typeof threshold === "number" && Number.isFinite(threshold)
        ? threshold
        : EMPTY_SETTINGS.lowStockThreshold,
  };
}

export async function getSettings(): Promise<StoreSettings> {
  const raw = await restOrMock("/settings", mockGetSettings);
  if (!raw || typeof raw !== "object") {
    throw new Error("Settings response was empty.");
  }
  return normalizeSettings(raw);
}

export async function updateSettings(
  patch: Partial<StoreSettings>,
): Promise<StoreSettings> {
  const raw = await restOrMock(
    "/settings",
    () => mockUpdateSettings(patch),
    { method: "PATCH", body: patch },
  );
  return normalizeSettings(raw);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const raw = await restOrMock<AdminUser[] | { data?: AdminUser[] }>(
    "/admin-users",
    mockGetAdmins,
  );
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data;
  throw new Error("Admin users response was empty.");
}

export async function inviteAdminUser(body: {
  name: string;
  email: string;
  role: AdminUser["role"];
}): Promise<AdminUser> {
  return restOrMock(
    "/admin-users",
    () => mockInviteAdmin(body.name, body.email, body.role),
    { method: "POST", body },
  );
}

export async function updateAdminUserRole(
  id: string,
  role: AdminUser["role"],
): Promise<AdminUser> {
  return restOrMock(
    `/admin-users/${id}/role`,
    () => mockUpdateAdminRole(id, role),
    { method: "PATCH", body: { role } },
  );
}

export async function removeAdminUser(id: string): Promise<void> {
  return restOrMock(`/admin-users/${id}`, () => mockRemoveAdmin(id), {
    method: "DELETE",
  });
}
