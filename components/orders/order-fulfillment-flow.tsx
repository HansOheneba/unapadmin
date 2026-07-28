"use client";

import * as React from "react";
import Link from "next/link";
import { Bike, Check, CircleDashed, Package, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRiders } from "@/lib/hooks/useRiders";
import { useDeliveryEvents, useOrderMutations } from "@/lib/hooks/useOrders";
import { isRiderAssignable } from "@/lib/api/riders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DELIVERY_EVENT_LABELS,
  adminFulfillmentActions,
  canAssignRider,
  fulfillmentStepIndex,
  isAccraInhouse,
} from "@/lib/delivery";
import { FULFILLMENT_STEPS, fmtDateTime, statusLabel } from "@/lib/format";
import type { Order, Rider } from "@/types";
import { Spinner } from "@/components/ui/spinner";

/**
 * Single source of truth for order fulfillment: progress, the next admin
 * action for the current status, and rider assignment all live in one flow
 * so the admin never has to jump between separate panels to move an order
 * forward.
 */
export function OrderFulfillmentFlow({
  order,
  canEdit,
}: {
  order: Order;
  canEdit: boolean;
}) {
  const isTerminal =
    order.status === "cancelled" || order.status === "refunded";
  const inhouse = isAccraInhouse(order);
  // Same list strategy as the Riders page: fetch the roster without a
  // server-side status filter (that filter has returned empty on live),
  // then keep active riders client-side. Always keep the currently
  // assigned rider even if they were marked inactive.
  const {
    data: ridersPage,
    isError: ridersError,
    isLoading: ridersLoading,
  } = useRiders({
    page: 1,
    pageSize: 100,
  });
  const riders = React.useMemo(() => {
    const all = ridersPage?.data ?? [];
    const assignable = all.filter(
      (r) => isRiderAssignable(r.status) || r.id === order.riderId,
    );
    return [...assignable].sort(
      (a, b) => a.activeDeliveries - b.activeDeliveries,
    );
  }, [ridersPage, order.riderId]);
  const { data: events = [] } = useDeliveryEvents(order.id);
  const { updateStatus, assign, verifyReturn } = useOrderMutations();

  const handleMarkReady = async () => {
    try {
      await updateStatus.mutateAsync({
        id: order.id,
        status: "ready_for_pickup",
        note: "Ready for rider pickup",
      });
      toast.success("Order marked ready for pickup.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update order.");
    }
  };

  const handleConfirmReturn = async () => {
    try {
      await verifyReturn.mutateAsync(order.id);
      toast.success("Return verified.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to verify return.",
      );
    }
  };

  const handleAssign = async (value: string) => {
    const riderId = value === "none" ? null : value;
    if (riderId === order.riderId) return;
    try {
      await assign.mutateAsync({ id: order.id, riderId });
      if (order.status === "returned" && riderId) {
        toast.success("Rider reassigned. Order is ready for pickup again.");
      } else {
        toast.success(riderId ? "Rider assigned." : "Rider unassigned.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign rider.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-zinc-900">
          Fulfillment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isTerminal ? (
          <TerminalState order={order} />
        ) : !inhouse ? (
          <p className="text-sm text-zinc-600">
            This order ships outside Greater Accra. Extended delivery
            workflows are coming soon.
          </p>
        ) : (
          <>
            {order.status === "returned" ? (
              <ReturnedBanner order={order} />
            ) : (
              <Stepper order={order} />
            )}

            <ContextualAction
              order={order}
              canEdit={canEdit}
              riders={riders}
              ridersLoading={ridersLoading}
              ridersError={ridersError}
              onMarkReady={handleMarkReady}
              markingReady={updateStatus.isPending}
              onConfirmReturn={handleConfirmReturn}
              confirmingReturn={verifyReturn.isPending}
              onAssign={handleAssign}
              assigning={assign.isPending}
            />

            {events.length > 0 && (
              <div>
                <Label className="mb-2 block text-zinc-500">Activity</Label>
                <ul className="border border-zinc-100 rounded-lg divide-y divide-zinc-100">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm"
                    >
                      <div>
                        <div className="font-medium text-zinc-900">
                          {DELIVERY_EVENT_LABELS[e.type]}
                        </div>
                        {e.riderName && (
                          <div className="text-xs text-zinc-500">
                            {e.riderName}
                          </div>
                        )}
                        {e.note && (
                          <div className="text-xs text-zinc-600 mt-0.5">
                            {e.note}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 shrink-0">
                        {fmtDateTime(e.at)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TerminalState({ order }: { order: Order }) {
  return (
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
  );
}

function ReturnedBanner({ order }: { order: Order }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-4">
        <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
        <div>
          <div className="text-sm font-medium text-zinc-900">
            Returned to warehouse
          </div>
          {order.failureReason && (
            <div className="text-xs text-zinc-600 mt-0.5">
              {order.failureReason.replace(/_/g, " ")}
            </div>
          )}
          {order.failedAt && (
            <div className="text-xs text-zinc-500 mt-1">
              {fmtDateTime(order.failedAt)}
            </div>
          )}
          {order.returnVerifiedAt ? (
            <div className="text-xs text-emerald-700 mt-1">
              Verified {fmtDateTime(order.returnVerifiedAt)}
            </div>
          ) : (
            <div className="text-xs text-amber-700 mt-1">
              Awaiting admin verification
            </div>
          )}
        </div>
      </div>
      {order.deliveryAttempts > 0 && (
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          {order.deliveryAttempts} delivery attempt
          {order.deliveryAttempts === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function Stepper({ order }: { order: Order }) {
  const isDelivered = order.status === "delivered";
  const currentIndex = fulfillmentStepIndex(order.status);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {FULFILLMENT_STEPS.map((step, i) => {
          const done = isDelivered ? true : i <= currentIndex;
          const current = !isDelivered && i === currentIndex;
          return (
            <div key={step} className="contents">
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
              {i < FULFILLMENT_STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 min-w-2 ${
                    i < currentIndex || isDelivered
                      ? "bg-zinc-900"
                      : "bg-zinc-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {order.deliveryAttempts > 1 && (
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          {order.deliveryAttempts} delivery attempts
        </p>
      )}
    </div>
  );
}

function assignHelperText(status: Order["status"]): string {
  if (status === "returned") {
    return "Select another rider to schedule a redelivery. The order moves back to ready for pickup.";
  }
  if (status === "picked_up" || status === "in_transit") {
    return "Pickup and transit updates come from the rider app. Reassign only if the rider needs to change.";
  }
  return "The rider will see this order in their queue once assigned.";
}

/** Compact load summary shown per rider so admins can spread orders out. */
function riderWorkloadLabel(r: Rider): string {
  const statusBit =
    r.status === "active"
      ? "on duty"
      : r.status === "on_delivery"
        ? "on delivery"
        : r.status === "off_duty"
          ? "off duty"
          : "inactive";
  const load =
    r.activeDeliveries > 0
      ? `${r.activeDeliveries} active`
      : "idle";
  return `${statusBit} · ${load} · ${r.totalDeliveries} delivered`;
}

function ContextualAction({
  order,
  canEdit,
  riders,
  ridersLoading,
  ridersError,
  onMarkReady,
  markingReady,
  onConfirmReturn,
  confirmingReturn,
  onAssign,
  assigning,
}: {
  order: Order;
  canEdit: boolean;
  riders: Rider[];
  ridersLoading: boolean;
  ridersError: boolean;
  onMarkReady: () => void;
  markingReady: boolean;
  onConfirmReturn: () => void;
  confirmingReturn: boolean;
  onAssign: (value: string) => void;
  assigning: boolean;
}) {
  if (order.status === "delivered") return null;

  const { canMarkReady, canConfirmReturn } = adminFulfillmentActions(order);
  const showMarkReady = canMarkReady && canEdit;
  const showConfirmReturn = canConfirmReturn && canEdit;
  const showAssign = canAssignRider(order);

  if (!showMarkReady && !showConfirmReturn && !showAssign) return null;

  const currentRider = order.riderId ?? "none";
  const selectedRider = riders.find((r) => r.id === order.riderId) ?? null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-4">
      {showMarkReady && (
        <ActionRow
          icon={<Package className="h-4 w-4" />}
          title="Ready to hand off?"
          description="Mark this order ready for pickup to add it to the rider queue."
        >
          <Button
            onClick={onMarkReady}
            loading={markingReady}
            className="shrink-0"
          >
            <Package className="h-4 w-4" />
            Mark ready for pickup
          </Button>
        </ActionRow>
      )}

      {showConfirmReturn && (
        <ActionRow
          divider={showMarkReady}
          icon={<RotateCcw className="h-4 w-4" />}
          title="Confirm the return"
          description="Verify the parcel is back at the warehouse before redelivery or refund."
        >
          <Button
            onClick={onConfirmReturn}
            loading={confirmingReturn}
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            Confirm return verified
          </Button>
        </ActionRow>
      )}

      {showAssign && (
        <div
          className={`space-y-2 max-w-sm ${
            showMarkReady || showConfirmReturn
              ? "pt-4 border-t border-zinc-200"
              : ""
          }`}
        >
          <Label className="flex items-center gap-1.5">
            <Bike className="h-3.5 w-3.5" />
            {order.status === "returned"
              ? "Reassign rider for redelivery"
              : "Assign to rider"}
          </Label>
          {ridersLoading ? (
            <div className="flex h-9 items-center">
              <Spinner className="h-4 w-4" />
            </div>
          ) : ridersError ? (
            <p className="text-xs text-rose-600">
              Could not load riders. Refresh the page or check{" "}
              <Link href="/admin/riders" className="underline">
                Riders
              </Link>
              .
            </p>
          ) : (
            <>
              <Select
                value={currentRider}
                disabled={!canEdit || assigning || riders.length === 0}
                onValueChange={onAssign}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {riders.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.firstName} {r.lastName} — {riderWorkloadLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {riders.length === 0 ? (
                <p className="text-xs text-amber-700">
                  No active riders yet.{" "}
                  <Link href="/admin/riders" className="underline">
                    Add a rider
                  </Link>{" "}
                  before assigning.
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  {assignHelperText(order.status)}
                </p>
              )}
              {selectedRider && (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Bike className="h-3 w-3" />
                  {selectedRider.firstName} has{" "}
                  {riderWorkloadLabel(selectedRider)}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionRow({
  icon,
  title,
  description,
  divider,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        divider ? "pt-4 border-t border-zinc-200" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-zinc-500 shrink-0">{icon}</span>
        <div>
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
