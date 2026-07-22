import type { AdminUser, StoreSettings } from "@/types";
import { executeOrMock } from "./client";
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
  const raw = await executeOrMock("settings.get", mockGetSettings);
  if (!raw || typeof raw !== "object") {
    throw new Error("Settings response was empty.");
  }
  return normalizeSettings(raw);
}

export async function updateSettings(
  patch: Partial<StoreSettings>,
): Promise<StoreSettings> {
  const raw = await executeOrMock(
    "settings.update",
    () => mockUpdateSettings(patch),
    { method: "PATCH", body: patch },
  );
  return normalizeSettings(raw);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const raw = await executeOrMock<AdminUser[] | { data?: AdminUser[] }>(
    "admin-user.list",
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
  return executeOrMock(
    "admin-user.create",
    () => mockInviteAdmin(body.name, body.email, body.role),
    { method: "POST", body },
  );
}

export async function updateAdminUserRole(
  id: string,
  role: AdminUser["role"],
): Promise<AdminUser> {
  return executeOrMock(
    "admin-user.update-role",
    () => mockUpdateAdminRole(id, role),
    { method: "PATCH", body: { id, role } },
  );
}

export async function removeAdminUser(id: string): Promise<void> {
  return executeOrMock(
    "admin-user.delete",
    () => mockRemoveAdmin(id),
    { method: "DELETE", body: { id } },
  );
}
