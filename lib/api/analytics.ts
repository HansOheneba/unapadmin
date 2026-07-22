import type { AnalyticsReport } from "@/types";
import { executeOrMock } from "./client";
import { mockGetAnalytics } from "@/lib/mock/data-store";

export async function getAnalytics(
  from: string,
  to: string,
): Promise<AnalyticsReport> {
  return executeOrMock(
    "analytics.get",
    () => mockGetAnalytics(from, to),
    { method: "GET", query: { from, to } },
  );
}
