"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Printer, Search, X } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  countryCurrency,
  downloadCsv,
  fmtDate,
  formatMoney,
  relative,
  statusLabel,
} from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge";
import type { OrderStatus, PaymentStatus } from "@/types";

export default function OrdersPage() {
  const orders = useAdminStore((s) => s.orders);
  const [status, setStatus] = React.useState<OrderStatus | "all">("all");
  const [payment, setPayment] = React.useState<PaymentStatus | "all">("all");
  const [country, setCountry] = React.useState<"all" | "Ghana" | "Nigeria">(
    "all",
  );
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (payment !== "all" && o.paymentStatus !== payment) return false;
      if (country !== "all" && o.currency !== countryCurrency(country))
        return false;
      if (from && new Date(o.createdAt) < new Date(from)) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (new Date(o.createdAt) > end) return false;
      }
      if (q) {
        const needle = q.toLowerCase();
        if (
          !o.id.toLowerCase().includes(needle) &&
          !o.trackingNumber.toLowerCase().includes(needle) &&
          !o.customerName.toLowerCase().includes(needle) &&
          !o.customerEmail.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
  }, [orders, status, payment, country, from, to, q]);

  const clearFilters = () => {
    setStatus("all");
    setPayment("all");
    setCountry("all");
    setFrom("");
    setTo("");
    setQ("");
  };

  const exportCsv = () => {
    downloadCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((o) => ({
        order_id: o.id,
        tracking: o.trackingNumber,
        customer: o.customerName,
        email: o.customerEmail,
        country: o.currency === "GHS" ? "Ghana" : "Nigeria",
        items: o.items.reduce((s, i) => s + i.quantity, 0),
        total: o.total,
        currency: o.currency,
        status: o.status,
        payment: o.paymentStatus,
        created_at: o.createdAt,
      })),
    );
  };

  const hasFilters =
    status !== "all" ||
    payment !== "all" ||
    country !== "all" ||
    !!from ||
    !!to ||
    !!q;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Orders</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {filtered.length} of {orders.length} orders
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search order, tracking, customer..."
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as never)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={payment} onValueChange={(v) => setPayment(v as never)}>
            <SelectTrigger>
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              {PAYMENT_STATUSES.map((p) => (
                <SelectItem key={p} value={p}>
                  {statusLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={(v) => setCountry(v as never)}>
            <SelectTrigger>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
              <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-xs"
            />
            <span className="text-xs text-zinc-400">to</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-xs"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="md:col-span-2 lg:col-span-6 justify-self-start text-xs"
            >
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-zinc-500"
                  >
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => {
                  const firstItem = o.items[0];
                  const more = o.items.length - 1;
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-medium text-zinc-900 hover:underline"
                        >
                          {o.id}
                        </Link>
                        <div className="text-xs text-zinc-400">
                          {o.trackingNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-zinc-900">
                          {o.customerName}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {o.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-zinc-900">
                          {o.items.reduce((s, i) => s + i.quantity, 0)}
                        </div>
                        <div className="text-xs text-zinc-500 line-clamp-1">
                          {firstItem.productName}
                          {more > 0 ? ` +${more} more` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatMoney(o.total, o.currency)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-xs text-zinc-600"
                          title={fmtDate(o.createdAt)}
                        >
                          {relative(o.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/orders/${o.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
