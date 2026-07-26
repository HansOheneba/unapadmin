"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  getProduct,
  getProducts,
  toggleProductVisibility,
  updateProduct,
  type ProductImageUpload,
  type ProductListParams,
} from "@/lib/api/products";
import type { Product } from "@/types";
import { queryKeys } from "./query-keys";

export type ProductUpsertInput = {
  product: Product;
  uploads?: ProductImageUpload[];
};

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => getProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

export function useProductMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const upsert = useMutation({
    mutationFn: async ({ product, uploads = [] }: ProductUpsertInput) => {
      // New products have an empty id. Never send client temp ids like prod_*.
      if (!product.id?.trim()) {
        return createProduct(product, uploads);
      }
      return updateProduct(product.id, product, uploads);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteProduct,
    onSuccess: invalidate,
  });

  const toggleVisibility = useMutation({
    mutationFn: toggleProductVisibility,
    onSuccess: invalidate,
  });

  const duplicate = useMutation({
    mutationFn: duplicateProduct,
    onSuccess: invalidate,
  });

  return { upsert, remove, toggleVisibility, duplicate };
}
