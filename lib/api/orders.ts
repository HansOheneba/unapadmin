import type { DeliveryEvent, Order, OrderStatus, Paginated } from "@/types";
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
  return executePaginatedOrMock(
    "order.list",
    () => mockGetOrders(params),
    { method: "GET", query: params },
  );
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

  const id =
    typeof obj.id === "string"
      ? obj.id
      : typeof obj.orderId === "string"
        ? obj.orderId
        : fallbackId;

  // Require at least one order-identifying field so we don't treat an empty
  // envelope residual as a real order.
  const looksLikeOrder =
    typeof obj.id === "string" ||
    typeof obj.orderId === "string" ||
    typeof obj.trackingNumber === "string" ||
    typeof obj.customerEmail === "string" ||
    Array.isArray(obj.items);

  if (!looksLikeOrder) return null;

  const order = { ...(obj as unknown as Order), id };
  // API may return null for optional strings — keep React inputs controlled.
  return {
    ...order,
    notes: order.notes ?? "",
    customerNote: order.customerNote ?? "",
    riderNote: order.riderNote ?? "",
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
    listed.data.find((o) => o.trackingNumber === id);
  if (found) return found;

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
  // body: { id, status, note?, carrier?, trackingNumber? }
  const payload = {
    id,
    status: body.status,
    ...(body.note !== undefined ? { note: body.note } : {}),
    ...(body.carrier !== undefined ? { carrier: body.carrier } : {}),
    ...(body.trackingNumber !== undefined
      ? { trackingNumber: body.trackingNumber }
      : {}),
  };

  const raw = await execute<unknown>("order.update-status", {
    method: "PATCH",
    body: payload,
  });

  const updated = asOrder(raw, id);
  if (updated) return updated;

  // Some handlers return 200 with a thin/empty body — confirm via get.
  return getOrder(id);
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
