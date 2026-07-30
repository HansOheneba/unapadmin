import type { Collection, CollectionWithCount } from "@/types";
import { executeOrMock } from "./client";
import {
  mockDeleteCollection,
  mockGetCollections,
  mockReorderCollections,
  mockUpsertCollection,
} from "@/lib/mock/data-store";

// Backend models visibility as `isVisible`; this app's UI keeps `isActive`.
type ApiCollection = Omit<Collection, "isActive"> & {
  isVisible: boolean;
  productCount?: number;
};

function fromApi(c: ApiCollection): CollectionWithCount {
  if ("isActive" in c) return c as unknown as CollectionWithCount;
  const { isVisible, productCount, ...rest } = c;
  return { ...rest, isActive: isVisible, productCount: productCount ?? 0 };
}

function isWireImageUrl(src: string | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("blob:") || src.startsWith("data:")) return false;
  return true;
}

function toApi(c: Partial<Collection>): Partial<ApiCollection> {
  const { isActive, featured, ...rest } = c;
  if (featured !== undefined && !isWireImageUrl(featured)) {
    throw new Error(
      "Cover image must be a media URL. Upload the image first, then save.",
    );
  }
  return {
    ...rest,
    ...(featured !== undefined ? { featured } : {}),
    ...(isActive !== undefined ? { isVisible: isActive } : {}),
  };
}

export async function getCollections(): Promise<CollectionWithCount[]> {
  const list = await executeOrMock("collection.list", mockGetCollections, {
    method: "GET",
  });
  return (list as unknown as ApiCollection[]).map(fromApi);
}

export async function createCollection(
  body: Omit<Collection, "createdAt" | "updatedAt">,
): Promise<Collection> {
  const c = await executeOrMock(
    "collection.create",
    () => mockUpsertCollection({ ...body, createdAt: "", updatedAt: "" }),
    { method: "POST", body: toApi(body) },
  );
  return fromApi(c as unknown as ApiCollection);
}

export async function updateCollection(
  id: string,
  body: Partial<Collection>,
): Promise<Collection> {
  const c = await executeOrMock(
    "collection.update",
    () => {
      const existing = mockGetCollections().find((x) => x.id === id);
      if (!existing) throw new Error("Collection not found");
      return mockUpsertCollection({ ...existing, ...body });
    },
    { method: "PATCH", body: { id, ...toApi(body) } },
  );
  return fromApi(c as unknown as ApiCollection);
}

export async function deleteCollection(id: string): Promise<void> {
  return executeOrMock(
    "collection.delete",
    () => mockDeleteCollection(id),
    { method: "DELETE", body: { id } },
  );
}

export async function reorderCollections(ids: string[]): Promise<void> {
  return executeOrMock(
    "collection.reorder",
    () => mockReorderCollections(ids),
    { method: "PATCH", body: { ids } },
  );
}
