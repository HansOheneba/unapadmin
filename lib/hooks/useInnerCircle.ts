"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInnerCircle,
  updateInnerCircleStatus,
  type InnerCircleListParams,
} from "@/lib/api/inner-circle";
import type { InnerCircleMember } from "@/types";
import { queryKeys } from "./query-keys";

export function useInnerCircle(params: InnerCircleListParams = {}) {
  return useQuery({
    queryKey: queryKeys.innerCircle(params),
    queryFn: () => getInnerCircle(params),
  });
}

export function useInnerCircleMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["inner-circle"] });
    qc.invalidateQueries({ queryKey: ["customers"] });
  };

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: InnerCircleMember["status"];
      note?: string;
    }) => updateInnerCircleStatus(id, status, note),
    onSuccess: invalidate,
  });

  return { updateStatus };
}
