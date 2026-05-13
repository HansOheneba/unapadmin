import type { AdminUser } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_ADMIN_USERS: AdminUser[] = [
  { id: "1", name: "Hans Opoku", email: "hans@unapologetic.com", role: "SUPER_ADMIN", createdAt: new Date().toISOString() },
  { id: "2", name: "Manager User", email: "manager@unapologetic.com", role: "MANAGER", createdAt: new Date().toISOString() },
];

export const getAdminUsers = (): Promise<AdminUser[]> =>
  Promise.resolve(MOCK_ADMIN_USERS); // TODO: remove mock — apiFetch<AdminUser[]>("/admin-users")

export const createAdminUser = (body: { name: string; email: string; role: string }) =>
  apiFetch<AdminUser>("/admin-users", { method: "POST", body: JSON.stringify(body) });

export const updateAdminUser = (id: string, body: { role: string }) =>
  apiFetch<AdminUser>(`/admin-users/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteAdminUser = (id: string) =>
  apiFetch<void>(`/admin-users/${id}`, { method: "DELETE" });

export const getSettings = (): Promise<{
  storeName: string;
  contactEmail: string;
  currency: string;
  defaultCountry: string;
}> =>
  Promise.resolve({ storeName: "Unapologetic", contactEmail: "hello@unapologetic.com", currency: "USD", defaultCountry: "GH" }); // TODO: remove mock — apiFetch<...>("/settings")

export const updateSettings = (body: {
  storeName?: string;
  contactEmail?: string;
  currency?: string;
  defaultCountry?: string;
}) =>
  apiFetch<{ storeName: string; contactEmail: string; currency: string; defaultCountry: string }>(
    "/settings",
    { method: "PATCH", body: JSON.stringify(body) },
  );
