import type { Paginated, Rider } from "@/types";
import { restOrMock, restPaginatedOrMock } from "./client";
import {
  mockDeleteRider,
  mockGetRider,
  mockGetRiders,
  mockUpsertRider,
} from "@/lib/mock/data-store";

// Riders are REST paths under Admin v2 additions (not workflow usecases yet).

export type RiderListParams = {
  status?: string;
  country?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function getRiders(
  params: RiderListParams = {},
): Promise<Paginated<Rider>> {
  return restPaginatedOrMock("/riders", () => mockGetRiders(params), {
    method: "GET",
    query: params,
  });
}

export async function getRider(id: string): Promise<Rider> {
  return restOrMock(`/riders/${id}`, () => {
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
  return restOrMock(
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
    { method: "POST", body },
  );
}

export async function updateRider(
  id: string,
  body: Partial<Rider>,
): Promise<Rider> {
  return restOrMock(
    `/riders/${id}`,
    () => {
      const existing = mockGetRider(id);
      if (!existing) throw new Error("Rider not found");
      return mockUpsertRider({ ...existing, ...body });
    },
    { method: "PATCH", body },
  );
}

export async function deleteRider(id: string): Promise<void> {
  return restOrMock(`/riders/${id}`, () => mockDeleteRider(id), {
    method: "DELETE",
  });
}
