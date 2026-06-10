"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUsers,
  getSettings,
  inviteAdminUser,
  removeAdminUser,
  updateSettings,
} from "@/lib/api/settings";
import type { AdminUser, StoreSettings } from "@/types";
import { queryKeys } from "./query-keys";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: getSettings,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: getAdminUsers,
  });
}

export function useSettingsMutations() {
  const qc = useQueryClient();
  const invalidateSettings = () =>
    qc.invalidateQueries({ queryKey: queryKeys.settings });
  const invalidateAdmins = () =>
    qc.invalidateQueries({ queryKey: queryKeys.adminUsers });
  const invalidateBadges = () =>
    qc.invalidateQueries({ queryKey: queryKeys.badges });

  const update = useMutation({
    mutationFn: (patch: Partial<StoreSettings>) => updateSettings(patch),
    onSuccess: () => {
      invalidateSettings();
      invalidateBadges();
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

  return { update, invite, removeAdmin };
}
