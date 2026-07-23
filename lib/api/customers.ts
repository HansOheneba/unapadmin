import type { Customer, CustomerAddress, Order, Paginated } from "@/types";
import {
  ApiError,
  execute,
  executeOrMock,
  executePaginated,
  executePaginatedOrMock,
  useMockApi,
} from "./client";
import {
  mockGetCustomer,
  mockGetCustomerOrders,
  mockGetCustomers,
  mockUpdateCustomer,
} from "@/lib/mock/data-store";

export type CustomerListParams = {
  status?: string;
  country?: string;
  innerCircle?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function asAddresses(value: unknown): CustomerAddress[] {
  return Array.isArray(value) ? (value as CustomerAddress[]) : [];
}

function asCustomer(raw: unknown, fallbackId?: string): Customer | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.customer && typeof obj.customer === "object") {
    return asCustomer(obj.customer, fallbackId);
  }
  if (obj.user && typeof obj.user === "object") {
    return asCustomer(obj.user, fallbackId);
  }

  const id =
    typeof obj.id === "string"
      ? obj.id
      : typeof obj.customerId === "string"
        ? obj.customerId
        : fallbackId;

  const looksLikeCustomer =
    typeof id === "string" ||
    typeof obj.email === "string" ||
    typeof obj.firstName === "string" ||
    typeof obj.lastName === "string";

  if (!looksLikeCustomer || !id) return null;

  const status = obj.status;
  const country = obj.country;

  return {
    id,
    firstName: asString(obj.firstName),
    lastName: asString(obj.lastName),
    email: asString(obj.email),
    phone: asString(obj.phone),
    whatsapp: asString(obj.whatsapp),
    country: country === "Nigeria" || country === "Ghana" ? country : "Ghana",
    region: asString(obj.region),
    city: asString(obj.city),
    address: asString(obj.address),
    landmark: asString(obj.landmark),
    birthDay: asString(obj.birthDay),
    birthMonth: asString(obj.birthMonth),
    birthYear: asString(obj.birthYear),
    topSize: asString(obj.topSize),
    bottomSize: asString(obj.bottomSize),
    addresses: asAddresses(obj.addresses),
    status:
      status === "active" || status === "suspended" || status === "unverified"
        ? status
        : "active",
    tags: asStringArray(obj.tags),
    notes: asString(obj.notes),
    joinedDate: asString(
      obj.joinedDate ?? obj.createdAt,
      new Date(0).toISOString(),
    ),
    lastOrderDate:
      typeof obj.lastOrderDate === "string" ? obj.lastOrderDate : null,
    totalOrders: asNumber(obj.totalOrders),
    totalSpend: asNumber(obj.totalSpend ?? obj.lifetimeSpend),
    currency: obj.currency === "NGN" ? "NGN" : "GHS",
    innerCircle: Boolean(obj.innerCircle),
    wishlist: asStringArray(obj.wishlist),
    createdAt: asString(obj.createdAt, new Date(0).toISOString()),
    updatedAt: asString(obj.updatedAt, new Date(0).toISOString()),
  };
}

export async function getCustomers(
  params: CustomerListParams = {},
): Promise<Paginated<Customer>> {
  const result = await executePaginatedOrMock(
    "customer.list",
    () => mockGetCustomers(params),
    { method: "GET", query: params },
  );
  return {
    ...result,
    data: result.data
      .map((c) => asCustomer(c))
      .filter((c): c is Customer => c !== null),
  };
}

export async function getCustomer(id: string): Promise<Customer> {
  if (useMockApi()) {
    const c = mockGetCustomer(id);
    if (!c) throw new Error("Customer not found");
    return c;
  }

  const raw = await execute<unknown>("customer.get", {
    method: "GET",
    query: { id },
  });
  const direct = asCustomer(raw, id);
  if (direct) return direct;

  const listed = await executePaginated<Customer>("customer.list", {
    method: "GET",
    query: { q: id, page: 1, pageSize: 20 },
  });
  const found =
    listed.data.map((c) => asCustomer(c)).find((c) => c?.id === id) ??
    listed.data
      .map((c) => asCustomer(c))
      .find((c) => c?.email === id);
  if (found) return found;

  throw new ApiError("Customer not found", 404);
}

export async function getCustomerOrders(id: string): Promise<Order[]> {
  const raw = await executeOrMock(
    "customer.orders",
    () => mockGetCustomerOrders(id),
    { method: "GET", query: { id } },
  );
  if (Array.isArray(raw)) return raw as Order[];
  if (raw && typeof raw === "object") {
    const obj = raw as { data?: Order[]; orders?: Order[] };
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.orders)) return obj.orders;
  }
  return [];
}

export async function updateCustomer(
  id: string,
  patch: Partial<Customer>,
): Promise<Customer> {
  if (useMockApi()) {
    const c = mockUpdateCustomer(id, patch);
    if (!c) throw new Error("Customer not found");
    return c;
  }

  const raw = await execute<unknown>("customer.update", {
    method: "PATCH",
    body: { id, ...patch },
  });
  const updated = asCustomer(raw, id);
  if (!updated) throw new ApiError("Customer not found", 404);
  return updated;
}
