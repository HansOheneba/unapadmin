"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignRider,
  getDeliveryEvents,
  getOrder,
  getOrders,
  refundOrder,
  updateOrderNotes,
  updateOrderStatus,
  updateRiderNote,
  confirmReturnVerified,
  type OrderListParams,
} from "@/lib/api/orders";
import type { OrderStatus } from "@/types";
import { queryKeys } from "./query-keys";

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => getOrders(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useDeliveryEvents(orderId: string) {
  return useQuery({
    queryKey: queryKeys.deliveryEvents(orderId),
    queryFn: () => getDeliveryEvents(orderId),
    enabled: !!orderId,
  });
}

export function useOrderMutations() {
  const qc = useQueryClient();
  const invalidate = (orderId?: string) => {
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    qc.invalidateQueries({ queryKey: ["riders"] });
    if (orderId) {
      qc.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      qc.invalidateQueries({ queryKey: queryKeys.deliveryEvents(orderId) });
    }
  };

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
      note,
      carrier,
      trackingNumber,
    }: {
      id: string;
      status: OrderStatus;
      note?: string;
      carrier?: string;
      trackingNumber?: string;
    }) => updateOrderStatus(id, { status, note, carrier, trackingNumber }),
    onSuccess: (order, vars) => {
      qc.setQueryData(queryKeys.order(vars.id), order);
      if (order.id !== vars.id) {
        qc.setQueryData(queryKeys.order(order.id), order);
      }
      invalidate(vars.id);
    },
  });

  const updateNotes = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      updateOrderNotes(id, notes),
    onSuccess: (_, vars) => invalidate(vars.id),
  });

  const assign = useMutation({
    mutationFn: ({
      id,
      riderId,
      riderNote,
    }: {
      id: string;
      riderId: string | null;
      riderNote?: string;
    }) => assignRider(id, { riderId, riderNote }),
    onSuccess: (_, vars) => invalidate(vars.id),
  });

  const saveRiderNote = useMutation({
    mutationFn: ({ id, riderNote }: { id: string; riderNote: string }) =>
      updateRiderNote(id, riderNote),
    onSuccess: (_, vars) => invalidate(vars.id),
  });

  const refund = useMutation({
    mutationFn: ({
      id,
      amount,
      reason,
    }: {
      id: string;
      amount: number;
      reason: string;
    }) => refundOrder(id, amount, reason),
    onSuccess: (_, vars) => invalidate(vars.id),
  });

  const verifyReturn = useMutation({
    mutationFn: (id: string) => confirmReturnVerified(id),
    onSuccess: (_, id) => invalidate(id),
  });

  return { updateStatus, updateNotes, assign, saveRiderNote, refund, verifyReturn };
}
