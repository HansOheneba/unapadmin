"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useOrders } from "@/lib/hooks/useOrders";
import { StatusBadge } from "@/components/shared/status-badge";
import { CsvExportButton } from "@/components/shared/csv-export-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STATUS_TABS: { label: string; value: OrderStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [q, setQ] = useState("");

  const { data: ordersData, isLoading } = useOrders({
    status: status || undefined,
    q: q || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Orders</h1>
        <CsvExportButton
          url="/orders/export/csv"
          params={status ? { status } : {}}
          filename="orders.csv"
        />
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as OrderStatus | "")}>
        <TabsList className="flex-wrap h-auto gap-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search orders..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-zinc-100 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : ordersData?.data.map((order) => {
                  const customerName =
                    order.customer?.name ?? order.guestName ?? "Guest";
                  const customerEmail =
                    order.customer?.email ?? order.guestEmail ?? "";
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-zinc-900">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-zinc-800">{customerName}</p>
                          <p className="text-xs text-zinc-400">{customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {order.items.length}
                      </TableCell>
                      <TableCell className="text-zinc-900 font-medium">
                        {formatCurrency(order.total, order.currency)}
                      </TableCell>
                      <TableCell className="text-zinc-600 capitalize">
                        {order.paymentMethod ?? "N/A"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
