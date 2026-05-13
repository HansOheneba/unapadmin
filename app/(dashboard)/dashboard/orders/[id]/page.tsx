"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useOrder, useUpdateOrderStatus, useUpdateOrderNotes } from "@/lib/hooks/useOrders";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import type { OrderStatus } from "@/types";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const updateNotes = useUpdateOrderNotes();
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  if (isLoading) return <div className="h-48 bg-white border border-zinc-100 rounded-lg animate-pulse" />;
  if (!order) return <div className="text-zinc-500">Order not found.</div>;

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => { toast.success("Status updated"); setConfirmOpen(false); },
        onError: () => toast.error("Failed to update status"),
      },
    );
  };

  const handleNotesSave = () => {
    updateNotes.mutate(
      { id, notes },
      {
        onSuccess: () => { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000); },
        onError: () => toast.error("Failed to save notes"),
      },
    );
  };

  const customerName = order.customer?.name ?? order.guestName ?? "Guest";
  const customerEmail = order.customer?.email ?? order.guestEmail ?? "";
  const customerPhone = order.guestPhone ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
        </div>
        <Link href="/dashboard/orders"><Button variant="outline">Back</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-3">Customer</h2>
            <div className="text-sm space-y-1">
              <p className="text-zinc-800 font-medium">{customerName}</p>
              <p className="text-zinc-500">{customerEmail}</p>
              {customerPhone && <p className="text-zinc-500">{customerPhone}</p>}
              {order.address && (
                <p className="text-zinc-500">
                  {order.address}, {order.city}, {order.country}
                </p>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-3">Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 text-xs text-zinc-500 font-medium">Product</th>
                  <th className="text-left py-2 text-xs text-zinc-500 font-medium">Color/Size</th>
                  <th className="text-right py-2 text-xs text-zinc-500 font-medium">Qty</th>
                  <th className="text-right py-2 text-xs text-zinc-500 font-medium">Price</th>
                  <th className="text-right py-2 text-xs text-zinc-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-50">
                    <td className="py-3 flex items-center gap-2">
                      <div className="relative h-9 w-9 rounded overflow-hidden shrink-0">
                        <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                      </div>
                      <span className="text-zinc-800">{item.productName}</span>
                    </td>
                    <td className="py-3 text-zinc-500">
                      {[item.color, item.size].filter(Boolean).join(" / ") || "N/A"}
                    </td>
                    <td className="py-3 text-right text-zinc-700">{item.quantity}</td>
                    <td className="py-3 text-right text-zinc-700">{formatCurrency(item.price, order.currency)}</td>
                    <td className="py-3 text-right font-medium text-zinc-900">
                      {formatCurrency(item.price * item.quantity, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-zinc-100 mt-3 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping, order.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-zinc-900 text-base">
                <span>Total</span>
                <span>{formatCurrency(order.total, order.currency)}</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-xs pt-1">
                <span>Payment: {order.paymentMethod?.toUpperCase() ?? "N/A"}</span>
                {order.paymentRef && <span>Ref: {order.paymentRef}</span>}
              </div>
            </div>
          </div>

          {/* Internal notes */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-3">Internal Notes</h2>
            <Textarea
              defaultValue={order.notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesSave}
              placeholder="Add notes visible only to the team..."
              rows={3}
            />
            {notesSaved && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Notes saved
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Status update */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5 space-y-3">
            <h2 className="font-semibold text-zinc-900">Update Status</h2>
            <Select value={newStatus || undefined} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
              <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={!newStatus || newStatus === order.status}
              onClick={() => setConfirmOpen(true)}
            >
              Update Status
            </Button>
          </div>

          {/* Status timeline */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Timeline</h2>
            <ol className="space-y-4">
              {order.statusHistory.map((entry, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-black mt-0.5" />
                    {i < order.statusHistory.length - 1 && (
                      <div className="w-px flex-1 bg-zinc-100 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <StatusBadge status={entry.status} />
                    <p className="text-xs text-zinc-400 mt-1">{formatDateTime(entry.at)}</p>
                    <p className="text-xs text-zinc-500">by {entry.by}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Update Order Status"
        description={`Change status to ${newStatus}?`}
        onConfirm={handleStatusUpdate}
        confirmLabel="Update"
        loading={updateStatus.isPending}
      />
    </div>
  );
}
