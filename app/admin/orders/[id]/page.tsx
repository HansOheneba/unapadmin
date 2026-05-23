"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleDashed,
  Package,
  Printer,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/store";
import {
  ORDER_LIFECYCLE,
  ORDER_STATUSES,
  fmtDate,
  fmtDateTime,
  formatMoney,
  statusLabel,
} from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { OrderStatus } from "@/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const order = useAdminStore((s) =>
    s.orders.find((o) => o.id === params.id),
  );
  const updateStatus = useAdminStore((s) => s.updateOrderStatus);
  const updateNotes = useAdminStore((s) => s.updateOrderNotes);
  const refund = useAdminStore((s) => s.refundOrder);

  const [statusOpen, setStatusOpen] = React.useState(false);
  const [nextStatus, setNextStatus] = React.useState<OrderStatus>("processing");
  const [carrier, setCarrier] = React.useState("");
  const [tracking, setTracking] = React.useState("");
  const [statusNote, setStatusNote] = React.useState("");
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [refundAmount, setRefundAmount] = React.useState("");
  const [refundReason, setRefundReason] = React.useState("");
  const [notesDraft, setNotesDraft] = React.useState(order?.notes ?? "");

  // Re-hydrate local form state when navigating to a different order.
  const [prevOrderId, setPrevOrderId] = React.useState(order?.id);
  if (order && prevOrderId !== order.id) {
    setPrevOrderId(order.id);
    setNotesDraft(order.notes);
    setCarrier(order.carrier ?? "");
    setTracking(order.trackingNumber);
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-zinc-500">
            Order not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusUpdate = () => {
    if (nextStatus === "shipped" && (!carrier || !tracking)) {
      toast.error("Carrier and tracking number are required when marking shipped.");
      return;
    }
    updateStatus(order.id, nextStatus, {
      carrier: carrier || undefined,
      trackingNumber: tracking || undefined,
      note: statusNote || undefined,
    });
    toast.success(`Order marked as ${statusLabel(nextStatus)}`);
    setStatusOpen(false);
    setStatusNote("");
  };

  const handleCancel = () => {
    updateStatus(order.id, "cancelled", { note: "Cancelled by admin" });
    toast.success("Order cancelled.");
    setCancelOpen(false);
  };

  const handleRefund = () => {
    const amt = Number(refundAmount);
    if (!amt || amt <= 0) {
      toast.error("Refund amount must be greater than 0.");
      return;
    }
    refund(order.id, amt, refundReason || "No reason provided");
    toast.success("Refund recorded.");
    setRefundOpen(false);
    setRefundAmount("");
    setRefundReason("");
  };

  // Build a simple lifecycle stepper. Cancelled/refunded show inline as terminal.
  const isTerminal =
    order.status === "cancelled" || order.status === "refunded";
  const currentIndex = ORDER_LIFECYCLE.indexOf(order.status as OrderStatus);
  const lifecycle = ORDER_LIFECYCLE;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/orders")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-900">
                {order.id}
              </h1>
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Placed {fmtDateTime(order.createdAt)} · Tracking{" "}
              {order.trackingNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print invoice
          </Button>
          {!isTerminal && (
            <>
              <Button
                variant="outline"
                onClick={() => setCancelOpen(true)}
                className="text-rose-600 hover:text-rose-700"
              >
                Cancel order
              </Button>
              <Button variant="outline" onClick={() => setRefundOpen(true)}>
                Refund
              </Button>
              <Button onClick={() => setStatusOpen(true)}>
                Update status
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900">
            Status timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTerminal ? (
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <XCircle className="h-5 w-5 text-rose-500" />
              <div>
                <div className="text-sm font-medium text-zinc-900">
                  Order {statusLabel(order.status)}
                </div>
                <div className="text-xs text-zinc-500">
                  Last updated {fmtDateTime(order.updatedAt)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              {lifecycle.map((step, i) => {
                const done = i <= currentIndex;
                const current = i === currentIndex;
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                          done
                            ? "bg-zinc-900 border-zinc-900 text-white"
                            : "bg-white border-zinc-300 text-zinc-400"
                        } ${current ? "ring-4 ring-zinc-200" : ""}`}
                      >
                        {done ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <CircleDashed className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`mt-2 text-[11px] font-medium text-center ${
                          done ? "text-zinc-900" : "text-zinc-400"
                        }`}
                      >
                        {statusLabel(step)}
                      </div>
                    </div>
                    {i < lifecycle.length - 1 && (
                      <div
                        className={`h-px flex-1 ${
                          i < currentIndex ? "bg-zinc-900" : "bg-zinc-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Items ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it, i) => (
                  <TableRow key={`${it.productId}-${it.variantId}-${i}`}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${it.productId}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <div className="relative h-12 w-12 rounded overflow-hidden bg-zinc-100">
                          <Image
                            src={it.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <span className="text-sm font-medium text-zinc-900">
                          {it.productName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-zinc-200"
                          style={{ background: it.colorHex }}
                        />
                        {it.colorName} · {it.size}
                      </div>
                    </TableCell>
                    <TableCell>{it.quantity}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatMoney(it.unitPrice, order.currency)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatMoney(it.totalPrice, order.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Order summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
            <Row label="Shipping" value={formatMoney(order.shippingFee, order.currency)} />
            {order.discount > 0 && (
              <Row
                label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`}
                value={`- ${formatMoney(order.discount, order.currency)}`}
              />
            )}
            <div className="h-px bg-zinc-200 my-2" />
            <Row
              label="Total"
              value={formatMoney(order.total, order.currency)}
              bold
            />
            <div className="h-px bg-zinc-200 my-2" />
            <Row label="Payment method" value={order.paymentMethod.toUpperCase()} />
            {order.paymentReference && (
              <Row label="Reference" value={order.paymentReference} mono />
            )}
            {order.carrier && <Row label="Carrier" value={order.carrier} />}
            {order.estimatedDelivery && (
              <Row label="ETA" value={fmtDate(order.estimatedDelivery)} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <Link
              href={`/admin/customers/${order.customerId}`}
              className="font-medium text-zinc-900 hover:underline"
            >
              {order.customerName}
            </Link>
            <div className="text-zinc-600">{order.customerEmail}</div>
            <div className="text-zinc-600">{order.customerPhone}</div>
            {order.customerNote && (
              <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900">
                <strong>Customer note:</strong> {order.customerNote}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Shipping address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-0.5 text-zinc-700">
            <div className="font-medium text-zinc-900">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </div>
            <div>{order.shippingAddress.address}</div>
            {order.shippingAddress.address2 && (
              <div>{order.shippingAddress.address2}</div>
            )}
            <div>
              {order.shippingAddress.city}, {order.shippingAddress.region}
            </div>
            <div>{order.shippingAddress.country}</div>
            <div className="pt-2 text-xs text-zinc-500">
              {order.shippingAddress.phone}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Internal notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={6}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                if (notesDraft !== order.notes) {
                  updateNotes(order.id, notesDraft);
                  toast.success("Notes saved.");
                }
              }}
              placeholder="Add internal notes (saved on blur)"
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update order status</DialogTitle>
            <DialogDescription>
              Move {order.id} to a new state in its lifecycle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>New status</Label>
              <Select
                value={nextStatus}
                onValueChange={(v) => setNextStatus(v as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(nextStatus === "shipped" || nextStatus === "in_transit") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Carrier *</Label>
                  <Input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="DHL, GIG Logistics..."
                  />
                </div>
                <div>
                  <Label>Tracking number *</Label>
                  <Input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="TRK..."
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Appended to internal notes timeline"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this order?"
        description="The order will be marked as cancelled and removed from active workflows."
        confirmText="Yes, cancel order"
        destructive
        onConfirm={handleCancel}
      />

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue refund</DialogTitle>
            <DialogDescription>
              Record a refund against this order. Full refunds also mark the
              order as refunded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Refund amount ({order.currency})</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={`Up to ${order.total}`}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefund}>Record refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span
        className={`${bold ? "font-semibold text-zinc-900" : "text-zinc-900"} ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
