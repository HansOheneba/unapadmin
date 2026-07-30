import type {
  AdminUser,
  AnalyticsReport,
  BannerConfig,
  BannerMessage,
  Collection,
  CollectionWithCount,
  Customer,
  DashboardStats,
  DeliveryEvent,
  InnerCircleMember,
  Order,
  OrderStatus,
  Paginated,
  Product,
  Review,
  Rider,
  StoreSettings,
} from "@/types";
import {
  createSeedStore,
  getPersistedStore,
  resetPersistedStore,
  setPersistedStore,
  type MockStoreData,
} from "./persisted-store";

const now = () => new Date().toISOString();

type Store = MockStoreData;

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "ready_for_pickup",
  "picked_up",
  "in_transit",
];

function getStore(): Store {
  return getPersistedStore();
}

function withRiderCounts(s: Store): Store {
  return {
    ...s,
    riders: s.riders.map((r) => ({
      ...r,
      activeDeliveries: s.orders.filter(
        (o) => o.riderId === r.id && ACTIVE_ORDER_STATUSES.includes(o.status),
      ).length,
    })),
  };
}

function commitStore(next: Store): void {
  setPersistedStore(withRiderCounts(next));
}

function patchStore(patch: Partial<Store>): void {
  commitStore({ ...getStore(), ...patch });
}

export function resetMockStore(): void {
  resetPersistedStore();
}

const recomputeTotalStock = (p: Product): Product => ({
  ...p,
  totalStock: p.variants.reduce(
    (s, v) => s + v.sizes.reduce((ss, sz) => ss + sz.stock, 0),
    0,
  ),
});

function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 20,
): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export function mockSendOtp(_email: string): { message: string } {
  return { message: "If an account exists, a code was sent." };
}

export function mockVerifyOtp(
  email: string,
  otp: string,
): { token: string; user: AdminUser } | null {
  const found = getStore().admins.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!found || otp.length !== 6) return null;
  return {
    token: `mock-jwt-${found.id}`,
    user: found,
  };
}

export function mockGetMe(token: string | null): AdminUser | null {
  if (!token?.startsWith("mock-jwt-")) return null;
  const id = token.replace("mock-jwt-", "");
  return getStore().admins.find((a) => a.id === id) ?? null;
}

// ─── Collections ────────────────────────────────────────────────────────────

export function mockGetCollections(): CollectionWithCount[] {
  return [...getStore().collections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      ...c,
      productCount: getStore().products.filter((p) => p.collectionId === c.id).length,
    }));
}

export function mockUpsertCollection(c: Collection): Collection {
  const exists = getStore().collections.find((x) => x.id === c.id);
  const updated: Collection = { ...c, updatedAt: now() };
  if (exists) {
    patchStore({ collections: getStore().collections.map((x) =>
      x.id === c.id ? updated : x,
    ) });
  } else {
    const id =
      c.id ||
      c.subtitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const created: Collection = {
      ...updated,
      id,
      href: c.href || `/collections/${id}`,
      sortOrder: c.sortOrder || getStore().collections.length + 1,
      createdAt: now(),
    };
    patchStore({ collections: [...getStore().collections, created] });
    return created;
  }
  return updated;
}

export function mockDeleteCollection(id: string): void {
  patchStore({ collections: getStore().collections.filter((x) => x.id !== id) });
}

export function mockReorderCollections(ids: string[]): void {
  patchStore({
    collections: getStore()
      .collections.map((c) => {
        const i = ids.indexOf(c.id);
        return i === -1 ? c : { ...c, sortOrder: i + 1 };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder),
  });
}

// ─── Products ───────────────────────────────────────────────────────────────

export function mockGetProducts(params: {
  collectionId?: string;
  q?: string;
  visibility?: "visible" | "hidden" | "all";
  stock?: "in" | "low" | "out" | "all";
  page?: number;
  pageSize?: number;
}): Paginated<Product> {
  const threshold = getStore().settings.lowStockThreshold;
  let items = [...getStore().products];
  if (params.collectionId)
    items = items.filter((p) => p.collectionId === params.collectionId);
  if (params.visibility === "visible")
    items = items.filter((p) => p.isActive);
  if (params.visibility === "hidden")
    items = items.filter((p) => !p.isActive);
  if (params.stock === "out") items = items.filter((p) => p.totalStock === 0);
  if (params.stock === "in")
    items = items.filter((p) => p.totalStock > threshold);
  if (params.stock === "low")
    items = items.filter(
      (p) => p.totalStock > 0 && p.totalStock <= threshold,
    );
  if (params.q) {
    const needle = params.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle),
    );
  }
  return paginate(items, params.page, params.pageSize);
}

export function mockGetProduct(id: string): Product | null {
  return getStore().products.find((p) => p.id === id) ?? null;
}

export function mockUpsertProduct(p: Product): Product {
  const computed = recomputeTotalStock({ ...p, updatedAt: now() });
  const exists = getStore().products.find((x) => x.id === p.id);
  if (exists) {
    patchStore({ products: getStore().products.map((x) =>
      x.id === p.id ? computed : x,
    ) });
  } else {
    const created = { ...computed, createdAt: now() };
    patchStore({ products: [...getStore().products, created] });
    return created;
  }
  return computed;
}

export function mockDeleteProduct(id: string): void {
  patchStore({ products: getStore().products.filter((x) => x.id !== id) });
}

export function mockToggleProductVisibility(
  id: string,
): { id: string; isActive: boolean } | null {
  const p = getStore().products.find((x) => x.id === id);
  if (!p) return null;
  const isActive = !p.isActive;
  patchStore({ products: getStore().products.map((x) =>
    x.id === id ? { ...x, isActive, updatedAt: now() } : x,
  ) });
  return { id, isActive };
}

export function mockDuplicateProduct(
  id: string,
): { id: string; product: Product } | null {
  const original = getStore().products.find((p) => p.id === id);
  if (!original) return null;
  const newId = `${original.id}-copy-${Date.now().toString(36)}`;
  const copy: Product = {
    ...original,
    id: newId,
    slug: `${original.slug}-copy`,
    name: `${original.name} (Copy)`,
    totalSold: 0,
    reviewCount: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  patchStore({ products: [...getStore().products, copy] });
  return { id: newId, product: copy };
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export function mockGetOrders(params: {
  status?: OrderStatus;
  paymentStatus?: string;
  country?: string;
  riderId?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Paginated<Order> {
  let items = [...getStore().orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (params.status) items = items.filter((o) => o.status === params.status);
  if (params.paymentStatus)
    items = items.filter((o) => o.paymentStatus === params.paymentStatus);
  if (params.country) {
    items = items.filter((o) => o.shippingAddress.country === params.country);
  }
  if (params.riderId === "unassigned") {
    items = items.filter((o) => !o.riderId);
  } else if (params.riderId) {
    items = items.filter((o) => o.riderId === params.riderId);
  }
  if (params.from)
    items = items.filter((o) => new Date(o.createdAt) >= new Date(params.from!));
  if (params.to) {
    const end = new Date(params.to);
    end.setHours(23, 59, 59, 999);
    items = items.filter((o) => new Date(o.createdAt) <= end);
  }
  if (params.q) {
    const needle = params.q.toLowerCase();
    items = items.filter(
      (o) =>
        o.id.toLowerCase().includes(needle) ||
        o.trackingNumber.toLowerCase().includes(needle) ||
        o.customerName.toLowerCase().includes(needle) ||
        o.customerEmail.toLowerCase().includes(needle),
    );
  }
  return paginate(items, params.page, params.pageSize);
}

export function mockGetOrder(id: string): Order | null {
  return getStore().orders.find((o) => o.id === id) ?? null;
}

export function mockUpdateOrderStatus(
  id: string,
  status: OrderStatus,
  extras?: { note?: string; carrier?: string; trackingNumber?: string },
): Order | null {
  const o = getStore().orders.find((x) => x.id === id);
  if (!o) return null;
  const updates: Partial<Order> = { status, updatedAt: now() };
  if (extras?.carrier) updates.carrier = extras.carrier;
  if (extras?.trackingNumber) updates.trackingNumber = extras.trackingNumber;
  if (status === "picked_up" && !o.pickedUpAt) updates.pickedUpAt = now();
  if (status === "in_transit" && !o.outForDeliveryAt)
    updates.outForDeliveryAt = now();
  if (status === "delivered") updates.deliveredAt = now();
  if (extras?.note)
    updates.notes = o.notes
      ? `${o.notes}\n[${new Date().toLocaleString()}] ${extras.note}`
      : extras.note;
  const updated = { ...o, ...updates };
  patchStore({ orders: getStore().orders.map((x) => (x.id === id ? updated : x)) });
  return updated;
}

export function mockUpdateOrderNotes(id: string, notes: string): Order | null {
  const o = getStore().orders.find((x) => x.id === id);
  if (!o) return null;
  const updated = { ...o, notes, updatedAt: now() };
  patchStore({ orders: getStore().orders.map((x) => (x.id === id ? updated : x)) });
  return updated;
}

export function mockGetDeliveryEvents(orderId: string): DeliveryEvent[] {
  return getStore().deliveryEvents
    .filter((e) => e.orderId === orderId)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function mockAssignRider(
  orderId: string,
  riderId: string | null,
  riderNote?: string,
): Order | null {
  const o = getStore().orders.find((x) => x.id === orderId);
  if (!o) return null;
  if (o.deliveryType !== "accra_inhouse") {
    throw new Error("Riders can only be assigned to Accra in-house orders.");
  }

  const prevRiderId = o.riderId;
  const rider = riderId ? getStore().riders.find((r) => r.id === riderId) : null;
  if (riderId && !rider) throw new Error("Rider not found.");

  const retryAfterReturn =
    o.status === "returned" && riderId && riderId !== prevRiderId;

  const updated: Order = {
    ...o,
    riderId,
    riderNote: riderNote ?? o.riderNote,
    carrier: riderId ? "Unapologetic Riders" : o.carrier,
    ...(retryAfterReturn
      ? {
          status: "ready_for_pickup" as OrderStatus,
          returnVerifiedAt: null,
        }
      : {}),
    updatedAt: now(),
  };
  const event =
    riderId && riderId !== prevRiderId && rider
      ? {
          id: `dev_${Date.now().toString(36)}`,
          orderId,
          riderId,
          riderName: `${rider.firstName} ${rider.lastName}`,
          type: "assigned" as const,
          note: retryAfterReturn
            ? `Reassigned for attempt ${o.deliveryAttempts + 1}`
            : null,
          at: now(),
        }
      : null;

  patchStore({
    orders: getStore().orders.map((x) => (x.id === orderId ? updated : x)),
    ...(event
      ? { deliveryEvents: [...getStore().deliveryEvents, event] }
      : {}),
  });
  return updated;
}

export function mockUpdateRiderNote(
  orderId: string,
  riderNote: string,
): Order | null {
  const o = getStore().orders.find((x) => x.id === orderId);
  if (!o) return null;
  const updated = { ...o, riderNote, updatedAt: now() };
  patchStore({ orders: getStore().orders.map((x) => (x.id === orderId ? updated : x)) });
  return updated;
}

export function mockConfirmReturnVerified(orderId: string): Order | null {
  const o = getStore().orders.find((x) => x.id === orderId);
  if (!o) return null;
  if (o.status !== "returned") {
    throw new Error("Only returned orders can be verified.");
  }
  const updated: Order = {
    ...o,
    returnVerifiedAt: now(),
    notes: o.notes
      ? `${o.notes}\n[${new Date().toLocaleString()}] Return verified at warehouse`
      : "Return verified at warehouse",
    updatedAt: now(),
  };
  patchStore({ orders: getStore().orders.map((x) => (x.id === orderId ? updated : x)) });
  return updated;
}

export function mockRefundOrder(
  id: string,
  amount: number,
  reason: string,
): Order | null {
  const o = getStore().orders.find((x) => x.id === id);
  if (!o) return null;
  const updated: Order = {
    ...o,
    status: "refunded",
    paymentStatus: amount >= o.total ? "refunded" : "partially_refunded",
    notes: o.notes
      ? `${o.notes}\n[REFUND ${amount}] ${reason}`
      : `[REFUND ${amount}] ${reason}`,
    updatedAt: now(),
  };
  patchStore({ orders: getStore().orders.map((x) => (x.id === id ? updated : x)) });
  return updated;
}

// ─── Customers ──────────────────────────────────────────────────────────────

export function mockGetCustomers(params: {
  status?: string;
  country?: string;
  innerCircle?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Paginated<Customer> {
  let items = [...getStore().customers].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (params.status) items = items.filter((c) => c.status === params.status);
  if (params.country) items = items.filter((c) => c.country === params.country);
  if (params.innerCircle === "yes")
    items = items.filter((c) => c.innerCircle);
  if (params.innerCircle === "no")
    items = items.filter((c) => !c.innerCircle);
  if (params.q) {
    const needle = params.q.toLowerCase();
    items = items.filter(
      (c) =>
        c.firstName.toLowerCase().includes(needle) ||
        c.lastName.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.phone.includes(needle),
    );
  }
  return paginate(items, params.page, params.pageSize);
}

export function mockGetCustomer(id: string): Customer | null {
  return getStore().customers.find((c) => c.id === id) ?? null;
}

export function mockGetCustomerOrders(id: string): Order[] {
  return getStore().orders
    .filter((o) => o.customerId === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function mockUpdateCustomer(
  id: string,
  patch: Partial<Customer>,
): Customer | null {
  const c = getStore().customers.find((x) => x.id === id);
  if (!c) return null;
  const updated = { ...c, ...patch, updatedAt: now() };
  patchStore({ customers: getStore().customers.map((x) => (x.id === id ? updated : x)) });
  return updated;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export function mockGetReviews(params: {
  status?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
}): Paginated<Review> {
  let items = [...getStore().reviews].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (params.status && params.status !== "all")
    items = items.filter((r) => r.status === params.status);
  if (params.productId)
    items = items.filter((r) => r.productId === params.productId);
  return paginate(items, params.page, params.pageSize);
}

export function mockUpdateReviewStatus(
  id: string,
  status: Review["status"],
  adminNote?: string,
): Review | null {
  const r = getStore().reviews.find((x) => x.id === id);
  if (!r) return null;
  const updated = {
    ...r,
    status,
    adminNote: adminNote ?? r.adminNote,
    updatedAt: now(),
  };
  patchStore({ reviews: getStore().reviews.map((x) => (x.id === id ? updated : x)) });
  return updated;
}

export function mockDeleteReview(id: string): void {
  patchStore({ reviews: getStore().reviews.filter((r) => r.id !== id) });
}

// ─── Announcements ──────────────────────────────────────────────────────────

export function mockGetBannerConfig(): BannerConfig {
  return { ...getStore().bannerConfig };
}

export function mockUpdateBannerConfig(
  patch: Partial<BannerConfig>,
): BannerConfig {
  patchStore({ bannerConfig: { ...getStore().bannerConfig, ...patch } });
  return getStore().bannerConfig;
}

export function mockGetBannerMessages(): BannerMessage[] {
  return [...getStore().bannerMessages].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function mockUpsertBannerMessage(m: BannerMessage): BannerMessage {
  const exists = getStore().bannerMessages.find((x) => x.id === m.id);
  const updated = { ...m, updatedAt: now() };
  if (exists) {
    patchStore({ bannerMessages: getStore().bannerMessages.map((x) =>
      x.id === m.id ? updated : x,
    ) });
  } else {
    const created = { ...updated, id: m.id || `bnr_${Date.now()}`, createdAt: now() };
    patchStore({ bannerMessages: [...getStore().bannerMessages, created] });
    return created;
  }
  return updated;
}

export function mockDeleteBannerMessage(id: string): void {
  patchStore({ bannerMessages: getStore().bannerMessages.filter((x) => x.id !== id) });
}

export function mockReorderBannerMessages(ids: string[]): void {
  patchStore({
    bannerMessages: getStore()
      .bannerMessages.map((m) => {
        const i = ids.indexOf(m.id);
        return i === -1 ? m : { ...m, sortOrder: i + 1 };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder),
  });
}

// ─── Inner Circle ───────────────────────────────────────────────────────────

export function mockGetInnerCircle(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Paginated<InnerCircleMember> {
  let items = [...getStore().innerCircle].sort(
    (a, b) =>
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
  );
  if (params.status && params.status !== "all")
    items = items.filter((m) => m.status === params.status);
  return paginate(items, params.page, params.pageSize);
}

export function mockUpdateInnerCircleStatus(
  id: string,
  status: InnerCircleMember["status"],
  note?: string,
): InnerCircleMember | null {
  const member = getStore().innerCircle.find((m) => m.id === id);
  if (!member) return null;
  if (status === "approved") {
    const linked = getStore().customers.find((c) => c.email === member.email);
    if (linked) {
      patchStore({ customers: getStore().customers.map((c) =>
        c.id === linked.id ? { ...c, innerCircle: true } : c,
      ) });
    }
  }
  const updated: InnerCircleMember = {
    ...member,
    status,
    notes: note ?? member.notes,
    approvedAt: status === "approved" ? now() : member.approvedAt,
  };
  patchStore({ innerCircle: getStore().innerCircle.map((m) =>
    m.id === id ? updated : m,
  ) });
  return updated;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export function mockGetSettings(): StoreSettings {
  return { ...getStore().settings };
}

export function mockUpdateSettings(
  patch: Partial<StoreSettings>,
): StoreSettings {
  patchStore({ settings: { ...getStore().settings, ...patch } });
  return getStore().settings;
}

export function mockGetAdmins(): AdminUser[] {
  return [...getStore().admins];
}

export function mockInviteAdmin(
  name: string,
  email: string,
  role: AdminUser["role"],
): AdminUser {
  const admin: AdminUser = {
    id: `adm_${Date.now().toString(36)}`,
    name,
    email,
    role,
    createdAt: now(),
  };
  patchStore({ admins: [...getStore().admins, admin] });
  return admin;
}

export function mockUpdateAdminRole(
  id: string,
  role: AdminUser["role"],
): AdminUser {
  const admins = getStore().admins;
  const target = admins.find((a) => a.id === id);
  if (!target) throw new Error("Admin not found");

  const remainingSuperAdmins = admins.filter(
    (a) => a.role === "super_admin" && a.id !== id,
  ).length;
  if (target.role === "super_admin" && role !== "super_admin" && remainingSuperAdmins === 0) {
    throw new Error("Cannot demote the last super admin.");
  }

  const updated = { ...target, role };
  patchStore({ admins: admins.map((a) => (a.id === id ? updated : a)) });
  return updated;
}

export function mockRemoveAdmin(id: string): void {
  const admins = getStore().admins;
  const target = admins.find((a) => a.id === id);
  if (!target) throw new Error("Admin not found");

  const remainingSuperAdmins = admins.filter(
    (a) => a.role === "super_admin" && a.id !== id,
  ).length;
  if (target.role === "super_admin" && remainingSuperAdmins === 0) {
    throw new Error("Cannot delete the last super admin.");
  }

  patchStore({ admins: admins.filter((a) => a.id !== id) });
}

// ─── Dashboard & Analytics ─────────────────────────────────────────────────

function getStoreSnapshot() {
  return getStore();
}

export function mockGetDashboardStats(): DashboardStats {
  const { orders, products, customers, settings } = getStoreSnapshot();
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const todayStr = today.toISOString().slice(0, 10);

  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const monthOrders = paidOrders.filter(
    (o) => new Date(o.createdAt) >= startOfMonth,
  );
  const prevMonthOrders = paidOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= startOfPrevMonth && d <= endOfPrevMonth;
  });

  const sumByCurrency = (list: Order[], cur: "GHS" | "NGN") =>
    list.filter((o) => o.currency === cur).reduce((s, o) => s + o.total, 0);

  const threshold = settings.lowStockThreshold;
  const lowStockCount = products.reduce(
    (n, p) =>
      n +
      (p.variants.some((v) =>
        v.sizes.some((s) => s.stock > 0 && s.stock <= threshold),
      )
        ? 1
        : 0),
    0,
  );

  const revenueChart: DashboardStats["revenueChart"] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const dayOrders = paidOrders.filter(
      (o) => new Date(o.createdAt).toISOString().slice(0, 10) === k,
    );
    revenueChart.push({
      date: k,
      ghs: sumByCurrency(dayOrders, "GHS"),
      ngn: sumByCurrency(dayOrders, "NGN"),
    });
  }

  const statusMap: Record<string, number> = {};
  orders.forEach((o) => {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  });

  const productMap = new Map<
    string,
    { name: string; image: string; units: number; revenue: number }
  >();
  monthOrders.forEach((o) => {
    o.items.forEach((item) => {
      const cur = productMap.get(item.productId) ?? {
        name: item.productName,
        image: item.imageUrl,
        units: 0,
        revenue: 0,
      };
      cur.units += item.quantity;
      cur.revenue += item.totalPrice;
      productMap.set(item.productId, cur);
    });
  });
  const topProducts = [...productMap.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const countryMap: Record<string, { revenue: number; orders: number }> = {};
  monthOrders.forEach((o) => {
    const country = o.currency === "GHS" ? "Ghana" : "Nigeria";
    if (!countryMap[country]) countryMap[country] = { revenue: 0, orders: 0 };
    countryMap[country].revenue += o.total;
    countryMap[country].orders += 1;
  });

  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const activeCustomerIds = new Set(
    orders
      .filter((o) => new Date(o.createdAt) >= ninetyDaysAgo)
      .map((o) => o.customerId),
  );

  const ghsMonth = sumByCurrency(monthOrders, "GHS");
  const ghsMonthCount = monthOrders.filter((o) => o.currency === "GHS").length;

  return {
    revenueThisMonthGhs: ghsMonth,
    revenueThisMonthNgn: sumByCurrency(monthOrders, "NGN"),
    revenuePrevMonthGhs: sumByCurrency(prevMonthOrders, "GHS"),
    revenuePrevMonthNgn: sumByCurrency(prevMonthOrders, "NGN"),
    ordersToday: orders.filter(
      (o) => new Date(o.createdAt).toISOString().slice(0, 10) === todayStr,
    ).length,
    activeCustomers: activeCustomerIds.size,
    pendingAndProcessingOrders: orders.filter(
      (o) =>
        o.status === "processing" ||
        o.status === "ready_for_pickup" ||
        o.status === "picked_up" ||
        o.status === "in_transit" ||
        o.status === "returned",
    ).length,
    lowStockCount,
    aovThisMonthGhs: ghsMonthCount ? Math.round(ghsMonth / ghsMonthCount) : 0,
    revenueChart,
    ordersByStatus: Object.entries(statusMap).map(([status, count]) => ({
      status: status as OrderStatus,
      count,
    })),
    topProducts,
    recentOrders: [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10),
    salesByCountry: Object.entries(countryMap).map(([country, v]) => ({
      country,
      ...v,
    })),
  };
}

export function mockGetAnalytics(from: string, to: string): AnalyticsReport {
  const { orders, customers, collections } = getStoreSnapshot();
  const f = new Date(from);
  const t = new Date(to);
  t.setHours(23, 59, 59, 999);

  const inRange = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= f && d <= t;
  });
  const paid = inRange.filter((o) => o.paymentStatus === "paid");

  const dailyRevenue: AnalyticsReport["dailyRevenue"] = [];
  for (let d = new Date(f); d <= t; d.setDate(d.getDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    const dayOrders = paid.filter(
      (o) => new Date(o.createdAt).toISOString().slice(0, 10) === k,
    );
    dailyRevenue.push({
      date: k,
      ghs: dayOrders
        .filter((o) => o.currency === "GHS")
        .reduce((s, o) => s + o.total, 0),
      ngn: dayOrders
        .filter((o) => o.currency === "NGN")
        .reduce((s, o) => s + o.total, 0),
    });
  }

  const statusMap: Record<string, number> = {};
  inRange.forEach((o) => {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  });

  const buildTopProducts = (currency: "GHS" | "NGN") => {
    const m = new Map<
      string,
      { name: string; units: number; revenue: number }
    >();
    paid
      .filter((o) => o.currency === currency)
      .forEach((o) => {
        o.items.forEach((item) => {
          const cur = m.get(item.productId) ?? {
            name: item.productName,
            units: 0,
            revenue: 0,
          };
          cur.units += item.quantity;
          cur.revenue += item.totalPrice;
          m.set(item.productId, cur);
        });
      });
    return [...m.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  };

  const collMap = new Map<
    string,
    { collection: string; revenueGhs: number; revenueNgn: number }
  >();
  paid.forEach((o) => {
    o.items.forEach((item) => {
      const coll = collections.find((c) => c.id === item.collectionId);
      const collectionName =
        coll?.subtitle ||
        coll?.title ||
        item.collectionId
          .split(/[-_]/)
          .filter(Boolean)
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(" ");
      const cur = collMap.get(item.collectionId) ?? {
        collection: collectionName,
        revenueGhs: 0,
        revenueNgn: 0,
      };
      if (o.currency === "GHS") cur.revenueGhs += item.totalPrice;
      else cur.revenueNgn += item.totalPrice;
      collMap.set(item.collectionId, cur);
    });
  });

  const countryMap: Record<string, { revenue: number; orders: number }> = {};
  paid.forEach((o) => {
    const country = o.currency === "GHS" ? "Ghana" : "Nigeria";
    if (!countryMap[country]) countryMap[country] = { revenue: 0, orders: 0 };
    countryMap[country].revenue += o.total;
    countryMap[country].orders += 1;
  });

  const paymentMap: Record<string, number> = {};
  inRange.forEach((o) => {
    paymentMap[o.paymentMethod] = (paymentMap[o.paymentMethod] ?? 0) + 1;
  });

  const newInRange = customers.filter((c) => {
    const d = new Date(c.joinedDate);
    return d >= f && d <= t;
  }).length;
  const returning = customers.filter((c) => c.totalOrders > 1).length;

  const aovTrend: AnalyticsReport["aovTrend"] = dailyRevenue.map((d) => {
    const dayOrders = paid.filter(
      (o) => new Date(o.createdAt).toISOString().slice(0, 10) === d.date,
    );
    const ghsOrders = dayOrders.filter((o) => o.currency === "GHS");
    const ngnOrders = dayOrders.filter((o) => o.currency === "NGN");
    return {
      date: d.date,
      aovGhs: ghsOrders.length
        ? Math.round(
            ghsOrders.reduce((s, o) => s + o.total, 0) / ghsOrders.length,
          )
        : 0,
      aovNgn: ngnOrders.length
        ? Math.round(
            ngnOrders.reduce((s, o) => s + o.total, 0) / ngnOrders.length,
          )
        : 0,
    };
  });

  return {
    dailyRevenue,
    ordersByStatus: Object.entries(statusMap).map(([status, count]) => ({
      status: status as OrderStatus,
      count,
    })),
    topProducts: buildTopProducts("GHS"),
    topProductsNgn: buildTopProducts("NGN"),
    salesByCollection: [...collMap.entries()].map(([collectionId, v]) => ({
      collectionId,
      ...v,
    })),
    salesByCountry: Object.entries(countryMap).map(([country, v]) => ({
      country,
      ...v,
    })),
    paymentSplit: Object.entries(paymentMap).map(([method, count]) => ({
      method,
      count,
    })),
    newVsReturning: [
      { label: "New", value: newInRange },
      { label: "Returning", value: returning },
    ],
    aovTrend,
    summary: {
      totalRevenueGhs: paid
        .filter((o) => o.currency === "GHS")
        .reduce((s, o) => s + o.total, 0),
      totalRevenueNgn: paid
        .filter((o) => o.currency === "NGN")
        .reduce((s, o) => s + o.total, 0),
      totalOrders: inRange.length,
      totalPaidOrders: paid.length,
      newCustomers: newInRange,
    },
  };
}

// ─── Riders ─────────────────────────────────────────────────────────────────

export function mockGetRiders(params: {
  status?: string;
  country?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Paginated<Rider> {
  let items = [...getStore().riders].sort(
    (a, b) =>
      new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
  );
  if (params.status && params.status !== "all")
    items = items.filter((r) => r.status === params.status);
  if (params.country) items = items.filter((r) => r.country === params.country);
  if (params.q) {
    const needle = params.q.toLowerCase();
    items = items.filter(
      (r) =>
        r.firstName.toLowerCase().includes(needle) ||
        r.lastName.toLowerCase().includes(needle) ||
        r.phone.includes(needle) ||
        r.plateNumber.toLowerCase().includes(needle) ||
        r.zone.toLowerCase().includes(needle),
    );
  }
  return paginate(items, params.page, params.pageSize);
}

export function mockGetRider(id: string): Rider | null {
  return getStore().riders.find((r) => r.id === id) ?? null;
}

export function mockUpsertRider(r: Rider): Rider {
  const exists = getStore().riders.find((x) => x.id === r.id);
  const updated: Rider = { ...r, updatedAt: now() };
  if (exists) {
    patchStore({ riders: getStore().riders.map((x) => (x.id === r.id ? updated : x)) });
  } else {
    const created: Rider = {
      ...updated,
      id: r.id || `rdr_${Date.now().toString(36)}`,
      activeDeliveries: 0,
      totalDeliveries: 0,
      joinedAt: r.joinedAt || now(),
      createdAt: now(),
    };
    patchStore({ riders: [...getStore().riders, created] });
    return created;
  }
  return updated;
}

export function mockDeleteRider(id: string): void {
  patchStore({ riders: getStore().riders.filter((x) => x.id !== id) });
}

// Search helpers for topbar
export function mockSearch(q: string): {
  orders: Order[];
  customers: Customer[];
  products: Product[];
} {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2)
    return { orders: [], customers: [], products: [] };
  return {
    orders: getStore().orders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(needle) ||
          o.customerName.toLowerCase().includes(needle) ||
          o.customerEmail.toLowerCase().includes(needle) ||
          o.trackingNumber.toLowerCase().includes(needle),
      )
      .slice(0, 4),
    customers: getStore().customers
      .filter((c) => {
        const hay =
          `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, 4),
    products: getStore().products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.slug.toLowerCase().includes(needle),
      )
      .slice(0, 4),
  };
}

export function mockGetBadgeCounts(): {
  pendingOrders: number;
  lowStock: number;
  pendingReviews: number;
  innerCirclePending: number;
} {
  const threshold = getStore().settings.lowStockThreshold;
  return {
    pendingOrders: getStore().orders.filter(
      (o) =>
        o.status === "processing" ||
        o.status === "ready_for_pickup" ||
        o.status === "picked_up" ||
        o.status === "in_transit" ||
        (o.status === "returned" && !o.returnVerifiedAt),
    ).length,
    lowStock: getStore().products.reduce(
      (n, p) =>
        n +
        (p.variants.some((v) =>
          v.sizes.some((s) => s.stock > 0 && s.stock <= threshold),
        )
          ? 1
          : 0),
      0,
    ),
    pendingReviews: getStore().reviews.filter((r) => r.status === "pending").length,
    innerCirclePending: getStore().innerCircle.filter((m) => m.status === "pending")
      .length,
  };
}
