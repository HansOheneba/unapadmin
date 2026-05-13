import type { Order, OrderStatus, Paginated } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_ORDERS: Order[] = [
  {
    id: "order-1",
    orderNumber: "UNP-00001",
    customer: { id: "cust-1", name: "Kwame Mensah", email: "kwame@example.com" },
    guestName: null,
    guestEmail: null,
    guestPhone: null,
    address: "12 Oxford Street",
    city: "Accra",
    country: "Ghana",
    subtotal: 130,
    shipping: 10,
    total: 140,
    currency: "USD",
    paymentMethod: "card",
    paymentRef: "PAY-ABC123",
    status: "DELIVERED",
    notes: null,
    items: [
      {
        id: "item-1",
        productId: "boxers-white",
        productName: "Signature Boxer - White",
        productImage: "/collections/boxers/boxersWhite.jpeg",
        price: 45,
        quantity: 2,
        color: "White",
        size: "M",
      },
      {
        id: "item-2",
        productId: "hoodie-black",
        productName: "Classic Hoodie - Black",
        productImage: "/collections/hoodies/hoodieBlackMan.jpg",
        price: 85,
        quantity: 1,
        color: "Black",
        size: "L",
      },
    ],
    statusHistory: [
      { status: "PENDING", at: "2024-03-01T10:00:00Z", by: "system" },
      { status: "CONFIRMED", at: "2024-03-01T10:30:00Z", by: "admin" },
      { status: "PROCESSING", at: "2024-03-02T09:00:00Z", by: "admin" },
      { status: "SHIPPED", at: "2024-03-03T14:00:00Z", by: "admin" },
      { status: "DELIVERED", at: "2024-03-05T11:00:00Z", by: "system" },
    ],
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-05T11:00:00Z",
  },
  {
    id: "order-2",
    orderNumber: "UNP-00002",
    customer: { id: "cust-2", name: "Abena Asante", email: "abena@example.com" },
    guestName: null,
    guestEmail: null,
    guestPhone: null,
    address: "5 Liberation Road",
    city: "Accra",
    country: "Ghana",
    subtotal: 75,
    shipping: 10,
    total: 85,
    currency: "USD",
    paymentMethod: "momo",
    paymentRef: "MOMO-XYZ789",
    status: "PENDING",
    notes: null,
    items: [
      {
        id: "item-3",
        productId: "outlaw-glasses",
        productName: "Outlaw Shades",
        productImage: "/collections/glases/outlawGlasses1.jpg",
        price: 75,
        quantity: 1,
        color: null,
        size: null,
      },
    ],
    statusHistory: [{ status: "PENDING", at: "2024-03-10T08:00:00Z", by: "system" }],
    createdAt: "2024-03-10T08:00:00Z",
    updatedAt: "2024-03-10T08:00:00Z",
  },
  {
    id: "order-3",
    orderNumber: "UNP-00003",
    customer: null,
    guestName: "John Doe",
    guestEmail: "john@example.com",
    guestPhone: "+233501234567",
    address: "10 Cantonments Ave",
    city: "Accra",
    country: "Ghana",
    subtotal: 95,
    shipping: 15,
    total: 110,
    currency: "USD",
    paymentMethod: "card",
    paymentRef: "PAY-DEF456",
    status: "SHIPPED",
    notes: "Please handle with care",
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
    statusHistory: [
      { status: "PENDING", at: "2024-03-08T07:00:00Z", by: "system" },
      { status: "CONFIRMED", at: "2024-03-08T09:00:00Z", by: "admin" },
      { status: "SHIPPED", at: "2024-03-09T13:00:00Z", by: "admin" },
    ],
    createdAt: "2024-03-08T07:00:00Z",
    updatedAt: "2024-03-09T13:00:00Z",
  },
  {
    id: "order-4",
    orderNumber: "UNP-00004",
    customer: { id: "cust-3", name: "Kofi Boateng", email: "kofi@example.com" },
    guestName: null,
    guestEmail: null,
    guestPhone: null,
    address: "22 Osu High Street",
    city: "Accra",
    country: "Ghana",
    subtotal: 55,
    shipping: 10,
    total: 65,
    currency: "USD",
    paymentMethod: "cash",
    paymentRef: null,
    status: "CANCELLED",
    notes: "Customer requested cancellation",
    items: [
      {
        id: "item-5",
        productId: "bold-cap-black",
        productName: "Bold Society Cap - Black",
        productImage: "/collections/headwear/boldSocietyCapBlack.jpg",
        price: 55,
        quantity: 1,
        color: "Black",
        size: null,
      },
    ],
    statusHistory: [
      { status: "PENDING", at: "2024-03-06T12:00:00Z", by: "system" },
      { status: "CANCELLED", at: "2024-03-06T15:00:00Z", by: "admin" },
    ],
    createdAt: "2024-03-06T12:00:00Z",
    updatedAt: "2024-03-06T15:00:00Z",
  },
  {
    id: "order-5",
    orderNumber: "UNP-00005",
    customer: { id: "cust-4", name: "Ama Owusu", email: "ama@example.com" },
    guestName: null,
    guestEmail: null,
    guestPhone: null,
    address: "7 Independence Ave",
    city: "Kumasi",
    country: "Ghana",
    subtotal: 170,
    shipping: 10,
    total: 180,
    currency: "USD",
    paymentMethod: "card",
    paymentRef: "PAY-GHI012",
    status: "PROCESSING",
    notes: null,
    items: [
      {
        id: "item-6",
        productId: "boxers-white",
        productName: "Signature Boxer - White",
        productImage: "/collections/boxers/boxersWhite.jpeg",
        price: 45,
        quantity: 2,
        color: "Blue",
        size: "L",
      },
      {
        id: "item-7",
        productId: "hoodie-black",
        productName: "Classic Hoodie - Black",
        productImage: "/collections/hoodies/hoodieBlackMan.jpg",
        price: 85,
        quantity: 1,
        color: "Black",
        size: "XL",
      },
    ],
    statusHistory: [
      { status: "PENDING", at: "2024-03-11T10:00:00Z", by: "system" },
      { status: "CONFIRMED", at: "2024-03-11T11:00:00Z", by: "admin" },
      { status: "PROCESSING", at: "2024-03-12T09:00:00Z", by: "admin" },
    ],
    createdAt: "2024-03-11T10:00:00Z",
    updatedAt: "2024-03-12T09:00:00Z",
  },
];

export const getOrders = (params: {
  status?: OrderStatus;
  q?: string;
  page?: number;
}): Promise<Paginated<Order>> => {
  // TODO: remove mock
  let data = MOCK_ORDERS;
  if (params.status) data = data.filter((o) => o.status === params.status);
  if (params.q) {
    const q = params.q.toLowerCase();
    data = data.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        o.guestName?.toLowerCase().includes(q) ||
        o.guestEmail?.toLowerCase().includes(q),
    );
  }
  return Promise.resolve({ data, total: data.length, page: 1, totalPages: 1 });
  // return apiFetch<Paginated<Order>>(`/orders?${new URLSearchParams(params as Record<string, string>)}`);
};

export const getOrder = (id: string): Promise<Order> => {
  // TODO: remove mock
  const order = MOCK_ORDERS.find((o) => o.id === id);
  if (!order) return Promise.reject(new Error("Not found"));
  return Promise.resolve(order);
};

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  apiFetch<Order>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const updateOrderNotes = (id: string, notes: string) =>
  apiFetch<Order>(`/orders/${id}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) });
