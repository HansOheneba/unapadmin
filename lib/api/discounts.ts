import type { Discount } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_DISCOUNTS: Discount[] = [
  {
    id: "disc-1",
    code: "WELCOME20",
    type: "PERCENTAGE",
    value: 20,
    minOrderValue: 50,
    maxUses: 100,
    usedCount: 42,
    active: true,
    expiresAt: "2024-12-31T23:59:59Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "disc-2",
    code: "FLAT10",
    type: "FIXED",
    value: 10,
    minOrderValue: null,
    maxUses: null,
    usedCount: 18,
    active: true,
    expiresAt: null,
    createdAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "disc-3",
    code: "SUMMER30",
    type: "PERCENTAGE",
    value: 30,
    minOrderValue: 100,
    maxUses: 50,
    usedCount: 50,
    active: false,
    expiresAt: "2024-08-31T23:59:59Z",
    createdAt: "2024-06-01T00:00:00Z",
  },
];

export const getDiscounts = (): Promise<Discount[]> => {
  // TODO: remove mock
  return Promise.resolve(MOCK_DISCOUNTS);
};

export const getDiscount = (id: string): Promise<Discount> => {
  // TODO: remove mock
  const found = MOCK_DISCOUNTS.find((d) => d.id === id);
  if (!found) return Promise.reject(new Error("Not found"));
  return Promise.resolve(found);
};

export const createDiscount = (
  body: Omit<Discount, "id" | "usedCount" | "createdAt">,
) =>
  apiFetch<Discount>("/discounts", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateDiscount = (id: string, body: Partial<Discount>) =>
  apiFetch<Discount>(`/discounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteDiscount = (id: string) =>
  apiFetch<void>(`/discounts/${id}`, { method: "DELETE" });
