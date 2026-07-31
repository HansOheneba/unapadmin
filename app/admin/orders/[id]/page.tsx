"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Printer } from "lucide-react";
import { toast } from "sonner";
import { useOrder, useOrderMutations } from "@/lib/hooks/useOrders";
import { useAuth } from "@/lib/hooks/useAuth";
import { needsPaymentCollection } from "@/lib/api/orders";
import { fmtDateTime, formatMoney, paymentMethodLabel } from "@/lib/format";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { OrderFulfillmentFlow } from "@/components/orders/order-fulfillment-flow";
import {
  OrderPrintSheet,
  printOrderDocument,
} from "@/components/orders/order-print-sheet";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = decodeURIComponent(params.id ?? "");
  const router = useRouter();
  const { can } = useAuth();
  const { data: order, isLoading, isError, error } = useOrder(orderId);
  const { updateStatus, updatePayment, updateNotes, refund } =
    useOrderMutations();

  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [refundAmount, setRefundAmount] = React.useState("");
  const [refundReason, setRefundReason] = React.useState("");
  const [notesDraft, setNotesDraft] = React.useState(order?.notes || "");

  const [prevOrderId, setPrevOrderId] = React.useState(order?.id);
  if (order && prevOrderId !== order.id) {
    setPrevOrderId(order.id);
    setNotesDraft(order.notes ?? "");
  }

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-zinc-500">
            {error instanceof Error ? error.message : "Order not found."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTerminal =
    order.status === "cancelled" || order.status === "refunded";

  const handleCancel = async () => {
    try {
      await updateStatus.mutateAsync({
        id: order.id,
        status: "cancelled",
        note: "Cancelled by admin",
      });
      toast.success("Order cancelled.");
      setCancelOpen(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to cancel order.",
      );
    }
  };

  const handleRefund = async () => {
    const amt = Number(refundAmount);
    if (!amt || amt <= 0) {
      toast.error("Refund amount must be greater than 0.");
      return;
    }
    try {
      await refund.mutateAsync({
        id: order.id,
        amount: amt,
        reason: refundReason || "No reason provided",
      });
      toast.success("Refund recorded.");
      setRefundOpen(false);
      setRefundAmount("");
      setRefundReason("");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to record refund.",
      );
    }
  };

  return (
    <>
      <OrderPrintSheet order={order} />

      <div className="space-y-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/orders")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-zinc-900">
                  {order.orderNumber ?? order.id}
                </h1>
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Placed {fmtDateTime(order.createdAt)} · Tracking{" "}
                {order.trackingNumber}
                {order.deliveryAttempts > 0 && (
                  <> · {order.deliveryAttempts} attempt{order.deliveryAttempts === 1 ? "" : "s"}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={printOrderDocument}>
              <Printer className="h-4 w-4" />
              Print invoice
            </Button>
            {!isTerminal && can("edit") && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setRefundOpen(true)}>
                    Issue refund
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    destructive
                    onSelect={() => setCancelOpen(true)}
                  >
                    Cancel order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <OrderFulfillmentFlow order={order} canEdit={can("edit")} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-zinc-900">
                Items ({(order.items ?? []).length})
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
                  {(order.items ?? []).map((it, i) => (
                    <TableRow key={`${it.productId}-${it.variantId}-${i}`}>
                      <TableCell>
                        <Link
                          href={`/admin/products/${it.productId}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <div className="relative h-12 w-12 rounded overflow-hidden bg-zinc-100">
                            {it.imageUrl ? (
                              <Image
                                src={it.imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : null}
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
                        {formatMoney(it.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatMoney(it.totalPrice)}
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
              <Row label="Subtotal" value={formatMoney(order.subtotal)} />
              <Row label="Shipping" value={formatMoney(order.shippingFee)} />
              {order.discount > 0 && (
                <Row
                  label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`}
                  value={`- ${formatMoney(order.discount)}`}
                />
              )}
              <div className="h-px bg-zinc-200 my-2" />
              <Row label="Total" value={formatMoney(order.total)} bold />
              <div className="h-px bg-zinc-200 my-2" />
              <Row
                label="Payment method"
                value={paymentMethodLabel(order.paymentMethod)}
              />
              <Row
                label="Payment status"
                value={<PaymentStatusBadge status={order.paymentStatus} />}
              />
              {order.paymentReference && (
                <Row label="Reference" value={order.paymentReference} mono />
              )}
              {can("edit") && needsPaymentCollection(order) && (
                <div className="pt-3">
                  <Button
                    className="w-full"
                    loading={updatePayment.isPending}
                    onClick={async () => {
                      try {
                        await updatePayment.mutateAsync({
                          id: order.id,
                          paymentStatus: "paid",
                          note: "Payment collected on delivery",
                        });
                        toast.success(
                          "Payment recorded. Customer totals updated.",
                        );
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Failed to record payment.",
                        );
                      }
                    }}
                  >
                    Mark payment collected
                  </Button>
                </div>
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
                {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
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
                readOnly={!can("edit")}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={async () => {
                  if (!can("edit")) return;
                  if (notesDraft !== order.notes) {
                    try {
                      await updateNotes.mutateAsync({
                        id: order.id,
                        notes: notesDraft,
                      });
                      toast.success("Notes saved.");
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Failed to save notes.",
                      );
                    }
                  }
                }}
                placeholder={
                  can("edit") ? "Add internal notes (saved on blur)" : "No notes"
                }
              />
            </CardContent>
          </Card>
        </div>

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
                <Label>Refund amount (cedis)</Label>
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
    </>
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
