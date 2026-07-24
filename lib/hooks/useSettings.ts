"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUsers,
  getSettings,
  inviteAdminUser,
  removeAdminUser,
  updateAdminUserRole,
  updateSettings,
} from "@/lib/api/settings";
import type { AdminUser, StoreSettings } from "@/types";
import { queryKeys } from "./query-keys";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: getSettings,
    staleTime: 60_000,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: getAdminUsers,
    staleTime: 60_000,
  });
}

export function useSettingsMutations() {
  const qc = useQueryClient();
  const invalidateSettings = () =>
    qc.invalidateQueries({ queryKey: queryKeys.settings });
  const invalidateAdmins = () =>
    qc.invalidateQueries({ queryKey: queryKeys.adminUsers });
  const update = useMutation({
    mutationFn: (patch: Partial<StoreSettings>) => updateSettings(patch),
    onSuccess: () => {
      invalidateSettings();
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const invite = useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      role: AdminUser["role"];
    }) => inviteAdminUser(body),
    onSuccess: invalidateAdmins,
  });

  const removeAdmin = useMutation({
    mutationFn: removeAdminUser,
    onSuccess: invalidateAdmins,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUser["role"] }) =>
      updateAdminUserRole(id, role),
    onSuccess: invalidateAdmins,
  });

  return { update, invite, removeAdmin, updateRole };
}
