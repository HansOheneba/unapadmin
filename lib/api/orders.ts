import type { Order, OrderStatus, Paginated } from "@/types";
import { apiFetchOrMock } from "./client";
import type { DeliveryEvent } from "@/types";
import {
  mockAssignRider,
  mockGetDeliveryEvents,
  mockGetOrder,
  mockGetOrders,
  mockRefundOrder,
  mockUpdateOrderNotes,
  mockUpdateOrderStatus,
  mockUpdateRiderNote,
  mockConfirmReturnVerified,
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

function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getOrders(
  params: OrderListParams = {},
): Promise<Paginated<Order>> {
  return apiFetchOrMock(
    `/orders${toQuery(params)}`,
    () => mockGetOrders(params),
  );
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetchOrMock(`/orders/${id}`, () => {
    const o = mockGetOrder(id);
    if (!o) throw new Error("Order not found");
    return o;
  });
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
  return apiFetchOrMock(
    `/orders/${id}/status`,
    () => {
      const o = mockUpdateOrderStatus(id, body.status, body);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function updateOrderNotes(
  id: string,
  notes: string,
): Promise<Order> {
  return apiFetchOrMock(
    `/orders/${id}/notes`,
    () => {
      const o = mockUpdateOrderNotes(id, notes);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "PATCH", body: JSON.stringify({ notes }) },
  );
}

export async function refundOrder(
  id: string,
  amount: number,
  reason: string,
): Promise<Order> {
  return apiFetchOrMock(
    `/orders/${id}/refund`,
    () => {
      const o = mockRefundOrder(id, amount, reason);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "POST", body: JSON.stringify({ amount, reason }) },
  );
}

export async function getDeliveryEvents(
  orderId: string,
): Promise<DeliveryEvent[]> {
  return apiFetchOrMock(
    `/orders/${orderId}/delivery-events`,
    () => mockGetDeliveryEvents(orderId),
  );
}

export async function assignRider(
  orderId: string,
  body: { riderId: string | null; riderNote?: string },
): Promise<Order> {
  return apiFetchOrMock(
    `/orders/${orderId}/assign-rider`,
    () => {
      const o = mockAssignRider(orderId, body.riderId, body.riderNote);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function updateRiderNote(
  orderId: string,
  riderNote: string,
): Promise<Order> {
  return apiFetchOrMock(
    `/orders/${orderId}/rider-note`,
    () => {
      const o = mockUpdateRiderNote(orderId, riderNote);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "PATCH", body: JSON.stringify({ riderNote }) },
  );
}

export async function confirmReturnVerified(orderId: string): Promise<Order> {
  return apiFetchOrMock(
    `/orders/${orderId}/confirm-return`,
    () => {
      const o = mockConfirmReturnVerified(orderId);
      if (!o) throw new Error("Order not found");
      return o;
    },
    { method: "POST" },
  );
}
