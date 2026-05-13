"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrders,
  getOrder,
  updateOrderStatus,
  updateOrderNotes,
} from "@/lib/api/orders";
import type { OrderStatus } from "@/types";

export const useOrders = (
  params: { status?: OrderStatus; q?: string; page?: number } = {},
) =>
  useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useUpdateOrderNotes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      updateOrderNotes(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};
