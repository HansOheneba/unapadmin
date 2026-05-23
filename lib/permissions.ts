import type { AdminRole } from "@/types";

type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "manage_users"
  | "manage_affiliates"
  | "manage_settings"
  | "export";

const permissions: Record<AdminRole, Action[]> = {
  super_admin: [
    "view",
    "create",
    "edit",
    "delete",
    "manage_users",
    "manage_affiliates",
    "manage_settings",
    "export",
  ],
  admin: ["view", "create", "edit", "delete", "manage_affiliates", "export"],
  viewer: ["view"],
};

export function can(role: AdminRole | undefined, action: Action): boolean {
  if (!role) return false;
  return permissions[role]?.includes(action) ?? false;
}
