import type { Customer, Paginated, Order } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Kwame Mensah",
    email: "kwame@example.com",
    phone: "+233241234567",
    country: "Ghana",
    totalOrders: 3,
    totalSpent: 380,
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "cust-2",
    name: "Abena Asante",
    email: "abena@example.com",
    phone: "+233201234567",
    country: "Ghana",
    totalOrders: 1,
    totalSpent: 85,
    createdAt: "2024-02-10T00:00:00Z",
  },
  {
    id: "cust-3",
    name: "Kofi Boateng",
    email: "kofi@example.com",
    phone: "+233551234567",
    country: "Ghana",
    totalOrders: 2,
    totalSpent: 140,
    createdAt: "2024-02-20T00:00:00Z",
  },
  {
    id: "cust-4",
    name: "Ama Owusu",
    email: "ama@example.com",
    phone: "+233261234567",
    country: "Ghana",
    totalOrders: 4,
    totalSpent: 560,
    createdAt: "2024-01-05T00:00:00Z",
  },
];

export const getCustomers = (params: {
  q?: string;
  page?: number;
}): Promise<Paginated<Customer>> => {
  // TODO: remove mock
  let data = MOCK_CUSTOMERS;
  if (params.q) {
    const q = params.q.toLowerCase();
    data = data.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }
  return Promise.resolve({ data, total: data.length, page: 1, totalPages: 1 });
};

export const getCustomer = (
  id: string,
): Promise<Customer & { orders: Order[] }> => {
  // TODO: remove mock
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id);
  if (!customer) return Promise.reject(new Error("Not found"));
  return Promise.resolve({ ...customer, orders: [] });
};

export const updateCustomer = (id: string, body: Partial<Customer>) =>
  apiFetch<Customer>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
