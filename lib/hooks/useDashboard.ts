"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/api/dashboard";
import { mockGetBadgeCounts } from "@/lib/mock/data-store";
import { queryKeys } from "./query-keys";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardStats,
    staleTime: 60_000,
  });
}

export function useBadgeCounts() {
  return useQuery({
    queryKey: queryKeys.badges,
    queryFn: () => Promise.resolve(mockGetBadgeCounts()),
    staleTime: 60_000,
  });
}
