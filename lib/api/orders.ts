import type {
  CustomerAddress,
  DeliveryEvent,
  DeliveryType,
  Order,
  OrderItem,
  OrderStatus,
  Paginated,
  PaymentStatus,
} from "@/types";
import {
  ApiError,
  downloadApiFile,
  execute,
  executeOrMock,
  executePaginated,
  executePaginatedOrMock,
  restOrMock,
  useMockApi,
} from "./client";
import { downloadCsv } from "@/lib/format";
import {
  mockAssignRider,
  mockConfirmReturnVerified,
  mockGetDeliveryEvents,
  mockGetOrder,
  mockGetOrders,
  mockRefundOrder,
  mockUpdateOrderNotes,
  mockUpdateOrderStatus,
  mockUpdateRiderNote,
} from "@/lib/mock/data-store";

export type OrderListParams = {
  status?: OrderStatus;
  paymentStatus?: string;
  country?: string;
  riderId?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function getOrders(
  params: OrderListParams = {},
): Promise<Paginated<Order>> {
  const result = await executePaginatedOrMock(
    "order.list",
    () => mockGetOrders(params),
    { method: "GET", query: params },
  );
  return {
    ...result,
    data: result.data.map((row, index) => {
      const fallback =
        typeof (row as { id?: unknown }).id === "string"
          ? ((row as { id: string }).id)
          : `list-${index}`;
      return asOrder(row, fallback) ?? (row as Order);
    }),
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function stringField(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Status/notes/refund writes expect the backend UUID (`ORDER_UUID` in Postman).
 * List/get often also expose a human code like `ORD-…` — never send that as `id`
 * for update-status.
 */
function resolveOrderApiId(
  obj: Record<string, unknown>,
  fallbackId: string,
): { id: string; orderNumber?: string } {
  const candidates = [
    stringField(obj, "id"),
    stringField(obj, "orderId", "order_id"),
    stringField(obj, "uuid", "_id", "orderUuid"),
  ].filter((v): v is string => !!v);

  const uuid = candidates.find(isUuid);
  const human = stringField(
    obj,
    "orderNumber",
    "order_number",
    "orderCode",
    "order_code",
    "number",
    "code",
  );

  const nonUuid = candidates.find((v) => !isUuid(v));

  return {
    id: uuid ?? nonUuid ?? fallbackId,
    orderNumber: human ?? (nonUuid && !isUuid(nonUuid) ? nonUuid : undefined),
  };
}

function emptyAddress(): CustomerAddress {
  return {
    id: "",
    label: "",
    firstName: "",
    lastName: "",
    email: "",
    country: "Ghana",
    region: "",
    city: "",
    district: "",
    address: "",
    address2: "",
    phone: "",
    postcode: "",
    whatsapp: "",
    isDefault: false,
  };
}

function asAddress(raw: unknown): CustomerAddress {
  if (!raw || typeof raw !== "object") return emptyAddress();
  const a = raw as Partial<CustomerAddress>;
  return {
    ...emptyAddress(),
    ...a,
    country: a.country === "Nigeria" ? "Nigeria" : "Ghana",
    firstName: a.firstName ?? "",
    lastName: a.lastName ?? "",
    email: a.email ?? "",
    region: a.region ?? "",
    city: a.city ?? "",
    district: a.district ?? "",
    address: a.address ?? "",
    address2: a.address2 ?? "",
    phone: a.phone ?? "",
    postcode: a.postcode ?? "",
    whatsapp: a.whatsapp ?? "",
  };
}

function asItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const it = (row ?? {}) as Partial<OrderItem>;
    return {
      productId: it.productId ?? "",
      productName: it.productName ?? "Item",
      productSlug: it.productSlug ?? "",
      collectionId: it.collectionId ?? "",
      variantId: it.variantId ?? "",
      colorName: it.colorName ?? "",
      colorHex: it.colorHex ?? "#000000",
      size: it.size ?? "",
      quantity: Number.isFinite(it.quantity) ? Number(it.quantity) : 0,
      unitPrice: Number.isFinite(it.unitPrice) ? Number(it.unitPrice) : 0,
      totalPrice: Number.isFinite(it.totalPrice) ? Number(it.totalPrice) : 0,
      imageUrl: typeof it.imageUrl === "string" ? it.imageUrl : "",
    };
  });
}

function asPaymentMethod(raw: unknown): Order["paymentMethod"] {
  if (raw === "momo" || raw === "card" || raw === "cash" || raw === "paystack") {
    return raw;
  }
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if (lower.includes("momo") || lower.includes("mobile")) return "momo";
    if (lower.includes("cash")) return "cash";
    if (lower.includes("paystack")) return "paystack";
  }
  return "card";
}

function asDeliveryType(raw: unknown): DeliveryType {
  return raw === "outside_accra" ? "outside_accra" : "accra_inhouse";
}

function asOrder(raw: unknown, fallbackId: string): Order | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.order && typeof obj.order === "object") {
    return asOrder(obj.order, fallbackId);
  }

  // REST wrappers often return `{ data: Order }` without a success flag.
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    const nested = asOrder(obj.data, fallbackId);
    if (nested) return nested;
  }

  // Require at least one order-identifying field so we don't treat an empty
  // envelope residual as a real order.
  const looksLikeOrder =
    typeof obj.id === "string" ||
    typeof obj.orderId === "string" ||
    typeof obj.orderNumber === "string" ||
    typeof obj.trackingNumber === "string" ||
    typeof obj.customerEmail === "string" ||
    Array.isArray(obj.items);

  if (!looksLikeOrder) return null;

  const { id, orderNumber } = resolveOrderApiId(obj, fallbackId);
  const base = obj as unknown as Order;

  return {
    ...base,
    id,
    orderNumber,
    trackingNumber: base.trackingNumber ?? "",
    customerId: base.customerId ?? "",
    customerName: base.customerName ?? "",
    customerEmail: base.customerEmail ?? "",
    customerPhone: base.customerPhone ?? "",
    shippingAddress: asAddress(obj.shippingAddress),
    billingAddress:
      obj.billingAddress == null ? null : asAddress(obj.billingAddress),
    items: asItems(obj.items),
    status: (base.status as OrderStatus) ?? "processing",
    paymentStatus: (base.paymentStatus as PaymentStatus) ?? "unpaid",
    paymentMethod: asPaymentMethod(obj.paymentMethod),
    paymentReference: base.paymentReference ?? null,
    subtotal: Number(base.subtotal) || 0,
    shippingFee: Number(base.shippingFee) || 0,
    discount: Number(base.discount) || 0,
    discountCode: base.discountCode ?? null,
    total: Number(base.total) || 0,
    currency: base.currency === "NGN" ? "NGN" : "GHS",
    notes: base.notes ?? "",
    customerNote: base.customerNote ?? "",
    deliveryType: asDeliveryType(obj.deliveryType),
    riderId: base.riderId ?? null,
    riderNote: base.riderNote ?? "",
    carrier: base.carrier ?? null,
    estimatedDelivery: base.estimatedDelivery ?? null,
    shippedAt: base.shippedAt ?? null,
    pickedUpAt: base.pickedUpAt ?? null,
    outForDeliveryAt: base.outForDeliveryAt ?? null,
    deliveredAt: base.deliveredAt ?? null,
    failedAt: base.failedAt ?? null,
    failureReason: base.failureReason ?? null,
    deliveryAttempts: Number(base.deliveryAttempts) || 0,
    returnVerifiedAt: base.returnVerifiedAt ?? null,
    createdAt: base.createdAt ?? "",
    updatedAt: base.updatedAt ?? "",
  };
}

export async function getOrder(id: string): Promise<Order> {
  if (useMockApi()) {
    const o = mockGetOrder(id);
    if (!o) throw new Error("Order not found");
    return o;
  }

  const raw = await execute<unknown>("order.get", {
    method: "GET",
    query: { id },
  });
  const direct = asOrder(raw, id);
  if (direct) return direct;

  // Some backends accept human-readable ids on list/search but return an empty
  // envelope from order.get — recover via filtered list.
  const listed = await executePaginated<Order>("order.list", {
    method: "GET",
    query: { q: id, page: 1, pageSize: 20 },
  });
  const found =
    listed.data.find((o) => o.id === id) ??
    listed.data.find((o) => o.trackingNumber === id) ??
    listed.data.find((o) => o.orderNumber === id);
  if (found) return asOrder(found, id) ?? found;

  throw new ApiError("Order not found", 404);
}

export async function updateOrderStatus(
  id: string,
  body: {
    status: OrderStatus;
    note?: string;
    carrier?: string;
    trackingNumber?: string;
  },
): Promise<Order> {
  if (useMockApi()) {
    const o = mockUpdateOrderStatus(id, body.status, body);
    if (!o) throw new Error("Order not found");
    return o;
  }

  // Workflow contract: PATCH /workflow/execute/order.update-status
  // body: { id: ORDER_UUID, status, note?, carrier?, trackingNumber? }
  const payload = {
    id,
    status: body.status,
    ...(body.note !== undefined ? { note: body.note } : {}),
    ...(body.carrier !== undefined ? { carrier: body.carrier } : {}),
    ...(body.trackingNumber !== undefined
      ? { trackingNumber: body.trackingNumber }
      : {}),
  };

  try {
    const raw = await execute<unknown>("order.update-status", {
      method: "PATCH",
      body: payload,
    });

    const updated = asOrder(raw, id);
    if (updated) return updated;

    // Some handlers return 200 with a thin/empty body — confirm via get.
    return getOrder(id);
  } catch (err) {
    // Live API: order.get returns id like ORD-… (no UUID in payload), but
    // order.update-status 404s on that same id. Surface that clearly.
    if (err instanceof ApiError && err.status === 404 && !isUuid(id)) {
      throw new ApiError(
        `Order not found for id "${id}". order.get uses this human code as id, but order.update-status cannot resolve it. Backend needs to accept ORD-… on update-status, or return the internal UUID from order.get/list.`,
        404,
      );
    }
    throw err;
  }
}

export async function updateOrderNotes(
  id: string,
  notes: string,
): Promise<Order> {
  return executeOrMock(
    "order.update-notes",
    () => {
      const o = mockUpdateOrderNotes(id, notes);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "PATCH", body: { id, notes } },
  );
}

export async function refundOrder(
  id: string,
  amount: number,
  reason: string,
): Promise<Order> {
  return executeOrMock(
    "order.refund",
    () => {
      const o = mockRefundOrder(id, amount, reason);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "POST", body: { id, amount, reason } },
  );
}

export async function cancelOrder(id: string, note?: string): Promise<Order> {
  return executeOrMock(
    "order.cancel",
    () => {
      const o = mockUpdateOrderStatus(id, "cancelled", { note });
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "POST", body: { id, note } },
  );
}

// Delivery / rider assignment live as REST paths under Admin v2 additions
// (not workflow usecases yet).

export async function getDeliveryEvents(
  orderId: string,
): Promise<DeliveryEvent[]> {
  return restOrMock(
    `/orders/${orderId}/delivery-events`,
    () => mockGetDeliveryEvents(orderId),
  );
}

export async function assignRider(
  orderId: string,
  body: { riderId: string | null; riderNote?: string },
): Promise<Order> {
  return restOrMock(
    `/orders/${orderId}/assign-rider`,
    () => {
      const o = mockAssignRider(orderId, body.riderId, body.riderNote);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "PATCH", body },
  );
}

export async function updateRiderNote(
  orderId: string,
  riderNote: string,
): Promise<Order> {
  return restOrMock(
    `/orders/${orderId}/rider-note`,
    () => {
      const o = mockUpdateRiderNote(orderId, riderNote);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "PATCH", body: { riderNote } },
  );
}

export async function confirmReturnVerified(orderId: string): Promise<Order> {
  return restOrMock(
    `/orders/${orderId}/confirm-return`,
    () => {
      const o = mockConfirmReturnVerified(orderId);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "POST", body: {} },
  );
}

export async function exportOrdersCsv(params: {
  from?: string;
  to?: string;
}): Promise<void> {
  const from = params.from ?? "2020-01-01";
  const to = params.to ?? new Date().toISOString().slice(0, 10);
  const filename = `orders-${from}-to-${to}.csv`;

  if (useMockApi()) {
    const { data: orders } = await getOrders({
      from,
      to,
      page: 1,
      pageSize: 500,
    });
    downloadCsv(
      filename,
      orders.map((o) => ({
        order_id: o.id,
        tracking: o.trackingNumber,
        customer: o.customerName,
        email: o.customerEmail,
        country: o.shippingAddress.country,
        items: o.items.reduce((s, i) => s + i.quantity, 0),
        total: o.total,
        currency: o.currency,
        status: o.status,
        payment: o.paymentStatus,
        created_at: o.createdAt,
      })),
    );
    return;
  }

  await downloadApiFile("/workflow/execute/order.export-csv", filename, {
    from,
    to,
  });
}
