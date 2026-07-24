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
  isVisible?: boolean;
  gender?: Product["gender"];
  productId?: string;
  _id?: string;
  product?: ApiProduct;
};

function resolveProductId(raw: Record<string, unknown>): string {
  for (const key of ["id", "productId", "_id"] as const) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function fromApi(p: ApiProduct, fallbackGender: Product["gender"]): Product {
  const raw = p as ApiProduct & Record<string, unknown>;
  const nested =
    raw.product && typeof raw.product === "object"
      ? (raw.product as ApiProduct & Record<string, unknown>)
      : raw;

  const {
    isVisible,
    isActive,
    gender,
    productId: _productId,
    _id,
    product: _product,
    ...rest
  } = nested;
  void _productId;
  void _id;
  void _product;

  const id = resolveProductId(nested) || resolveProductId(raw);

  return {
    ...(rest as unknown as Omit<Product, "id" | "isActive" | "gender">),
    id,
    isActive:
      typeof isActive === "boolean"
        ? isActive
        : typeof isVisible === "boolean"
          ? isVisible
          : true,
    gender: gender ?? fallbackGender,
  };
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
  const productId = id?.trim();
  if (!productId) {
    throw new Error("Product id is missing — cannot delete.");
  }

  // Send id in both query and body. Some gateways drop DELETE bodies; the
  // workflow DTO still needs a non-empty string id either way.
  return executeOrMock(
    "product.delete",
    () => mockDeleteProduct(productId),
    { method: "DELETE", query: { id: productId }, body: { id: productId } },
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
