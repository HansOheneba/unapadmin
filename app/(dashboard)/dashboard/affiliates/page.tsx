"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { useAffiliates } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default function AffiliatesPage() {
  const { data: affiliates = [], isLoading } = useAffiliates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Affiliates</h1>
        <Link href="/dashboard/affiliates/new">
          <Button><PlusCircle className="h-4 w-4 mr-2" />Add Affiliate</Button>
        </Link>
      </div>

      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Referrals</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Owed</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-zinc-100 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : affiliates.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-900">{a.name}</p>
                        <p className="text-xs text-zinc-400">{a.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-zinc-700">{a.code}</TableCell>
                    <TableCell className="text-zinc-700">{(a.commissionRate * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-zinc-700">{a.totalReferrals}</TableCell>
                    <TableCell className="text-zinc-900 font-medium">{formatCurrency(a.totalRevenue)}</TableCell>
                    <TableCell className="text-orange-600 font-medium">{formatCurrency(a.totalOwed)}</TableCell>
                    <TableCell className="text-zinc-600">{formatCurrency(a.totalPaid)}</TableCell>
                    <TableCell>
                      <Badge variant={a.active ? "green" : "zinc"}>{a.active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/affiliates/${a.id}`}>
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
