"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCustomer,
  getCustomerOrders,
  getCustomers,
  updateCustomer,
  type CustomerListParams,
} from "@/lib/api/customers";
import type { Customer } from "@/types";
import { queryKeys } from "./query-keys";

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: queryKeys.customers(params),
    queryFn: () => getCustomers(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

export function useCustomerOrders(id: string) {
  return useQuery({
    queryKey: queryKeys.customerOrders(id),
    queryFn: () => getCustomerOrders(id),
    enabled: !!id,
  });
}

export function useCustomerMutations() {
  const qc = useQueryClient();
  const invalidate = (id?: string) => {
    qc.invalidateQueries({ queryKey: ["customers"] });
    if (id) qc.invalidateQueries({ queryKey: queryKeys.customer(id) });
  };

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Customer> }) =>
      updateCustomer(id, patch),
    onSuccess: (_, { id }) => invalidate(id),
  });

  return { update };
}
