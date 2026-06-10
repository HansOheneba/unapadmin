import type { Paginated, Product } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockDeleteProduct,
  mockDuplicateProduct,
  mockGetProduct,
  mockGetProducts,
  mockToggleProductVisibility,
  mockUpsertProduct,
} from "@/lib/mock/data-store";

export type ProductListParams = {
  collectionId?: string;
  q?: string;
  visibility?: "visible" | "hidden" | "all";
  stock?: "in" | "low" | "out" | "all";
  page?: number;
  pageSize?: number;
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getProducts(
  params: ProductListParams = {},
): Promise<Paginated<Product>> {
  return apiFetchOrMock(
    `/products${toQuery(params)}`,
    () => mockGetProducts(params),
  );
}

export async function getProduct(id: string): Promise<Product> {
  return apiFetchOrMock(`/products/${id}`, () => {
    const p = mockGetProduct(id);
    if (!p) throw new Error("Product not found");
    return p;
  });
}

export async function createProduct(
  body: Omit<
    Product,
    "id" | "totalStock" | "totalSold" | "averageRating" | "reviewCount" | "createdAt" | "updatedAt"
  > & { id?: string },
): Promise<Product> {
  return apiFetchOrMock(
    "/products",
    () =>
      mockUpsertProduct({
        ...body,
        id: body.id ?? body.slug,
        totalStock: 0,
        totalSold: 0,
        averageRating: 0,
        reviewCount: 0,
        createdAt: "",
        updatedAt: "",
      }),
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function updateProduct(
  id: string,
  body: Partial<Product>,
): Promise<Product> {
  return apiFetchOrMock(
    `/products/${id}`,
    () => {
      const existing = mockGetProduct(id);
      if (!existing) throw new Error("Product not found");
      return mockUpsertProduct({ ...existing, ...body });
    },
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function deleteProduct(id: string): Promise<void> {
  return apiFetchOrMock(
    `/products/${id}`,
    () => mockDeleteProduct(id),
    { method: "DELETE" },
  );
}

export async function toggleProductVisibility(
  id: string,
): Promise<{ id: string; isActive: boolean }> {
  return apiFetchOrMock(
    `/products/${id}/visibility`,
    () => {
      const r = mockToggleProductVisibility(id);
      if (!r) throw new Error("Product not found");
      return r;
    },
    { method: "PATCH" },
  );
}

export async function duplicateProduct(
  id: string,
): Promise<{ id: string; product: Product }> {
  return apiFetchOrMock(
    `/products/${id}/duplicate`,
    () => {
      const r = mockDuplicateProduct(id);
      if (!r) throw new Error("Product not found");
      return r;
    },
    { method: "POST" },
  );
}
