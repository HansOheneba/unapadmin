"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";
import { useDiscounts, useDeleteDiscount, useUpdateDiscount } from "@/lib/hooks";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Discount } from "@/types";

export default function DiscountsPage() {
  const { data: discounts = [], isLoading } = useDiscounts();
  const deleteDiscount = useDeleteDiscount();
  const updateDiscount = useUpdateDiscount();
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);

  const handleToggle = (discount: Discount) => {
    updateDiscount.mutate(
      { id: discount.id, body: { active: !discount.active } },
      { onSuccess: () => toast.success("Updated"), onError: () => toast.error("Failed") },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDiscount.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Deleted"); setDeleteTarget(null); },
      onError: () => toast.error("Failed to delete"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Discounts</h1>
        <Link href="/dashboard/discounts/new">
          <Button><PlusCircle className="h-4 w-4 mr-2" />New Discount</Button>
        </Link>
      </div>

      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-zinc-100 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono font-medium text-zinc-900">{d.code}</TableCell>
                    <TableCell>
                      <Badge variant="default">{d.type === "PERCENTAGE" ? "%" : "Fixed"}</Badge>
                    </TableCell>
                    <TableCell className="text-zinc-700">
                      {d.type === "PERCENTAGE" ? `${d.value}%` : `$${d.value}`}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {d.usedCount}{d.maxUses ? ` / ${d.maxUses}` : ""}
                    </TableCell>
                    <TableCell>
                      <Switch checked={d.active} onCheckedChange={() => handleToggle(d)} />
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {d.expiresAt ? formatDate(d.expiresAt) : "Never"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteTarget(d)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Discount"
        description={`Delete the code "${deleteTarget?.code}"? This cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
        loading={deleteDiscount.isPending}
      />
    </div>
  );
}
