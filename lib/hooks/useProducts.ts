"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, getProduct, updateProduct, deleteProduct, updateProductStock } from "@/lib/api/products";
import type { Product } from "@/types";

export const useProducts = (params: { collectionId?: string; q?: string; page?: number } = {}) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ["products", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Product> }) =>
      updateProduct(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useUpdateProductStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      updateProductStock(id, stock),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};
