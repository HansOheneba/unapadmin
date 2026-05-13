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
  SUPER_ADMIN: [
    "view",
    "create",
    "edit",
    "delete",
    "manage_users",
    "manage_affiliates",
    "manage_settings",
    "export",
  ],
  MANAGER: ["view", "create", "edit", "delete", "manage_affiliates", "export"],
  EDITOR: ["view", "create", "edit", "export"],
  VIEWER: ["view"],
};

export function can(role: AdminRole | undefined, action: Action): boolean {
  if (!role) return false;
  return permissions[role]?.includes(action) ?? false;
}
