"use client";

import { useState } from "react";
import Link from "next/link";
import { useReturns } from "@/lib/hooks";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
import type { ReturnStatus } from "@/types";

const STATUS_TABS: { label: string; value: ReturnStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Received", value: "RECEIVED" },
  { label: "Refunded", value: "REFUNDED" },
];

export default function ReturnsPage() {
  const [status, setStatus] = useState<ReturnStatus | "">("");
  const { data, isLoading } = useReturns({ status: status || undefined });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Returns</h1>

      <Tabs
        value={status}
        onValueChange={(v) => setStatus(v as ReturnStatus | "")}
      >
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
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
              : data?.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs text-zinc-600">
                      {r.id}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-900">
                      {r.orderNumber}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {r.customer.name ?? r.customer.email}
                    </TableCell>
                    <TableCell className="text-zinc-600 capitalize">
                      {r.reason.replace(/_/g, " ").toLowerCase()}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {r.items.length}
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/returns/${r.id}`}>
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
