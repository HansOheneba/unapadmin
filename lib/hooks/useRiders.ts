"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRider,
  deleteRider,
  getRider,
  getRiders,
  updateRider,
  type RiderListParams,
} from "@/lib/api/riders";
import type { Rider } from "@/types";
import { queryKeys } from "./query-keys";

export function useRiders(params: RiderListParams = {}) {
  return useQuery({
    queryKey: queryKeys.riders(params),
    queryFn: () => getRiders(params),
  });
}

export function useRider(id: string) {
  return useQuery({
    queryKey: queryKeys.rider(id),
    queryFn: () => getRider(id),
    enabled: !!id,
  });
}

export function useRiderMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["riders"] });

  const upsert = useMutation({
    mutationFn: async (r: Rider) => {
      if (r.id) {
        try {
          await getRider(r.id);
          return updateRider(r.id, r);
        } catch {
          return createRider(r);
        }
      }
      return createRider(r);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteRider,
    onSuccess: invalidate,
  });

  return { upsert, remove };
}
