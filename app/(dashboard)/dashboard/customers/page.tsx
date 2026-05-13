"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useCustomers } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useCustomers({ q: q || undefined });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Customers</h1>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search customers..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Lifetime Value</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-zinc-100 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium text-zinc-900">{customer.name ?? "N/A"}</TableCell>
                    <TableCell className="text-zinc-600">{customer.email}</TableCell>
                    <TableCell className="text-zinc-600">{customer.country ?? "N/A"}</TableCell>
                    <TableCell className="text-zinc-700">{customer.totalOrders}</TableCell>
                    <TableCell className="text-zinc-900 font-medium">{formatCurrency(customer.totalSpent)}</TableCell>
                    <TableCell className="text-zinc-500">{formatDate(customer.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
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
