import type { Country, Paginated, Rider, RiderStatus, VehicleType } from "@/types";
import { rest, restOrMock, useMockApi } from "./client";
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
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asRiderStatus(value: unknown): RiderStatus {
  if (typeof value === "boolean") return value ? "active" : "inactive";
  if (typeof value === "number") return value === 1 ? "active" : "inactive";
  if (typeof value !== "string") return "inactive";
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "active" || normalized === "available" || normalized === "online") {
    return "active";
  }
  if (
    normalized === "on_delivery" ||
    normalized === "ondelivery" ||
    normalized === "busy"
  ) {
    return "on_delivery";
  }
  if (
    normalized === "off_duty" ||
    normalized === "offduty" ||
    normalized === "offline"
  ) {
    return "off_duty";
  }
  return "inactive";
}

/** Resolve status from `status` / `isActive` style fields the API may send. */
function resolveRiderStatus(obj: Record<string, unknown>): RiderStatus {
  const status = field(obj, "status", "riderStatus", "rider_status");
  if (status !== undefined) return asRiderStatus(status);
  const isActive = field(obj, "isActive", "is_active", "active");
  if (isActive !== undefined) return asRiderStatus(isActive);
  return "inactive";
}

/** Riders the assign-rider endpoint will accept (not off-duty / inactive). */
export function isRiderAssignable(status: RiderStatus): boolean {
  return status === "active" || status === "on_delivery";
}

function field(
  obj: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
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

  const id = asString(field(nested, "id", "_id", "riderId", "uuid"), "");
  if (!id) return null;

  const firstName = asString(field(nested, "firstName", "first_name"), "");
  const lastName = asString(field(nested, "lastName", "last_name"), "");
  const phone = asString(field(nested, "phone", "phoneNumber", "phone_number"), "");
  const createdAt = asString(
    field(nested, "createdAt", "created_at"),
    new Date(0).toISOString(),
  );

  return {
    id,
    firstName,
    lastName,
    phone,
    whatsapp: asNullableString(field(nested, "whatsapp")),
    email: asNullableString(field(nested, "email")),
    country: asCountry(field(nested, "country")),
    city: asString(field(nested, "city"), "Accra"),
    zone: asString(field(nested, "zone"), ""),
    status: resolveRiderStatus(nested),
    vehicleType: asVehicleType(field(nested, "vehicleType", "vehicle_type")),
    plateNumber: asString(field(nested, "plateNumber", "plate_number"), ""),
    vehicleMake: asNullableString(field(nested, "vehicleMake", "vehicle_make")),
    vehicleModel: asNullableString(
      field(nested, "vehicleModel", "vehicle_model"),
    ),
    vehicleColor: asNullableString(
      field(nested, "vehicleColor", "vehicle_color"),
    ),
    licenseNumber: asNullableString(
      field(nested, "licenseNumber", "license_number"),
    ),
    notes: asString(field(nested, "notes"), ""),
    activeDeliveries: asNumber(
      field(nested, "activeDeliveries", "active_deliveries"),
      0,
    ),
    totalDeliveries: asNumber(
      field(nested, "totalDeliveries", "total_deliveries"),
      0,
    ),
    joinedAt: asString(
      field(nested, "joinedAt", "joined_at", "createdAt", "created_at"),
      createdAt,
    ),
    createdAt,
    updatedAt: asString(field(nested, "updatedAt", "updated_at"), createdAt),
  };
}

/** Pull the rider array out of whatever list shape the backend returned. */
function extractRiderRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  for (const key of ["data", "riders", "items", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
    // Double-wrapped: { data: { data: Rider[] } }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      for (const nestedKey of ["data", "riders", "items", "results"]) {
        if (Array.isArray(nested[nestedKey])) return nested[nestedKey] as unknown[];
      }
    }
  }
  return [];
}

function normalizeRiderList(raw: Paginated<unknown> | unknown): Paginated<Rider> {
  const rows = extractRiderRows(raw);
  const meta =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<Paginated<unknown>>)
      : {};
  const data = rows
    .map((item) => normalizeRider(item))
    .filter((r): r is Rider => r !== null);
  const page = meta.page ?? 1;
  const pageSize = meta.pageSize ?? data.length;
  const total = meta.total ?? data.length;
  return {
    data,
    total,
    page,
    pageSize,
    totalPages:
      meta.totalPages ?? Math.max(1, Math.ceil(total / (pageSize || 1))),
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
  if (useMockApi()) {
    const mock = normalizeRiderList(mockGetRiders(params));
    console.log("[riders] GET /riders (mock)", {
      params,
      count: mock.data.length,
      riders: mock.data.map((r) => ({
        id: r.id,
        name: `${r.firstName} ${r.lastName}`,
        status: r.status,
        activeDeliveries: r.activeDeliveries,
      })),
    });
    return mock;
  }

  // Fetch the raw payload ourselves — restPaginated can miss alternate list
  // keys (`riders`/`items`) and leave the assign dropdown empty.
  const raw = await rest<unknown>("/riders", {
    method: "GET",
    query: {
      status: params.status,
      country: params.country,
      q: params.q,
      page: params.page,
      pageSize: params.pageSize,
    },
  });

  const rows = extractRiderRows(raw);
  console.log("[riders] GET /riders entire response", {
    params,
    raw,
    rowCount: rows.length,
    rows,
  });
  console.log(
    `[riders] GET /riders JSON\n${JSON.stringify({ params, raw }, null, 2)}`,
  );

  const normalized = normalizeRiderList(raw);
  console.log("[riders] GET /riders normalized (full)", normalized);
  return normalized;
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
