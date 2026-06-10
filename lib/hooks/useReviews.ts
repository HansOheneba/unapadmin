"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteReview,
  getReviews,
  updateReviewStatus,
  type ReviewListParams,
} from "@/lib/api/reviews";
import type { Review } from "@/types";
import { queryKeys } from "./query-keys";

export function useReviews(params: ReviewListParams = {}) {
  return useQuery({
    queryKey: queryKeys.reviews(params),
    queryFn: () => getReviews(params),
  });
}

export function useReviewMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reviews"] });
    qc.invalidateQueries({ queryKey: queryKeys.badges });
  };

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: Review["status"];
      adminNote?: string;
    }) => updateReviewStatus(id, status, adminNote),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteReview,
    onSuccess: invalidate,
  });

  return { updateStatus, remove };
}
