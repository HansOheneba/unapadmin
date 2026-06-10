"use client";

import { Bike } from "lucide-react";
import { toast } from "sonner";
import { useRiders } from "@/lib/hooks/useRiders";
import {
  useDeliveryEvents,
  useOrderMutations,
} from "@/lib/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  canAssignRider,
  isAccraInhouse,
} from "@/lib/delivery";
import { fmtDateTime } from "@/lib/format";
import type { Order } from "@/types";

export function OrderDeliveryPanel({
  order,
  canEdit,
}: {
  order: Order;
  canEdit: boolean;
}) {
  const inhouse = isAccraInhouse(order);
  const { data: ridersPage } = useRiders({
    status: "active",
    page: 1,
    pageSize: 50,
  });
  const riders = ridersPage?.data ?? [];
  const { data: events = [] } = useDeliveryEvents(order.id);
  const { assign } = useOrderMutations();

  if (!inhouse) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Outside Accra
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          This order is outside Greater Accra. Extended delivery options are
          coming soon.
        </CardContent>
      </Card>
    );
  }

  const assignable = canAssignRider(order);
  const currentRider = order.riderId ?? "none";

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
      toast.error(
        e instanceof Error ? e.message : "Failed to assign rider.",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Bike className="h-4 w-4" />
          Rider
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-sm">
          <Label>Assign to rider</Label>
          <Select
            value={currentRider}
            disabled={!canEdit || !assignable || assign.isPending}
            onValueChange={handleAssign}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {riders.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.firstName} {r.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!assignable && order.status === "processing" && (
            <p className="text-xs text-zinc-500">
              Mark the order ready for pickup before assigning a rider.
            </p>
          )}
          {order.status === "returned" && assignable && (
            <p className="text-xs text-zinc-500">
              Select another rider to schedule a redelivery. The order moves back
              to ready for pickup.
            </p>
          )}
        </div>

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
                      <div className="text-xs text-zinc-500">{e.riderName}</div>
                    )}
                    {e.note && (
                      <div className="text-xs text-zinc-600 mt-0.5">{e.note}</div>
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
      </CardContent>
    </Card>
  );
}
