import type { Product } from "@/types";
import { apiFetch } from "./client";
import { MOCK_PRODUCTS_WITH_STOCK } from "./products-inventory";

export const getInventory = (): Promise<Product[]> => {
  // TODO: remove mock
  const sorted = [...MOCK_PRODUCTS_WITH_STOCK].sort(
    (a, b) => a.stock - b.stock,
  );
  return Promise.resolve(sorted);
};

export const updateInventory = (
  productId: string,
  body: { stock: number; lowStockThreshold: number },
) =>
  apiFetch<Product>(`/inventory/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
