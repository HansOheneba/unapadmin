"use client";

import { use } from "react";
import Link from "next/link";
import { useCustomer } from "@/lib/hooks";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useCustomer(id);

  if (isLoading)
    return (
      <div className="h-48 bg-white border border-zinc-100 rounded-lg animate-pulse" />
    );
  if (!data) return <div className="text-zinc-500">Customer not found.</div>;

  const avgOrderValue =
    data.totalOrders > 0 ? data.totalSpent / data.totalOrders : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Customer</h1>
        <Link href="/dashboard/customers">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="bg-white border border-zinc-100 rounded-lg p-6 space-y-3">
          <h2 className="font-semibold text-zinc-900">Profile</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-zinc-500">Name</p>
              <p className="text-zinc-900 font-medium">{data.name ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Email</p>
              <p className="text-zinc-800">{data.email}</p>
            </div>
            <div>
              <p className="text-zinc-500">Phone</p>
              <p className="text-zinc-800">{data.phone ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Country</p>
              <p className="text-zinc-800">{data.country ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Joined</p>
              <p className="text-zinc-800">{formatDate(data.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {[
            { label: "Total Orders", value: data.totalOrders },
            { label: "Lifetime Value", value: formatCurrency(data.totalSpent) },
            { label: "Avg Order Value", value: formatCurrency(avgOrderValue) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-zinc-100 rounded-lg p-5"
            >
              <p className="text-sm text-zinc-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-zinc-900 mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order history */}
      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Order History</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-zinc-400 py-8"
                >
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              data.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total, order.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
