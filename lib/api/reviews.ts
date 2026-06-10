import type { Paginated, Review } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockDeleteReview,
  mockGetReviews,
  mockUpdateReviewStatus,
} from "@/lib/mock/data-store";

export type ReviewListParams = {
  status?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getReviews(
  params: ReviewListParams = {},
): Promise<Paginated<Review>> {
  return apiFetchOrMock(
    `/reviews${toQuery(params)}`,
    () => mockGetReviews(params),
  );
}

export async function updateReviewStatus(
  id: string,
  status: Review["status"],
  adminNote?: string,
): Promise<Review> {
  return apiFetchOrMock(
    `/reviews/${id}/status`,
    () => {
      const r = mockUpdateReviewStatus(id, status, adminNote);
      if (!r) throw new Error("Review not found");
      return r;
    },
    { method: "PATCH", body: JSON.stringify({ status, adminNote }) },
  );
}

export async function deleteReview(id: string): Promise<void> {
  return apiFetchOrMock(
    `/reviews/${id}`,
    () => mockDeleteReview(id),
    { method: "DELETE" },
  );
}
