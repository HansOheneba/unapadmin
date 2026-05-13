import type { Collection } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_COLLECTIONS: Collection[] = [
  {
    id: "sunglasses",
    subtitle: "Sunglasses",
    title: "The Eclipse Edit",
    tagline: "See the world differently.",
    featured: "/collections/glases/outlawGlasses1.jpg",
    href: "/collections/sunglasses",
    sortOrder: 0,
    productCount: 6,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "hoodies",
    subtitle: "Hoodies",
    title: "The Warmth Series",
    tagline: "Built for the bold.",
    featured: "/collections/hoodies/hoodieBlackMan.jpg",
    href: "/collections/hoodies",
    sortOrder: 1,
    productCount: 3,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "headwear",
    subtitle: "Headwear",
    title: "The Crown Collection",
    tagline: "Top it off.",
    featured: "/collections/headwear/boldSocietyCapBlack.jpg",
    href: "/collections/headwear",
    sortOrder: 2,
    productCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "boxers",
    subtitle: "Boxers",
    title: "The Signature Comfort",
    tagline: "Premium comfort, every day.",
    featured: "/collections/boxers/boxersWhite.jpeg",
    href: "/collections/boxers",
    sortOrder: 3,
    productCount: 8,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "tracks",
    subtitle: "Tracks",
    title: "The Movement Set",
    tagline: "Move with intention.",
    featured: "/collections/tracks/track.jpg",
    href: "/collections/tracks",
    sortOrder: 4,
    productCount: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

export const getCollections = (): Promise<Collection[]> => {
  // TODO: remove mock
  return Promise.resolve(MOCK_COLLECTIONS);
  // return apiFetch<Collection[]>("/collections");
};

export const createCollection = (
  body: Omit<Collection, "id" | "productCount" | "createdAt" | "updatedAt">,
) => apiFetch<Collection>("/collections", { method: "POST", body: JSON.stringify(body) });

export const updateCollection = (id: string, body: Partial<Collection>) =>
  apiFetch<Collection>(`/collections/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteCollection = (id: string) =>
  apiFetch<void>(`/collections/${id}`, { method: "DELETE" });

export const reorderCollections = (ids: string[]) =>
  apiFetch<void>("/collections/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
