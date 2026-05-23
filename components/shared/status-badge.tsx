import type { OrderStatus, PaymentStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/format";

type OrderVariant =
  | "amber"
  | "blue"
  | "indigo"
  | "violet"
  | "orange"
  | "emerald"
  | "zinc"
  | "rose"
  | "red";

const orderConfig: Record<OrderStatus, OrderVariant> = {
  pending: "amber",
  processing: "blue",
  shipped: "indigo",
  in_transit: "violet",
  out_for_delivery: "orange",
  delivered: "emerald",
  cancelled: "zinc",
  refunded: "rose",
  exception: "red",
};

type PaymentVariant = "emerald" | "amber" | "rose" | "red" | "zinc";

const paymentConfig: Record<PaymentStatus, PaymentVariant> = {
  paid: "emerald",
  unpaid: "amber",
  partially_refunded: "rose",
  refunded: "rose",
  failed: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={orderConfig[status]}>{statusLabel(status)}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={paymentConfig[status]}>{statusLabel(status)}</Badge>;
}

export function CustomerStatusBadge({
  status,
}: {
  status: "active" | "suspended" | "unverified";
}) {
  const map = {
    active: "emerald",
    suspended: "red",
    unverified: "zinc",
  } as const;
  return <Badge variant={map[status]}>{statusLabel(status)}</Badge>;
}

export function InnerCircleStatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected" | "waitlisted";
}) {
  const map = {
    pending: "amber",
    approved: "emerald",
    rejected: "red",
    waitlisted: "violet",
  } as const;
  return <Badge variant={map[status]}>{statusLabel(status)}</Badge>;
}

export function ReviewStatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const map = {
    pending: "amber",
    approved: "emerald",
    rejected: "red",
  } as const;
  return <Badge variant={map[status]}>{statusLabel(status)}</Badge>;
}
