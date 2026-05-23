import { format, formatDistanceToNow } from "date-fns";
import type { Currency, OrderStatus, PaymentStatus } from "@/types";

export function formatMoney(amount: number, currency: Currency = "GHS") {
  return `${currency} ${amount.toLocaleString("en-US", {
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
  "pending",
  "processing",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
  "exception",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "unpaid",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
];

export const ORDER_LIFECYCLE: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export function statusLabel(s: string) {
  return s
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export const COUNTRY_FLAG: Record<string, string> = {
  Ghana: "🇬🇭",
  Nigeria: "🇳🇬",
};

export function countryCurrency(country: "Ghana" | "Nigeria"): Currency {
  return country === "Ghana" ? "GHS" : "NGN";
}

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
