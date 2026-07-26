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
  processing: "blue",
  ready_for_pickup: "amber",
  picked_up: "indigo",
  in_transit: "violet",
  delivered: "emerald",
  returned: "red",
  cancelled: "zinc",
  refunded: "rose",
};

type PaymentVariant = "emerald" | "amber" | "rose" | "red" | "zinc";

const paymentConfig: Record<PaymentStatus, PaymentVariant> = {
  paid: "emerald",
  unpaid: "amber",
  partially_refunded: "rose",
  refunded: "rose",
  failed: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const variant = orderConfig[status as OrderStatus] ?? "zinc";
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}

export function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus | string;
}) {
  const variant = paymentConfig[status as PaymentStatus] ?? "zinc";
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
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

export function RiderStatusBadge({
  status,
}: {
  status: "active" | "inactive";
}) {
  const map = {
    active: "emerald",
    inactive: "zinc",
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
