import type { Collection, CollectionWithCount } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockDeleteCollection,
  mockGetCollections,
  mockReorderCollections,
  mockUpsertCollection,
} from "@/lib/mock/data-store";

export async function getCollections(): Promise<CollectionWithCount[]> {
  return apiFetchOrMock("/collections", mockGetCollections);
}

export async function createCollection(
  body: Omit<Collection, "createdAt" | "updatedAt">,
): Promise<Collection> {
  return apiFetchOrMock(
    "/collections",
    () => mockUpsertCollection({ ...body, createdAt: "", updatedAt: "" }),
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function updateCollection(
  id: string,
  body: Partial<Collection>,
): Promise<Collection> {
  return apiFetchOrMock(
    `/collections/${id}`,
    () => {
      const existing = mockGetCollections().find((c) => c.id === id);
      if (!existing) throw new Error("Collection not found");
      return mockUpsertCollection({ ...existing, ...body });
    },
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function deleteCollection(id: string): Promise<void> {
  return apiFetchOrMock(
    `/collections/${id}`,
    () => mockDeleteCollection(id),
    { method: "DELETE" },
  );
}

export async function reorderCollections(ids: string[]): Promise<void> {
  return apiFetchOrMock(
    "/collections/reorder",
    () => mockReorderCollections(ids),
    { method: "PATCH", body: JSON.stringify({ ids }) },
  );
}
