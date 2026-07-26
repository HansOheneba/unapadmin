// Catalog types align with storefront lib/data/types.ts + lib/products.ts.
// See docs/storefront-catalog-types.ts and docs/catalog-field-mapping.md.

export type Country = "Ghana" | "Nigeria";
export type Currency = "GHS" | "NGN";

export type CustomerAddress = {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  email: string;
  country: Country;
  region: string;
  city: string;
  district: string;
  address: string;
  address2: string;
  phone: string;
  postcode: string;
  whatsapp: string;
  isDefault: boolean;
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: Country;
  region: string;
  city: string;
  address: string;
  landmark: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  topSize: string;
  bottomSize: string;
  addresses: CustomerAddress[];
  status: "active" | "suspended" | "unverified";
  tags: string[];
  notes: string;
  joinedDate: string;
  lastOrderDate: string | null;
  totalOrders: number;
  totalSpend: number;
  currency: Currency;
  innerCircle: boolean;
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | "processing"
  | "ready_for_pickup"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "returned"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed";

export type OrderItem = {
  productId: string;
  productName: string;
  productSlug: string;
  collectionId: string;
  variantId: string;
  colorName: string;
  colorHex: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
};

export type DeliveryType = "accra_inhouse" | "outside_accra";

export type DeliveryEventType =
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed";

export type DeliveryEvent = {
  id: string;
  orderId: string;
  riderId: string | null;
  riderName: string | null;
  type: DeliveryEventType;
  note: string | null;
  at: string;
};

/** Rider-app assignment status (maps to order fields + events). */
export type AssignmentStatus =
  | "unassigned"
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed";

export type Order = {
  /** Backend primary key (UUID). Use this for all write APIs. */
  id: string;
  /** Human-readable code (e.g. ORD-2026-0001). Display only. */
  orderNumber?: string;
  trackingNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: CustomerAddress;
  billingAddress: CustomerAddress | null;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "momo" | "card" | "cash" | "paystack";
  paymentReference: string | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  discountCode: string | null;
  total: number;
  currency: Currency;
  notes: string;
  customerNote: string;
  deliveryType: DeliveryType;
  riderId: string | null;
  riderNote: string;
  carrier: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  pickedUpAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  deliveryAttempts: number;
  returnVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Gender = "male" | "female";

export type SizeStock = {
  size: string;
  stock: number;
};

export type ColorVariant = {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  sizes: SizeStock[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** GHS storefront price (integer cedis). */
  price: number;
  /** NGN storefront price for Nigeria. Null when unset. */
  priceNgn: number | null;
  gender: Gender;
  collectionId: string;
  variants: ColorVariant[];
  details: string[];
  careInstructions: string[];
  isActive: boolean;
  totalStock: number;
  totalSold: number;
  averageRating: number;
  reviewCount: number;
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
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BannerMessage = {
  id: string;
  text: string;
  href: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BannerConfig = {
  isEnabled: boolean;
  rotationIntervalMs: number;
  backgroundColor: string;
  textColor: string;
};

export type Review = {
  id: string;
  productId: string;
  productName: string;
  customerId: string | null;
  author: string;
  email: string | null;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  createdAt: string;
  updatedAt: string;
};

export type InnerCircleMember = {
  id: string;
  customerId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "rejected" | "waitlisted";
  appliedAt: string;
  approvedAt: string | null;
  notes: string;
};

export type AdminRole = "super_admin" | "admin" | "viewer";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

export type RiderStatus = "active" | "inactive";

export type VehicleType = "motorcycle" | "bicycle" | "car" | "van";

export type Rider = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  country: Country;
  city: string;
  zone: string;
  status: RiderStatus;
  vehicleType: VehicleType;
  plateNumber: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  licenseNumber: string | null;
  notes: string;
  activeDeliveries: number;
  totalDeliveries: number;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  adminEmailForOrders: string;
  adminEmailForLowStock: string;
  lowStockThreshold: number;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CollectionWithCount = Collection & { productCount: number };

export type DashboardStats = {
  revenueThisMonthGhs: number;
  revenueThisMonthNgn: number;
  revenuePrevMonthGhs: number;
  revenuePrevMonthNgn: number;
  ordersToday: number;
  activeCustomers: number;
  pendingAndProcessingOrders: number;
  lowStockCount: number;
  aovThisMonthGhs: number;
  revenueChart: { date: string; ghs: number; ngn: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  topProducts: {
    productId: string;
    name: string;
    image: string;
    units: number;
    revenue: number;
  }[];
  recentOrders: Order[];
  salesByCountry: { country: string; revenue: number; orders: number }[];
};

export type AnalyticsReport = {
  dailyRevenue: { date: string; ghs: number; ngn: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  topProducts: {
    productId: string;
    name: string;
    units: number;
    revenue: number;
  }[];
  topProductsNgn: {
    productId: string;
    name: string;
    units: number;
    revenue: number;
  }[];
  salesByCollection: {
    collectionId: string;
    collection: string;
    revenueGhs: number;
    revenueNgn: number;
  }[];
  salesByCountry: { country: string; revenue: number; orders: number }[];
  paymentSplit: { method: string; count: number }[];
  newVsReturning: { label: "New" | "Returning"; value: number }[];
  aovTrend: { date: string; aovGhs: number; aovNgn: number }[];
  summary: {
    totalRevenueGhs: number;
    totalRevenueNgn: number;
    totalOrders: number;
    totalPaidOrders: number;
    newCustomers: number;
  };
};
