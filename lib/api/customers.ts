import type { Customer, Order, Paginated } from "@/types";
import { executeOrMock, executePaginatedOrMock } from "./client";
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

export async function getCustomers(
  params: CustomerListParams = {},
): Promise<Paginated<Customer>> {
  return executePaginatedOrMock(
    "customer.list",
    () => mockGetCustomers(params),
    { method: "GET", query: params },
  );
}

export async function getCustomer(id: string): Promise<Customer> {
  return executeOrMock(
    "customer.get",
    () => {
      const c = mockGetCustomer(id);
      if (!c) throw new Error("Customer not found");
      return c;
    },
    { method: "GET", query: { id } },
  );
}

export async function getCustomerOrders(id: string): Promise<Order[]> {
  return executeOrMock(
    "customer.orders",
    () => mockGetCustomerOrders(id),
    { method: "GET", query: { id } },
  );
}

export async function updateCustomer(
  id: string,
  patch: Partial<Customer>,
): Promise<Customer> {
  return executeOrMock(
    "customer.update",
    () => {
      const c = mockUpdateCustomer(id, patch);
      if (!c) throw new Error("Customer not found");
      return c;
    },
    { method: "PATCH", body: { id, ...patch } },
  );
}
