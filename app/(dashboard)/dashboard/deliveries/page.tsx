"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useDeliveries } from "@/lib/hooks";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { DeliveryStatus } from "@/types";

const STATUS_TABS: { label: string; value: DeliveryStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Awaiting Pickup", value: "AWAITING_PICKUP" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Failed", value: "FAILED" },
];

export default function DeliveriesPage() {
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const [q, setQ] = useState("");
  const { data, isLoading } = useDeliveries({
    status: status || undefined,
    q: q || undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Deliveries</h1>

      <Tabs
        value={status}
        onValueChange={(v) => setStatus(v as DeliveryStatus | "")}
      >
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
          placeholder="Search deliveries..."
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
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Est. Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.data.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.orderNumber}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {d.customer.name ?? d.customer.email}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {d.carrier ?? "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">
                      {d.trackingNumber ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {d.estimatedDelivery
                        ? formatDate(d.estimatedDelivery)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(d.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/deliveries/${d.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
