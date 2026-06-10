import type { Customer, Order, Paginated } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockGetCustomer,
  mockGetCustomerOrders,
  mockGetCustomers,
  mockUpdateCustomer,
} from "@/lib/mock/data-store";

export type CustomerListParams = {
  status?: string;
  country?: string;
  innerCircle?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getCustomers(
  params: CustomerListParams = {},
): Promise<Paginated<Customer>> {
  return apiFetchOrMock(
    `/customers${toQuery(params)}`,
    () => mockGetCustomers(params),
  );
}

export async function getCustomer(id: string): Promise<Customer> {
  return apiFetchOrMock(`/customers/${id}`, () => {
    const c = mockGetCustomer(id);
    if (!c) throw new Error("Customer not found");
    return c;
  });
}

export async function getCustomerOrders(id: string): Promise<Order[]> {
  return apiFetchOrMock(
    `/customers/${id}/orders`,
    () => mockGetCustomerOrders(id),
  );
}

export async function updateCustomer(
  id: string,
  patch: Partial<Customer>,
): Promise<Customer> {
  return apiFetchOrMock(
    `/customers/${id}`,
    () => {
      const c = mockUpdateCustomer(id, patch);
      if (!c) throw new Error("Customer not found");
      return c;
    },
    { method: "PATCH", body: JSON.stringify(patch) },
  );
}
