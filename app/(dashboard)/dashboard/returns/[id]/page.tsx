"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useReturn, useUpdateReturnStatus } from "@/lib/hooks";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReturnStatus } from "@/types";

export default function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: ret, isLoading } = useReturn(id);
  const updateStatus = useUpdateReturnStatus();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  const handleStatusUpdate = (status: ReturnStatus) => {
    updateStatus.mutate(
      { id, status, refundAmount: status === "REFUNDED" && refundAmount ? Number(refundAmount) : undefined },
      {
        onSuccess: () => {
          toast.success("Status updated");
          setApproveOpen(false);
          setRejectOpen(false);
        },
        onError: () => toast.error("Failed to update status"),
      },
    );
  };

  if (isLoading) return <div className="h-48 bg-white border border-zinc-100 rounded-lg animate-pulse" />;
  if (!ret) return <div className="text-zinc-500">Return not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">Return {ret.orderNumber}</h1>
          <StatusBadge status={ret.status} />
        </div>
        <Link href="/dashboard/returns"><Button variant="outline">Back</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-3">Customer</h2>
            <p className="text-zinc-800 font-medium">{ret.customer.name ?? "N/A"}</p>
            <p className="text-zinc-500 text-sm">{ret.customer.email}</p>
          </div>

          {/* Items */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-3">Items Being Returned</h2>
            <div className="space-y-2">
              {ret.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded border border-zinc-50">
                  <div className="relative h-10 w-10 rounded overflow-hidden shrink-0">
                    <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-zinc-800 font-medium">{item.productName}</p>
                    <p className="text-xs text-zinc-400">{[item.color, item.size].filter(Boolean).join(" / ")}</p>
                  </div>
                  <p className="text-zinc-700">x{item.quantity}</p>
                  <p className="text-zinc-900 font-medium">{formatCurrency(item.price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-1">Reason</h2>
            <p className="text-zinc-700 capitalize">{ret.reason.replace(/_/g, " ").toLowerCase()}</p>
            {ret.notes && <p className="text-sm text-zinc-500 mt-2">{ret.notes}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-100 rounded-lg p-5 space-y-3">
            <h2 className="font-semibold text-zinc-900">Actions</h2>
            <p className="text-xs text-zinc-500">Requested {formatDate(ret.createdAt)}</p>
            {ret.refundAmount != null && (
              <p className="text-sm text-zinc-700">Refund amount: {formatCurrency(ret.refundAmount)}</p>
            )}
            <div className="space-y-2">
              {ret.status === "REQUESTED" && (
                <>
                  <Button className="w-full" onClick={() => setApproveOpen(true)}>Approve</Button>
                  <Button variant="destructive" className="w-full" onClick={() => setRejectOpen(true)}>Reject</Button>
                </>
              )}
              {ret.status === "APPROVED" && (
                <Button className="w-full" onClick={() => handleStatusUpdate("RECEIVED")}>Mark as Received</Button>
              )}
              {ret.status === "RECEIVED" && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="refund">Refund Amount</Label>
                    <Input id="refund" type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <Button className="w-full" onClick={() => handleStatusUpdate("REFUNDED")}>Process Refund</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Return"
        description="Are you sure you want to approve this return request?"
        onConfirm={() => handleStatusUpdate("APPROVED")}
        confirmLabel="Approve"
        loading={updateStatus.isPending}
      />
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Return"
        description="Are you sure you want to reject this return request?"
        onConfirm={() => handleStatusUpdate("REJECTED")}
        confirmLabel="Reject"
        destructive
        loading={updateStatus.isPending}
      />
    </div>
  );
}
