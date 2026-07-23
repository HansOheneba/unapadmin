"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBannerMessage,
  deleteBannerMessage,
  getBannerConfig,
  getBannerMessages,
  reorderBannerMessages,
  updateBannerConfig,
  updateBannerMessage,
} from "@/lib/api/announcements";
import type { BannerConfig, BannerMessage } from "@/types";
import { queryKeys } from "./query-keys";

export function useBannerConfig() {
  return useQuery({
    queryKey: queryKeys.bannerConfig,
    queryFn: getBannerConfig,
  });
}

export function useBannerMessages() {
  return useQuery({
    queryKey: queryKeys.bannerMessages,
    queryFn: getBannerMessages,
  });
}

export function useAnnouncementMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.bannerConfig });
    qc.invalidateQueries({ queryKey: queryKeys.bannerMessages });
  };

  const updateConfig = useMutation({
    mutationFn: (config: BannerConfig) => updateBannerConfig(config),
    onSuccess: invalidate,
  });

  const upsertMessage = useMutation({
    mutationFn: async (m: BannerMessage) => {
      if (m.id) {
        return updateBannerMessage(m.id, {
          text: m.text,
          href: m.href,
          isActive: m.isActive,
          startsAt: m.startsAt,
          endsAt: m.endsAt,
          sortOrder: m.sortOrder,
        });
      }
      return createBannerMessage({
        text: m.text,
        href: m.href,
        isActive: m.isActive,
        startsAt: m.startsAt,
        endsAt: m.endsAt,
        sortOrder: m.sortOrder,
      });
    },
    onSuccess: invalidate,
  });

  const removeMessage = useMutation({
    mutationFn: deleteBannerMessage,
    onSuccess: invalidate,
  });

  const reorderMessages = useMutation({
    mutationFn: reorderBannerMessages,
    onSuccess: invalidate,
  });

  return { updateConfig, upsertMessage, removeMessage, reorderMessages };
}
