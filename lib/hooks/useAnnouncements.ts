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
    mutationFn: (patch: Partial<BannerConfig>) => updateBannerConfig(patch),
    onSuccess: invalidate,
  });

  const upsertMessage = useMutation({
    mutationFn: async (m: BannerMessage) => {
      if (m.id && (await getBannerMessages()).some((x) => x.id === m.id)) {
        return updateBannerMessage(m.id, m);
      }
      const { id: _id, createdAt: _c, updatedAt: _u, ...body } = m;
      void _id;
      void _c;
      void _u;
      return createBannerMessage(body);
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
