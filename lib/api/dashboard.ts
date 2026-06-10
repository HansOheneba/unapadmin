import type { DashboardStats } from "@/types";
import { apiFetchOrMock } from "./client";
import { mockGetDashboardStats } from "@/lib/mock/data-store";

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetchOrMock("/dashboard/stats", mockGetDashboardStats);
}
