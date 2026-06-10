"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  deleteCollection,
  getCollections,
  reorderCollections,
  updateCollection,
} from "@/lib/api/collections";
import type { Collection } from "@/types";
import { queryKeys } from "./query-keys";

export function useCollections() {
  return useQuery({
    queryKey: queryKeys.collections,
    queryFn: getCollections,
  });
}

export function useCollectionMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.collections });
    qc.invalidateQueries({ queryKey: queryKeys.products() });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    qc.invalidateQueries({ queryKey: queryKeys.badges });
  };

  const upsert = useMutation({
    mutationFn: async (c: Collection) => {
      if (c.id && (await getCollections()).some((x) => x.id === c.id)) {
        return updateCollection(c.id, c);
      }
      return createCollection(c);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteCollection,
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: reorderCollections,
    onSuccess: invalidate,
  });

  return { upsert, remove, reorder };
}
