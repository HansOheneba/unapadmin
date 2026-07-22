import type { Paginated, Product } from "@/types";
import { executeOrMock, executePaginatedOrMock } from "./client";
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

// Backend models visibility as `isVisible`. Gender is storefront-catalog-only
// (per AGENTS.md) — kept locally for size-guide UI, not sent to the API.
type ApiProduct = Omit<Product, "isActive" | "gender"> & {
  isVisible: boolean;
  gender?: Product["gender"];
};

function fromApi(p: ApiProduct, fallbackGender: Product["gender"]): Product {
  if ("isActive" in p) return p as unknown as Product;
  const { isVisible, gender, ...rest } = p;
  return { ...rest, isActive: isVisible, gender: gender ?? fallbackGender };
}

function toApi(p: Partial<Product>): Partial<ApiProduct> {
  const { isActive, gender: _gender, ...rest } = p;
  void _gender;
  return {
    ...rest,
    ...(isActive !== undefined ? { isVisible: isActive } : {}),
  };
}

export async function getProducts(
  params: ProductListParams = {},
): Promise<Paginated<Product>> {
  const result = await executePaginatedOrMock(
    "product.list",
    () => mockGetProducts(params),
    { method: "GET", query: params },
  );
  return {
    ...result,
    data: result.data.map((p) => fromApi(p as unknown as ApiProduct, "male")),
  };
}

export async function getProduct(id: string): Promise<Product> {
  const p = await executeOrMock(
    "product.get",
    () => {
      const found = mockGetProduct(id);
      if (!found) throw new Error("Product not found");
      return found;
    },
    { method: "GET", query: { id } },
  );
  return fromApi(p as unknown as ApiProduct, "male");
}

export async function createProduct(
  body: Omit<
    Product,
    | "id"
    | "totalStock"
    | "totalSold"
    | "averageRating"
    | "reviewCount"
    | "createdAt"
    | "updatedAt"
  > & { id?: string },
): Promise<Product> {
  const p = await executeOrMock(
    "product.create",
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
    { method: "POST", body: toApi(body) },
  );
  return fromApi(p as unknown as ApiProduct, body.gender);
}

export async function updateProduct(
  id: string,
  body: Partial<Product>,
): Promise<Product> {
  const p = await executeOrMock(
    "product.update",
    () => {
      const existing = mockGetProduct(id);
      if (!existing) throw new Error("Product not found");
      return mockUpsertProduct({ ...existing, ...body });
    },
    { method: "PATCH", body: { id, ...toApi(body) } },
  );
  return fromApi(p as unknown as ApiProduct, body.gender ?? "male");
}

export async function deleteProduct(id: string): Promise<void> {
  return executeOrMock(
    "product.delete",
    () => mockDeleteProduct(id),
    { method: "DELETE", body: { id } },
  );
}

export async function toggleProductVisibility(
  id: string,
): Promise<{ id: string; isActive: boolean }> {
  const r = await executeOrMock(
    "product.toggle-visibility",
    () => {
      const result = mockToggleProductVisibility(id);
      if (!result) throw new Error("Product not found");
      return result;
    },
    { method: "PATCH", body: { id } },
  );
  const { isVisible, isActive } = r as {
    isVisible?: boolean;
    isActive?: boolean;
    id: string;
  };
  return { id: r.id, isActive: isVisible ?? isActive ?? false };
}

export async function duplicateProduct(
  id: string,
): Promise<{ id: string; product: Product }> {
  const r = await executeOrMock(
    "product.duplicate",
    () => {
      const result = mockDuplicateProduct(id);
      if (!result) throw new Error("Product not found");
      return result;
    },
    { method: "POST", body: { id } },
  );
  return {
    id: r.id,
    product: fromApi(r.product as unknown as ApiProduct, "male"),
  };
}
