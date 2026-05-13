import type { Banner } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_BANNERS: Banner[] = [
  {
    id: "banner-1",
    title: "New Collection Drop",
    subtitle: "The Eclipse Edit is here",
    ctaText: "Shop Now",
    ctaHref: "/collections/sunglasses",
    imageUrl: "/collections/glases/outlawGlasses1.jpg",
    position: "HOME_HERO",
    active: true,
    startsAt: null,
    endsAt: null,
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "banner-2",
    title: "Free Shipping Over $100",
    subtitle: null,
    ctaText: null,
    ctaHref: null,
    imageUrl: "/home/hoodieBlackMan.jpg",
    position: "ANNOUNCEMENT_BAR",
    active: true,
    startsAt: null,
    endsAt: null,
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

export const getBanners = (): Promise<Banner[]> => {
  // TODO: remove mock
  return Promise.resolve(MOCK_BANNERS);
};

export const getBanner = (id: string): Promise<Banner> => {
  // TODO: remove mock
  const found = MOCK_BANNERS.find((b) => b.id === id);
  if (!found) return Promise.reject(new Error("Not found"));
  return Promise.resolve(found);
};

export const createBanner = (body: Omit<Banner, "id" | "createdAt">) =>
  apiFetch<Banner>("/banners", { method: "POST", body: JSON.stringify(body) });

export const updateBanner = (id: string, body: Partial<Banner>) =>
  apiFetch<Banner>(`/banners/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteBanner = (id: string) =>
  apiFetch<void>(`/banners/${id}`, { method: "DELETE" });

export const reorderBanners = (ids: string[]) =>
  apiFetch<void>("/banners/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
