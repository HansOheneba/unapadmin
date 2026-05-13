"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  reorderCollections,
} from "@/lib/api/collections";
import type { Collection } from "@/types";

export const useCollections = () =>
  useQuery({ queryKey: ["collections"], queryFn: getCollections });

export const useCreateCollection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCollection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
};

export const useUpdateCollection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Collection> }) =>
      updateCollection(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
};

export const useDeleteCollection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
};

export const useReorderCollections = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reorderCollections,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
};
