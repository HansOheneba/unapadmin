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
import type { Order, OrderStatus } from "@/types";
import { queryKeys } from "./query-keys";

const ORDER_QUERY_OPTS = {
  staleTime: 60_000,
  retry: false as const,
  retryOnMount: false as const,
};

function mergeOrderCache(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patch: Order,
) {
  qc.setQueryData<Order>(queryKeys.order(id), (prev) =>
    prev ? { ...prev, ...patch, id: patch.id || prev.id } : patch,
  );
  if (patch.id && patch.id !== id) {
    qc.setQueryData<Order>(queryKeys.order(patch.id), (prev) =>
      prev ? { ...prev, ...patch } : patch,
    );
  }
}

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => getOrders(params),
    ...ORDER_QUERY_OPTS,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => getOrder(id),
    enabled: !!id,
    ...ORDER_QUERY_OPTS,
  });
}

export function useDeliveryEvents(orderId: string) {
  return useQuery({
    queryKey: queryKeys.deliveryEvents(orderId),
    queryFn: () => getDeliveryEvents(orderId),
    enabled: !!orderId,
    ...ORDER_QUERY_OPTS,
  });
}

export function useOrderMutations() {
  const qc = useQueryClient();
  const invalidateLists = () => {
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
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
      mergeOrderCache(qc, vars.id, order);
      // Refresh list/dashboard only — do not invalidate the detail query we
      // just wrote (avoids an immediate order.get after a mutation).
      invalidateLists();
      qc.invalidateQueries({ queryKey: queryKeys.deliveryEvents(vars.id) });
    },
  });

  const updateNotes = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      updateOrderNotes(id, notes),
    onSuccess: (order, vars) => {
      if (order) mergeOrderCache(qc, vars.id, order);
      invalidateLists();
    },
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
    onSuccess: (order, vars) => {
      if (order) mergeOrderCache(qc, vars.id, order);
      invalidateLists();
      qc.invalidateQueries({ queryKey: queryKeys.deliveryEvents(vars.id) });
    },
  });

  const saveRiderNote = useMutation({
    mutationFn: ({ id, riderNote }: { id: string; riderNote: string }) =>
      updateRiderNote(id, riderNote),
    onSuccess: (order, vars) => {
      if (order) mergeOrderCache(qc, vars.id, order);
    },
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
    onSuccess: (order, vars) => {
      if (order) mergeOrderCache(qc, vars.id, order);
      invalidateLists();
    },
  });

  const verifyReturn = useMutation({
    mutationFn: (id: string) => confirmReturnVerified(id),
    onSuccess: (order, id) => {
      if (order) mergeOrderCache(qc, id, order);
      invalidateLists();
      qc.invalidateQueries({ queryKey: queryKeys.deliveryEvents(id) });
    },
  });

  return { updateStatus, updateNotes, assign, saveRiderNote, refund, verifyReturn };
}
