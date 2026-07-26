import type { ColorVariant, Paginated, Product, SizeStock } from "@/types";
import { executeOrMock, executePaginatedOrMock, useMockApi } from "./client";
import {
  mockDeleteProduct,
  mockDuplicateProduct,
  mockGetProduct,
  mockGetProducts,
  mockToggleProductVisibility,
  mockUpsertProduct,
} from "@/lib/mock/data-store";

/** Local file held until Save — inlined into create/update JSON at save time. */
export type ProductImageUpload = {
  variantIndex: number;
  imageIndex: number;
  file: File;
};

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
  priceNgn?: number | null;
  isFeatured?: boolean;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

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
    priceNgn,
    isFeatured: _isFeatured,
    ...rest
  } = nested;
  void _productId;
  void _id;
  void _product;
  void _isFeatured;

  const id = resolveProductId(nested) || resolveProductId(raw);

  return {
    ...(rest as unknown as Omit<
      Product,
      "id" | "isActive" | "gender" | "priceNgn"
    >),
    id,
    priceNgn:
      typeof priceNgn === "number" && Number.isFinite(priceNgn)
        ? priceNgn
        : null,
    isActive:
      typeof isActive === "boolean"
        ? isActive
        : typeof isVisible === "boolean"
          ? isVisible
          : true,
    gender: gender ?? fallbackGender,
  };
}

function cleanStrings(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean);
}

function toApiSizes(sizes: SizeStock[]): SizeStock[] {
  return sizes.map((s) => ({
    size: s.size.trim(),
    stock: Number.isFinite(s.stock) ? s.stock : 0,
  }));
}

/**
 * Postman Create Product body shape:
 * { slug, name, description, price, priceNgn?, collectionId, isVisible,
 *   isFeatured?, details[], careInstructions[], variants[{ colorName, colorHex, images[], sizes[] }] }
 */
function toCreatePayload(product: Product): Record<string, unknown> {
  return {
    slug: product.slug.trim(),
    name: product.name.trim(),
    description: product.description.trim(),
    price: product.price,
    priceNgn: product.priceNgn,
    collectionId: product.collectionId,
    isVisible: product.isActive,
    isFeatured: false,
    details: cleanStrings(product.details),
    careInstructions: cleanStrings(product.careInstructions),
    variants: product.variants.map((v) => toCreateVariant(v)),
  };
}

function isWireImageUrl(src: string): boolean {
  if (!src) return false;
  // blob: is browser-local preview only — never send it.
  // data: is inlined at Save from a picked file (Postman create is JSON).
  if (src.startsWith("blob:")) return false;
  return true;
}

function toCreateVariant(v: ColorVariant): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    colorName: v.colorName.trim(),
    colorHex: v.colorHex,
    images: v.images.filter(isWireImageUrl),
    sizes: toApiSizes(v.sizes),
  };
  // Only send real backend ids — never client temp ids like var_*.
  if (v.id && isUuid(v.id)) {
    payload.id = v.id;
  }
  return payload;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

/** Replace blob: slots with data URLs so images ship inside the JSON create body. */
async function withLocalImagesAsDataUrls(
  product: Product,
  uploads: ProductImageUpload[],
): Promise<Product> {
  if (uploads.length === 0) return product;
  const variants = product.variants.map((v) => ({
    ...v,
    images: [...v.images],
  }));
  for (const u of uploads) {
    const variant = variants[u.variantIndex];
    if (!variant) continue;
    variant.images[u.imageIndex] = await readAsDataUrl(u.file);
  }
  return { ...product, variants };
}

function toUpdatePayload(
  id: string,
  product: Partial<Product>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { id };

  if (product.slug !== undefined) payload.slug = product.slug.trim();
  if (product.name !== undefined) payload.name = product.name.trim();
  if (product.description !== undefined) {
    payload.description = product.description.trim();
  }
  if (product.price !== undefined) payload.price = product.price;
  if (product.priceNgn !== undefined) payload.priceNgn = product.priceNgn;
  if (product.collectionId !== undefined) {
    payload.collectionId = product.collectionId;
  }
  if (product.isActive !== undefined) payload.isVisible = product.isActive;
  if (product.details !== undefined) {
    payload.details = cleanStrings(product.details);
  }
  if (product.careInstructions !== undefined) {
    payload.careInstructions = cleanStrings(product.careInstructions);
  }
  if (product.variants !== undefined) {
    payload.variants = product.variants.map((v) => {
      const variant = toCreateVariant(v);
      // Updates may keep slug-style variant ids from older data.
      if (v.id && !v.id.startsWith("var_")) variant.id = v.id;
      return variant;
    });
  }

  return payload;
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
  product: Product,
  uploads: ProductImageUpload[] = [],
): Promise<Product> {
  // Match Postman: application/json + Bearer. Local files are inlined into
  // variants[].images at Save (not uploaded on pick, not multipart create).
  const withImages = await withLocalImagesAsDataUrls(product, uploads);
  const body = toCreatePayload(withImages);

  console.log("[products] create → Postman JSON", {
    usecase: "product.create",
    contentType: "application/json",
    localFileCount: uploads.length,
    body: {
      ...body,
      variants: (body.variants as { images?: string[] }[]).map((v) => ({
        ...v,
        images: (v.images ?? []).map((src) =>
          src.startsWith("data:")
            ? `[data-url ${src.length} chars]`
            : src,
        ),
      })),
    },
  });

  if (useMockApi()) {
    const p = mockUpsertProduct({
      ...withImages,
      id: withImages.slug,
      totalStock: 0,
      totalSold: 0,
      averageRating: 0,
      reviewCount: 0,
      createdAt: "",
      updatedAt: "",
    });
    return fromApi(p as unknown as ApiProduct, product.gender);
  }

  const p = await executeOrMock(
    "product.create",
    () => {
      throw new Error("Unreachable: mock handled above");
    },
    { method: "POST", body },
  );

  console.log("[products] create ← response", p);
  return fromApi(p as unknown as ApiProduct, product.gender);
}

export async function updateProduct(
  id: string,
  product: Partial<Product>,
  uploads: ProductImageUpload[] = [],
): Promise<Product> {
  const base =
    uploads.length > 0 && product.variants
      ? await withLocalImagesAsDataUrls(
          { ...(product as Product), id, variants: product.variants },
          uploads,
        )
      : product;
  const body = toUpdatePayload(id, base);

  console.log("[products] update → Postman JSON", {
    usecase: "product.update",
    contentType: "application/json",
    localFileCount: uploads.length,
    body,
  });

  if (useMockApi()) {
    const existing = mockGetProduct(id);
    if (!existing) throw new Error("Product not found");
    const merged = { ...existing, ...base } as Product;
    return fromApi(
      mockUpsertProduct(merged) as unknown as ApiProduct,
      product.gender ?? "male",
    );
  }

  const p = await executeOrMock(
    "product.update",
    () => {
      throw new Error("Unreachable: mock handled above");
    },
    { method: "PATCH", body },
  );

  console.log("[products] update ← response", p);
  return fromApi(p as unknown as ApiProduct, product.gender ?? "male");
}

export async function deleteProduct(id: string): Promise<void> {
  const productId = id?.trim();
  if (!productId) {
    throw new Error("Product id is missing — cannot delete.");
  }

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
