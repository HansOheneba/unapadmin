import type { Delivery, DeliveryStatus, Paginated } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "del-1",
    orderId: "order-3",
    orderNumber: "UNP-00003",
    customer: { id: "cust-2", name: "John Doe", email: "john@example.com" },
    carrier: "DHL",
    trackingNumber: "DHL123456789",
    trackingUrl: "https://track.dhl.com/DHL123456789",
    status: "IN_TRANSIT",
    estimatedDelivery: "2024-03-15T00:00:00Z",
    deliveredAt: null,
    address: "10 Cantonments Ave",
    city: "Accra",
    country: "Ghana",
    events: [
      {
        description: "Package picked up",
        location: "Accra Hub",
        at: "2024-03-09T14:00:00Z",
      },
      {
        description: "In transit to destination",
        location: "Tema Port",
        at: "2024-03-10T08:00:00Z",
      },
    ],
    createdAt: "2024-03-09T14:00:00Z",
    updatedAt: "2024-03-10T08:00:00Z",
  },
  {
    id: "del-2",
    orderId: "order-1",
    orderNumber: "UNP-00001",
    customer: {
      id: "cust-1",
      name: "Kwame Mensah",
      email: "kwame@example.com",
    },
    carrier: "GhanaPost",
    trackingNumber: "GP987654321",
    trackingUrl: null,
    status: "DELIVERED",
    estimatedDelivery: "2024-03-05T00:00:00Z",
    deliveredAt: "2024-03-05T11:00:00Z",
    address: "12 Oxford Street",
    city: "Accra",
    country: "Ghana",
    events: [
      {
        description: "Package picked up",
        location: "Accra Hub",
        at: "2024-03-03T14:00:00Z",
      },
      {
        description: "Out for delivery",
        location: "Accra",
        at: "2024-03-05T09:00:00Z",
      },
      {
        description: "Package delivered",
        location: "12 Oxford Street, Accra",
        at: "2024-03-05T11:00:00Z",
      },
    ],
    createdAt: "2024-03-03T14:00:00Z",
    updatedAt: "2024-03-05T11:00:00Z",
  },
];

export const getDeliveries = (params: {
  status?: DeliveryStatus;
  q?: string;
  page?: number;
}): Promise<Paginated<Delivery>> => {
  // TODO: remove mock
  let data = MOCK_DELIVERIES;
  if (params.status) data = data.filter((d) => d.status === params.status);
  if (params.q) {
    const q = params.q.toLowerCase();
    data = data.filter(
      (d) =>
        d.orderNumber.toLowerCase().includes(q) ||
        d.customer.name?.toLowerCase().includes(q) ||
        d.trackingNumber?.toLowerCase().includes(q),
    );
  }
  return Promise.resolve({ data, total: data.length, page: 1, totalPages: 1 });
};

export const getDelivery = (id: string): Promise<Delivery> => {
  // TODO: remove mock
  const delivery = MOCK_DELIVERIES.find((d) => d.id === id);
  if (!delivery) return Promise.reject(new Error("Not found"));
  return Promise.resolve(delivery);
};

export const updateDelivery = (
  id: string,
  body: Partial<
    Pick<
      Delivery,
      | "carrier"
      | "trackingNumber"
      | "trackingUrl"
      | "status"
      | "estimatedDelivery"
    >
  >,
) =>
  apiFetch<Delivery>(`/deliveries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
