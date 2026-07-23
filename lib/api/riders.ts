import type { Country, Paginated, Rider, RiderStatus, VehicleType } from "@/types";
import { restOrMock, restPaginatedOrMock } from "./client";
import {
  mockDeleteRider,
  mockGetRider,
  mockGetRiders,
  mockUpsertRider,
} from "@/lib/mock/data-store";

// Riders are REST paths (Admin v2): GET/POST /riders, GET/PATCH/DELETE /riders/:id

export type RiderListParams = {
  status?: string;
  country?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type RiderWriteBody = {
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  country: Country;
  city: string;
  zone: string;
  status: RiderStatus;
  vehicleType: VehicleType;
  plateNumber: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  licenseNumber?: string | null;
  notes?: string;
};

const VEHICLE_TYPES: readonly VehicleType[] = [
  "motorcycle",
  "bicycle",
  "car",
  "van",
];

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asRiderStatus(value: unknown): RiderStatus {
  return value === "inactive" ? "inactive" : "active";
}

function asVehicleType(value: unknown): VehicleType {
  return VEHICLE_TYPES.includes(value as VehicleType)
    ? (value as VehicleType)
    : "motorcycle";
}

function asCountry(value: unknown): Country {
  return value === "Nigeria" ? "Nigeria" : "Ghana";
}

export function normalizeRider(raw: unknown): Rider | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const nested =
    obj.rider && typeof obj.rider === "object"
      ? (obj.rider as Record<string, unknown>)
      : obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
        ? (obj.data as Record<string, unknown>)
        : obj;

  const id = typeof nested.id === "string" ? nested.id : "";
  if (!id) return null;

  const firstName = asString(nested.firstName, "");
  const lastName = asString(nested.lastName, "");
  const phone = asString(nested.phone, "");
  const createdAt = asString(nested.createdAt, new Date(0).toISOString());

  return {
    id,
    firstName,
    lastName,
    phone,
    whatsapp: asNullableString(nested.whatsapp),
    email: asNullableString(nested.email),
    country: asCountry(nested.country),
    city: asString(nested.city, "Accra"),
    zone: asString(nested.zone, ""),
    status: asRiderStatus(nested.status),
    vehicleType: asVehicleType(nested.vehicleType),
    plateNumber: asString(nested.plateNumber, ""),
    vehicleMake: asNullableString(nested.vehicleMake),
    vehicleModel: asNullableString(nested.vehicleModel),
    vehicleColor: asNullableString(nested.vehicleColor),
    licenseNumber: asNullableString(nested.licenseNumber),
    notes: asString(nested.notes, ""),
    activeDeliveries: asNumber(nested.activeDeliveries, 0),
    totalDeliveries: asNumber(nested.totalDeliveries, 0),
    joinedAt: asString(nested.joinedAt ?? nested.createdAt, createdAt),
    createdAt,
    updatedAt: asString(nested.updatedAt, createdAt),
  };
}

function normalizeRiderList(raw: Paginated<unknown>): Paginated<Rider> {
  return {
    ...raw,
    data: raw.data
      .map((item) => normalizeRider(item))
      .filter((r): r is Rider => r !== null),
  };
}

/** Postman create/update body — no server-owned fields. */
function toWriteBody(body: RiderWriteBody | Partial<Rider>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (body.firstName !== undefined) payload.firstName = body.firstName;
  if (body.lastName !== undefined) payload.lastName = body.lastName;
  if (body.phone !== undefined) payload.phone = body.phone;
  if (body.whatsapp !== undefined) payload.whatsapp = body.whatsapp;
  if (body.email !== undefined) payload.email = body.email;
  if (body.country !== undefined) payload.country = body.country;
  if (body.city !== undefined) payload.city = body.city;
  if (body.zone !== undefined) payload.zone = body.zone;
  if (body.status !== undefined) payload.status = body.status;
  if (body.vehicleType !== undefined) payload.vehicleType = body.vehicleType;
  if (body.plateNumber !== undefined) payload.plateNumber = body.plateNumber;
  if (body.vehicleMake !== undefined) payload.vehicleMake = body.vehicleMake;
  if (body.vehicleModel !== undefined) payload.vehicleModel = body.vehicleModel;
  if (body.vehicleColor !== undefined) payload.vehicleColor = body.vehicleColor;
  if (body.licenseNumber !== undefined) payload.licenseNumber = body.licenseNumber;
  if (body.notes !== undefined) payload.notes = body.notes;
  return payload;
}

export async function getRiders(
  params: RiderListParams = {},
): Promise<Paginated<Rider>> {
  const raw = await restPaginatedOrMock(
    "/riders",
    () => mockGetRiders(params),
    {
      method: "GET",
      query: {
        status: params.status,
        country: params.country,
        q: params.q,
        page: params.page,
        pageSize: params.pageSize,
      },
    },
  );
  return normalizeRiderList(raw);
}

export async function getRider(id: string): Promise<Rider> {
  const raw = await restOrMock(`/riders/${id}`, () => {
    const r = mockGetRider(id);
    if (!r) throw new Error("Rider not found");
    return r;
  });
  const normalized = normalizeRider(raw);
  if (!normalized) throw new Error("Rider not found");
  return normalized;
}

export async function createRider(body: RiderWriteBody): Promise<Rider> {
  const payload = toWriteBody(body);
  const raw = await restOrMock(
    "/riders",
    () =>
      mockUpsertRider({
        id: "",
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        whatsapp: body.whatsapp ?? null,
        email: body.email ?? null,
        country: body.country,
        city: body.city,
        zone: body.zone,
        status: body.status,
        vehicleType: body.vehicleType,
        plateNumber: body.plateNumber,
        vehicleMake: body.vehicleMake ?? null,
        vehicleModel: body.vehicleModel ?? null,
        vehicleColor: body.vehicleColor ?? null,
        licenseNumber: body.licenseNumber ?? null,
        notes: body.notes ?? "",
        activeDeliveries: 0,
        totalDeliveries: 0,
        joinedAt: "",
        createdAt: "",
        updatedAt: "",
      }),
    { method: "POST", body: payload },
  );
  const normalized = normalizeRider(raw);
  if (!normalized) throw new Error("Failed to create rider");
  return normalized;
}

export async function updateRider(
  id: string,
  body: Partial<RiderWriteBody>,
): Promise<Rider> {
  const payload = toWriteBody(body);
  const raw = await restOrMock(
    `/riders/${id}`,
    () => {
      const existing = mockGetRider(id);
      if (!existing) throw new Error("Rider not found");
      return mockUpsertRider({ ...existing, ...body });
    },
    { method: "PATCH", body: payload },
  );
  const normalized = normalizeRider(raw);
  if (!normalized) throw new Error("Rider not found");
  return normalized;
}

export async function deleteRider(id: string): Promise<void> {
  return restOrMock(`/riders/${id}`, () => mockDeleteRider(id), {
    method: "DELETE",
  });
}
