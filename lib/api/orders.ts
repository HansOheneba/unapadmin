import type { DeliveryEvent, Order, OrderStatus, Paginated } from "@/types";
import {
  executeOrMock,
  executePaginatedOrMock,
  restOrMock,
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

export async function getOrder(id: string): Promise<Order> {
  return executeOrMock(
    "order.get",
    () => {
      const o = mockGetOrder(id);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "GET", query: { id } },
  );
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
