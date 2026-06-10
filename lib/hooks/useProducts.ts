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
  type ProductListParams,
} from "@/lib/api/products";
import type { Product } from "@/types";
import { queryKeys } from "./query-keys";

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
    qc.invalidateQueries({ queryKey: queryKeys.badges });
  };

  const upsert = useMutation({
    mutationFn: async (p: Product) => {
      if (p.id) {
        try {
          await getProduct(p.id);
          return updateProduct(p.id, p);
        } catch {
          return createProduct(p);
        }
      }
      return createProduct(p);
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
