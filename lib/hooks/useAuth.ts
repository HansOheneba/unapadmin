"use client";

import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import type { AdminRole } from "@/types";

export function useAuth() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const role = currentUser?.role as AdminRole | undefined;

  return {
    currentUser,
    role,
    can: (action: Parameters<typeof can>[1]) => can(role, action),
    isViewer: role === "viewer",
    isSuperAdmin: role === "super_admin",
  };
}
