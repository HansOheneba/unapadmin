import type { DashboardStats, OrderStatus } from "@/types";
import { executeOrMock } from "./client";
import { mockGetDashboardStats } from "@/lib/mock/data-store";

export type BadgeCounts = {
  pendingOrders: number;
  lowStock: number;
  pendingReviews: number;
  innerCirclePending: number;
};

const PIPELINE_STATUSES: OrderStatus[] = [
  "processing",
  "ready_for_pickup",
  "picked_up",
  "in_transit",
  "returned",
];

export async function getDashboardStats(): Promise<DashboardStats> {
  return executeOrMock("dashboard.stats", mockGetDashboardStats);
}

/**
 * Sidebar badges derived from the single dashboard.stats payload.
 * Avoids fan-out list calls (which were 429-prone on every admin page load).
 * Review / Inner Circle badges stay 0 until the API exposes those counts.
 */
export function badgeCountsFromStats(stats: DashboardStats): BadgeCounts {
  const byStatus = new Map(
    stats.ordersByStatus.map((row) => [row.status, row.count]),
  );
  const fromStatuses = PIPELINE_STATUSES.reduce(
    (sum, status) => sum + (byStatus.get(status) ?? 0),
    0,
  );

  return {
    pendingOrders:
      fromStatuses > 0 ? fromStatuses : stats.pendingAndProcessingOrders,
    lowStock: stats.lowStockCount,
    pendingReviews: 0,
    innerCirclePending: 0,
  };
}
