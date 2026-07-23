import type { DeliveryEvent, Order, OrderStatus, Paginated } from "@/types";
import {
  ApiError,
  execute,
  executeOrMock,
  executePaginated,
  executePaginatedOrMock,
  restOrMock,
  useMockApi,
} from "./client";
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
  return { ...(obj as unknown as Order), id };
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
    carrier?: string;
    trackingNumber?: string;
    note?: string;
  },
): Promise<Order> {
  return executeOrMock(
    "order.update-status",
    () => {
      const o = mockUpdateOrderStatus(id, body.status, body);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "PATCH", body: { id, ...body } },
  );
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
