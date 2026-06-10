import type { Paginated, Rider } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockDeleteRider,
  mockGetRider,
  mockGetRiders,
  mockUpsertRider,
} from "@/lib/mock/data-store";

export type RiderListParams = {
  status?: string;
  country?: string;
  q?: string;
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

export async function getRiders(
  params: RiderListParams = {},
): Promise<Paginated<Rider>> {
  return apiFetchOrMock(
    `/riders${toQuery(params)}`,
    () => mockGetRiders(params),
  );
}

export async function getRider(id: string): Promise<Rider> {
  return apiFetchOrMock(`/riders/${id}`, () => {
    const r = mockGetRider(id);
    if (!r) throw new Error("Rider not found");
    return r;
  });
}

export async function createRider(
  body: Omit<
    Rider,
    "id" | "activeDeliveries" | "totalDeliveries" | "createdAt" | "updatedAt"
  >,
): Promise<Rider> {
  return apiFetchOrMock(
    "/riders",
    () =>
      mockUpsertRider({
        ...body,
        id: "",
        activeDeliveries: 0,
        totalDeliveries: 0,
        createdAt: "",
        updatedAt: "",
      }),
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function updateRider(
  id: string,
  body: Partial<Rider>,
): Promise<Rider> {
  return apiFetchOrMock(
    `/riders/${id}`,
    () => {
      const existing = mockGetRider(id);
      if (!existing) throw new Error("Rider not found");
      return mockUpsertRider({ ...existing, ...body });
    },
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function deleteRider(id: string): Promise<void> {
  return apiFetchOrMock(
    `/riders/${id}`,
    () => mockDeleteRider(id),
    { method: "DELETE" },
  );
}
