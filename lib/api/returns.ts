import type { Return, ReturnStatus, Paginated } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_RETURNS: Return[] = [
  {
    id: "ret-1",
    orderId: "order-1",
    orderNumber: "UNP-00001",
    customer: { id: "cust-1", name: "Kwame Mensah", email: "kwame@example.com" },
    items: [
      {
        id: "item-1",
        productId: "boxers-white",
        productName: "Signature Boxer - White",
        productImage: "/collections/boxers/boxersWhite.jpeg",
        price: 45,
        quantity: 1,
        color: "White",
        size: "M",
      },
    ],
    reason: "WRONG_SIZE",
    notes: "Ordered M but need L",
    status: "REQUESTED",
    refundAmount: null,
    createdAt: "2024-03-06T10:00:00Z",
    updatedAt: "2024-03-06T10:00:00Z",
  },
  {
    id: "ret-2",
    orderId: "order-3",
    orderNumber: "UNP-00003",
    customer: { id: "cust-2", name: "John Doe", email: "john@example.com" },
    items: [
      {
        id: "item-4",
        productId: "track-set",
        productName: "Movement Track Set",
        productImage: "/collections/tracks/track.jpg",
        price: 95,
        quantity: 1,
        color: null,
        size: "M",
      },
    ],
    reason: "DAMAGED",
    notes: "Item arrived with a tear in the fabric",
    status: "APPROVED",
    refundAmount: 95,
    createdAt: "2024-03-10T14:00:00Z",
    updatedAt: "2024-03-11T09:00:00Z",
  },
];

export const getReturns = (params: {
  status?: ReturnStatus;
  page?: number;
}): Promise<Paginated<Return>> => {
  // TODO: remove mock
  let data = MOCK_RETURNS;
  if (params.status) data = data.filter((r) => r.status === params.status);
  return Promise.resolve({ data, total: data.length, page: 1, totalPages: 1 });
};

export const getReturn = (id: string): Promise<Return> => {
  // TODO: remove mock
  const ret = MOCK_RETURNS.find((r) => r.id === id);
  if (!ret) return Promise.reject(new Error("Not found"));
  return Promise.resolve(ret);
};

export const updateReturnStatus = (
  id: string,
  status: ReturnStatus,
  refundAmount?: number,
) =>
  apiFetch<Return>(`/returns/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, refundAmount }),
  });
