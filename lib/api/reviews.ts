import type { Paginated, Review } from "@/types";
import { executeOrMock, executePaginatedOrMock } from "./client";
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

export async function getReviews(
  params: ReviewListParams = {},
): Promise<Paginated<Review>> {
  return executePaginatedOrMock(
    "review.list",
    () => mockGetReviews(params),
    { method: "GET", query: params },
  );
}

export async function updateReviewStatus(
  id: string,
  status: Review["status"],
  adminNote?: string,
): Promise<Review> {
  return executeOrMock(
    "review.update-status",
    () => {
      const r = mockUpdateReviewStatus(id, status, adminNote);
      if (!r) throw new Error("Review not found");
      return r;
    },
    { method: "PATCH", body: { id, status, adminNote } },
  );
}

export async function deleteReview(id: string): Promise<void> {
  return executeOrMock(
    "review.delete",
    () => mockDeleteReview(id),
    { method: "DELETE", body: { id } },
  );
}
