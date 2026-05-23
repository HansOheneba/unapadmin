// Centralized types — mirrors ADMIN_SPEC.md

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
  | "pending"
  | "processing"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "exception";

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

export type Order = {
  id: string;
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
  paymentMethod: "momo" | "card" | "cash";
  paymentReference: string | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  discountCode: string | null;
  total: number;
  currency: Currency;
  notes: string;
  customerNote: string;
  carrier: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SizeStock = {
  size: string;
  stock: number;
  sku: string;
};

export type ColorVariant = {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  sizes: SizeStock[];
};

export type ProductCategory =
  | "boxers"
  | "tops"
  | "tracks"
  | "headwear"
  | "sunglasses"
  | "hoodies"
  | "lingerie";

export type ProductTag = "Essential" | "Signature" | "Limited" | "New";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: ProductCategory;
  tag: ProductTag;
  collectionId: string;
  variants: ColorVariant[];
  details: string[];
  careInstructions: string[];
  isVisible: boolean;
  isFeatured: boolean;
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
  isVisible: boolean;
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

export type StoreSettings = {
  adminEmailForOrders: string;
  adminEmailForLowStock: string;
  lowStockThreshold: number;
};
