// types/index.ts

export type AdminRole = "SUPER_ADMIN" | "MANAGER" | "EDITOR" | "VIEWER";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
};

export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  image: string | null;
};

export type ProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNum: number;
  tag: string;
  collectionId: string;
  stock: number;
  lowStockThreshold: number;
  images: ProductImage[];
  colors: ProductColor[];
  createdAt: string;
  updatedAt: string;
};

export type Collection = {
  id: string;
  subtitle: string;
  title: string;
  tagline: string;
  featured: string;
  href: string;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  customer: Pick<Customer, "id" | "name" | "email"> | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: "momo" | "card" | "cash" | null;
  paymentRef: string | null;
  status: OrderStatus;
  notes: string | null;
  items: OrderItem[];
  statusHistory: { status: OrderStatus; at: string; by: string }[];
  createdAt: string;
  updatedAt: string;
};

export type DiscountType = "PERCENTAGE" | "FIXED";

export type Discount = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type BannerPosition =
  | "HOME_HERO"
  | "COLLECTIONS_TOP"
  | "PRODUCT_SIDEBAR"
  | "ANNOUNCEMENT_BAR";

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  imageUrl: string;
  position: BannerPosition;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
};

export type Affiliate = {
  id: string;
  name: string;
  email: string;
  code: string;
  commissionRate: number;
  totalReferrals: number;
  totalRevenue: number;
  totalOwed: number;
  totalPaid: number;
  active: boolean;
  createdAt: string;
};

export type AffiliatePayout = {
  id: string;
  affiliateId: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
};

export type ReturnReason =
  | "WRONG_SIZE"
  | "WRONG_ITEM"
  | "DAMAGED"
  | "NOT_AS_DESCRIBED"
  | "CHANGED_MIND"
  | "OTHER";

export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";

export type Return = {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: Pick<Customer, "id" | "name" | "email">;
  items: OrderItem[];
  reason: ReturnReason;
  notes: string | null;
  status: ReturnStatus;
  refundAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryStatus =
  | "AWAITING_PICKUP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED_TO_SENDER";

export type Delivery = {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: Pick<Customer, "id" | "name" | "email">;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: DeliveryStatus;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  address: string;
  city: string;
  country: string;
  events: { description: string; location: string | null; at: string }[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockCount: number;
  openReturns: number;
  revenueChart: { date: string; revenue: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  topProducts: {
    productId: string;
    name: string;
    image: string;
    unitsSold: number;
    revenue: number;
  }[];
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};
