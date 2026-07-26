import { format, formatDistanceToNow } from "date-fns";
import type { OrderStatus, PaymentStatus } from "@/types";

/** All order amounts are stored and displayed in Ghana cedis (Paystack handles FX). */
export function formatMoney(amount: number | null | undefined) {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return `₵${value.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function fmtDate(d: string | Date) {
  return format(new Date(d), "MMM d, yyyy");
}

export function fmtDateTime(d: string | Date) {
  return format(new Date(d), "MMM d, yyyy · h:mm a");
}

export function relative(d: string | Date) {
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}

export const ORDER_STATUSES: OrderStatus[] = [
  "processing",
  "ready_for_pickup",
  "picked_up",
  "in_transit",
  "delivered",
  "returned",
  "cancelled",
  "refunded",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "unpaid",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
];

/** Sequential fulfillment flow for Accra in-house orders. */
export const FULFILLMENT_STEPS: OrderStatus[] = [
  "processing",
  "ready_for_pickup",
  "picked_up",
  "in_transit",
  "delivered",
];

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
  returned: "Returned",
};

export function statusLabel(s: string) {
  if (!s) return "Unknown";
  if (s in STATUS_LABELS) return STATUS_LABELS[s as OrderStatus]!;
  return s
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export const COUNTRY_FLAG: Record<string, string> = {
  Ghana: "🇬🇭",
  Nigeria: "🇳🇬",
};

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
