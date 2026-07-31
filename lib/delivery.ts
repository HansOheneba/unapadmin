import type {
  AssignmentStatus,
  DeliveryEventType,
  DeliveryType,
  Order,
  OrderStatus,
} from "@/types";
import { FULFILLMENT_STEPS } from "@/lib/format";

/** Accra in-house riders. Outside Greater Accra is handled later. */
export function inferDeliveryType(
  order: Pick<Order, "shippingAddress">,
): DeliveryType {
  const a = order.shippingAddress;
  const haystack = [a.city, a.region, a.district, a.address, a.address2]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Suburbs (Madina, East Legon, Tema, …) often have city !== "Accra".
  // Match the region / any Accra mention across address fields.
  if (haystack.includes("greater accra") || /\baccra\b/.test(haystack)) {
    return "accra_inhouse";
  }
  return "outside_accra";
}

export function isAccraInhouse(
  order: Pick<Order, "deliveryType" | "shippingAddress">,
): boolean {
  if (order.deliveryType === "accra_inhouse") return true;
  // Some APIs only treat city === "Accra" as in-house and mis-tag
  // Greater Accra suburbs (e.g. Madina) as outside_accra.
  return inferDeliveryType(order) === "accra_inhouse";
}

export const DELIVERY_EVENT_LABELS: Record<DeliveryEventType, string> = {
  assigned: "Rider assigned",
  picked_up: "Picked up at warehouse",
  out_for_delivery: "Rider departed",
  delivered: "Delivered",
  failed: "Delivery failed",
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  unassigned: "Awaiting rider",
  assigned: "Assigned",
  picked_up: "Picked up",
  out_for_delivery: "In transit",
  delivered: "Delivered",
  failed: "Returned",
};

/** Maps order status to rider assignment view (for rider app alignment). */
export function assignmentStatusFromOrder(order: Order): AssignmentStatus {
  if (!order.riderId) return "unassigned";
  if (order.status === "returned" || order.failedAt) return "failed";
  if (order.status === "delivered") return "delivered";
  if (order.status === "in_transit") return "out_for_delivery";
  if (order.status === "picked_up") return "picked_up";
  if (
    order.status === "ready_for_pickup" ||
    order.status === "processing"
  ) {
    return "assigned";
  }
  return "assigned";
}

export function fulfillmentStepIndex(status: OrderStatus): number {
  if (status === "returned") return FULFILLMENT_STEPS.indexOf("in_transit");
  const idx = FULFILLMENT_STEPS.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export function canAssignRider(order: Order): boolean {
  if (!isAccraInhouse(order)) return false;
  return [
    "ready_for_pickup",
    "picked_up",
    "in_transit",
    "returned",
  ].includes(order.status);
}

export function needsReturnVerification(order: Order): boolean {
  return order.status === "returned" && !order.returnVerifiedAt;
}

/** Admin only marks processing → ready_for_pickup. Rider drives the rest. */
export function adminFulfillmentActions(order: Order): {
  canMarkReady: boolean;
  canConfirmReturn: boolean;
} {
  return {
    canMarkReady: order.status === "processing",
    canConfirmReturn: needsReturnVerification(order),
  };
}
