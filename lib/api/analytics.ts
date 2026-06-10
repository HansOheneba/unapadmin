import type { AnalyticsReport } from "@/types";
import { apiFetchOrMock } from "./client";
import { mockGetAnalytics } from "@/lib/mock/data-store";

export async function getAnalytics(
  from: string,
  to: string,
): Promise<AnalyticsReport> {
  return apiFetchOrMock(
    `/analytics?from=${from}&to=${to}`,
    () => mockGetAnalytics(from, to),
  );
}
