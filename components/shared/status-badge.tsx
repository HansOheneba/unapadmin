"use client";

import type { OrderStatus, ReturnStatus, DeliveryStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

type Status = OrderStatus | ReturnStatus | DeliveryStatus;

const statusConfig: Record<
  Status,
  {
    label: string;
    variant:
      | "yellow"
      | "blue"
      | "indigo"
      | "purple"
      | "green"
      | "red"
      | "zinc"
      | "orange"
      | "default";
  }
> = {
  // Order statuses
  PENDING: { label: "Pending", variant: "yellow" },
  CONFIRMED: { label: "Confirmed", variant: "blue" },
  PROCESSING: { label: "Processing", variant: "indigo" },
  SHIPPED: { label: "Shipped", variant: "purple" },
  DELIVERED: { label: "Delivered", variant: "green" },
  CANCELLED: { label: "Cancelled", variant: "red" },
  REFUNDED: { label: "Refunded", variant: "zinc" },
  // Return statuses
  REQUESTED: { label: "Requested", variant: "yellow" },
  APPROVED: { label: "Approved", variant: "blue" },
  REJECTED: { label: "Rejected", variant: "red" },
  RECEIVED: { label: "Received", variant: "indigo" },
  // Delivery statuses
  AWAITING_PICKUP: { label: "Awaiting Pickup", variant: "yellow" },
  IN_TRANSIT: { label: "In Transit", variant: "blue" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "purple" },
  FAILED: { label: "Failed", variant: "red" },
  RETURNED_TO_SENDER: { label: "Returned to Sender", variant: "orange" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
