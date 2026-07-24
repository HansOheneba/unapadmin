"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Search, X } from "lucide-react";
import { useOrders } from "@/lib/hooks/useOrders";
import { useRiders } from "@/lib/hooks/useRiders";
import { isAccraInhouse } from "@/lib/delivery";
import { toast } from "sonner";
import { exportOrdersCsv } from "@/lib/api/orders";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  fmtDate,
  formatMoney,
  relative,
  statusLabel,
} from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableBodySkeleton } from "@/components/shared/page-skeletons";
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
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge";
import { ListPagination } from "@/components/shared/list-pagination";
import { PAGE_SIZE } from "@/lib/constants/pagination";
import type { OrderStatus, PaymentStatus } from "@/types";

export default function OrdersPage() {
  const [status, setStatus] = React.useState<OrderStatus | "all">("all");
  const [payment, setPayment] = React.useState<PaymentStatus | "all">("all");
  const [country, setCountry] = React.useState<"all" | "Ghana" | "Nigeria">(
    "all",
  );
  const [rider, setRider] = React.useState<string>("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);

  const listParams = React.useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      paymentStatus: payment === "all" ? undefined : payment,
      country: country === "all" ? undefined : country,
      riderId:
        rider === "all" ? undefined : rider === "unassigned" ? "unassigned" : rider,
      from: from || undefined,
      to: to || undefined,
      q: q || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [status, payment, country, rider, from, to, q, page],
  );

  React.useEffect(() => {
    setPage(1);
  }, [status, payment, country, rider, from, to, q]);

  const { data, isLoading } = useOrders(listParams);
  const { data: ridersPage } = useRiders({ page: 1, pageSize: 50 });
  const riders = ridersPage?.data ?? [];
  const riderMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const r of ridersPage?.data ?? []) {
      m.set(r.id, `${r.firstName} ${r.lastName}`);
    }
    return m;
  }, [ridersPage?.data]);

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const clearFilters = () => {
    setStatus("all");
    setPayment("all");
    setCountry("all");
    setRider("all");
    setFrom("");
    setTo("");
    setQ("");
    setPage(1);
  };

  const [exporting, setExporting] = React.useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await exportOrdersCsv({
        from: from || undefined,
        to: to || undefined,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to export orders.");
    } finally {
      setExporting(false);
    }
  };

  const hasFilters =
    status !== "all" ||
    payment !== "all" ||
    country !== "all" ||
    rider !== "all" ||
    !!from ||
    !!to ||
    !!q;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Orders</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {total} order{total === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-52 md:w-60 shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as never)}>
              <SelectTrigger className="h-9 w-[9.5rem] text-sm">
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
              <SelectTrigger className="h-9 w-[8.5rem] text-sm">
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
            <Select value={rider} onValueChange={setRider}>
              <SelectTrigger className="h-9 w-[10rem] text-sm">
                <SelectValue placeholder="Rider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All riders</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {riders.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.firstName} {r.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={country} onValueChange={(v) => setCountry(v as never)}>
              <SelectTrigger className="h-9 w-[7.5rem] text-sm">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-[8.75rem] text-sm"
              aria-label="From date"
            />
            <span className="text-xs text-zinc-400">–</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-[8.75rem] text-sm"
              aria-label="To date"
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-2 text-xs text-zinc-500"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
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
                <TableHead>Delivery</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableBodySkeleton columns={9} />
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-12 text-zinc-500"
                  >
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
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
                        {formatMoney(o.total)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>
                        {isAccraInhouse(o) ? (
                          o.status === "delivered" && o.riderId ? (
                            <span className="text-xs text-zinc-600">
                              Delivered by{" "}
                              {riderMap.get(o.riderId) ?? o.riderId}
                            </span>
                          ) : o.riderId ? (
                            <span className="text-xs text-zinc-600">
                              {riderMap.get(o.riderId) ?? o.riderId}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              No rider
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-zinc-500">
                            Outside Accra
                          </span>
                        )}
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
          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
