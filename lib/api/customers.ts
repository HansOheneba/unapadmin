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
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
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

function firstDefined(...values: unknown[]): unknown {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function nestedStats(obj: Record<string, unknown>): Record<string, unknown> {
  const stats = obj.stats;
  if (stats && typeof stats === "object" && !Array.isArray(stats)) {
    return stats as Record<string, unknown>;
  }
  const metrics = obj.metrics;
  if (metrics && typeof metrics === "object" && !Array.isArray(metrics)) {
    return metrics as Record<string, unknown>;
  }
  return {};
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
    typeof obj.lastName === "string" ||
    typeof obj.name === "string";

  if (!looksLikeCustomer || !id) return null;

  const status = obj.status;
  const country = obj.country;
  const stats = nestedStats(obj);

  const name = asString(obj.name);
  const nameParts = name ? name.trim().split(/\s+/) : [];
  const firstName =
    asString(obj.firstName) ||
    asString(obj.first_name) ||
    (nameParts.length > 0 ? nameParts[0] : "");
  const lastName =
    asString(obj.lastName) ||
    asString(obj.last_name) ||
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

  const totalOrders = asNumber(
    firstDefined(
      obj.totalOrders,
      obj.orderCount,
      obj.ordersCount,
      obj.orders_count,
      obj.total_orders,
      stats.totalOrders,
      stats.orderCount,
      stats.ordersCount,
    ),
  );
  const totalSpend = asNumber(
    firstDefined(
      obj.totalSpend,
      obj.lifetimeSpend,
      obj.totalSpent,
      obj.lifetime_spend,
      obj.total_spend,
      obj.total_spent,
      stats.totalSpend,
      stats.lifetimeSpend,
      stats.totalSpent,
    ),
  );
  const lastOrderRaw = firstDefined(
    obj.lastOrderDate,
    obj.last_order_date,
    obj.lastOrderAt,
    obj.last_order_at,
    stats.lastOrderDate,
  );

  return {
    id,
    firstName,
    lastName,
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
    lastOrderDate: typeof lastOrderRaw === "string" ? lastOrderRaw : null,
    totalOrders,
    totalSpend,
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
  console.log("[customer.list] → request", {
    usecase: "customer.list",
    query: params,
  });

  const result = await executePaginatedOrMock(
    "customer.list",
    () => mockGetCustomers(params),
    { method: "GET", query: params },
  );

  // Full raw first row so we can see exact API field names for spend/orders.
  console.log("[customer.list] ← raw page", {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    count: result.data.length,
    firstRaw: result.data[0] ?? null,
    allRaw: result.data,
  });

  const mapped = result.data
    .map((c) => asCustomer(c))
    .filter((c): c is Customer => c !== null);

  console.log("[customer.list] ← mapped", {
    mappedCount: mapped.length,
    rows: mapped.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      totalOrders: c.totalOrders,
      totalSpend: c.totalSpend,
      lastOrderDate: c.lastOrderDate,
      status: c.status,
    })),
  });

  return {
    ...result,
    data: mapped,
  };
}

export async function getCustomer(id: string): Promise<Customer> {
  if (useMockApi()) {
    const c = mockGetCustomer(id);
    if (!c) throw new Error("Customer not found");
    return c;
  }

  console.log("[customer.get] → request", { id });
  const raw = await execute<unknown>("customer.get", {
    method: "GET",
    query: { id },
  });
  console.log("[customer.get] ← raw", { id, raw });
  const direct = asCustomer(raw, id);
  if (direct) {
    console.log("[customer.get] ← mapped", {
      id: direct.id,
      totalOrders: direct.totalOrders,
      totalSpend: direct.totalSpend,
      lastOrderDate: direct.lastOrderDate,
    });
    return direct;
  }

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
  console.log("[customer.orders] → request", { id });
  const raw = await executeOrMock(
    "customer.orders",
    () => mockGetCustomerOrders(id),
    { method: "GET", query: { id } },
  );
  console.log("[customer.orders] ← raw", { id, raw });
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
