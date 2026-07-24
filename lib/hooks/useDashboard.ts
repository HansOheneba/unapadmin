"use client";

import { useQuery } from "@tanstack/react-query";
import {
  badgeCountsFromStats,
  getDashboardStats,
  type BadgeCounts,
} from "@/lib/api/dashboard";
import { queryKeys } from "./query-keys";

const DASHBOARD_STALE_MS = 5 * 60_000;

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardStats,
    staleTime: DASHBOARD_STALE_MS,
  });
}

/** Shares the dashboard.stats query — no extra network for nav badges. */
export function useBadgeCounts() {
  const query = useDashboardStats();
  const data: BadgeCounts | undefined = query.data
    ? badgeCountsFromStats(query.data)
    : undefined;

  return { ...query, data };
}
