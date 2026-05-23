"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AdminUser,
  BannerConfig,
  BannerMessage,
  Collection,
  Customer,
  InnerCircleMember,
  Order,
  OrderStatus,
  Product,
  Review,
  StoreSettings,
} from "@/types";
import {
  seedAdmins,
  seedBannerConfig,
  seedBannerMessages,
  seedCollections,
  seedCustomers,
  seedInnerCircle,
  seedOrders,
  seedProducts,
  seedReviews,
  seedSettings,
} from "@/lib/data/seed";

// Bump this version any time the seed shape changes — wipes persisted state.
const STORAGE_VERSION = 1;

type State = {
  hydrated: boolean;
  collections: Collection[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  reviews: Review[];
  bannerConfig: BannerConfig;
  bannerMessages: BannerMessage[];
  innerCircle: InnerCircleMember[];
  settings: StoreSettings;
  admins: AdminUser[];
};

type Actions = {
  setHydrated: (v: boolean) => void;
  resetAll: () => void;

  // Collections
  upsertCollection: (c: Collection) => void;
  deleteCollection: (id: string) => void;
  reorderCollections: (ids: string[]) => void;

  // Products
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductVisibility: (id: string) => void;
  duplicateProduct: (id: string) => string | null;

  // Customers
  updateCustomer: (id: string, patch: Partial<Customer>) => void;

  // Orders
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    extras?: { note?: string; carrier?: string; trackingNumber?: string },
  ) => void;
  updateOrderNotes: (id: string, notes: string) => void;
  refundOrder: (id: string, amount: number, reason: string) => void;

  // Reviews
  updateReviewStatus: (
    id: string,
    status: Review["status"],
    adminNote?: string,
  ) => void;
  deleteReview: (id: string) => void;

  // Banner
  updateBannerConfig: (patch: Partial<BannerConfig>) => void;
  upsertBannerMessage: (m: BannerMessage) => void;
  deleteBannerMessage: (id: string) => void;
  reorderBannerMessages: (ids: string[]) => void;

  // Inner circle
  updateInnerCircleStatus: (
    id: string,
    status: InnerCircleMember["status"],
    note?: string,
  ) => void;

  // Settings
  updateSettings: (patch: Partial<StoreSettings>) => void;
  inviteAdmin: (name: string, email: string, role: AdminUser["role"]) => void;
  removeAdmin: (id: string) => void;
};

const initialState: State = {
  hydrated: false,
  collections: seedCollections,
  products: seedProducts,
  customers: seedCustomers,
  orders: seedOrders,
  reviews: seedReviews,
  bannerConfig: seedBannerConfig,
  bannerMessages: seedBannerMessages,
  innerCircle: seedInnerCircle,
  settings: seedSettings,
  admins: seedAdmins,
};

const recomputeTotalStock = (p: Product): Product => ({
  ...p,
  totalStock: p.variants.reduce(
    (s, v) => s + v.sizes.reduce((ss, sz) => ss + sz.stock, 0),
    0,
  ),
});

const now = () => new Date().toISOString();

export const useAdminStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,
      setHydrated: (v) => set({ hydrated: v }),
      resetAll: () => set(initialState),

      // ───────── Collections ─────────
      upsertCollection: (c) =>
        set((s) => {
          const exists = s.collections.find((x) => x.id === c.id);
          const updated: Collection = { ...c, updatedAt: now() };
          return {
            collections: exists
              ? s.collections.map((x) => (x.id === c.id ? updated : x))
              : [...s.collections, { ...updated, createdAt: now() }],
          };
        }),
      deleteCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((x) => x.id !== id) })),
      reorderCollections: (ids) =>
        set((s) => ({
          collections: s.collections
            .map((c) => {
              const i = ids.indexOf(c.id);
              return i === -1 ? c : { ...c, sortOrder: i + 1 };
            })
            .sort((a, b) => a.sortOrder - b.sortOrder),
        })),

      // ───────── Products ─────────
      upsertProduct: (p) =>
        set((s) => {
          const computed = recomputeTotalStock({ ...p, updatedAt: now() });
          const exists = s.products.find((x) => x.id === p.id);
          return {
            products: exists
              ? s.products.map((x) => (x.id === p.id ? computed : x))
              : [...s.products, { ...computed, createdAt: now() }],
          };
        }),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
      toggleProductVisibility: (id) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id
              ? { ...p, isVisible: !p.isVisible, updatedAt: now() }
              : p,
          ),
        })),
      duplicateProduct: (id) => {
        const original = get().products.find((p) => p.id === id);
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
        set((s) => ({ products: [...s.products, copy] }));
        return newId;
      },

      // ───────── Customers ─────────
      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: now() } : c,
          ),
        })),
      // ───────── Orders ─────────
      updateOrderStatus: (id, status, extras) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const updates: Partial<Order> = {
              status,
              updatedAt: now(),
            };
            if (extras?.carrier) updates.carrier = extras.carrier;
            if (extras?.trackingNumber)
              updates.trackingNumber = extras.trackingNumber;
            if (status === "shipped" && !o.shippedAt) updates.shippedAt = now();
            if (status === "delivered") updates.deliveredAt = now();
            if (extras?.note) updates.notes = o.notes
              ? `${o.notes}\n[${new Date().toLocaleString()}] ${extras.note}`
              : extras.note;
            return { ...o, ...updates };
          }),
        })),
      updateOrderNotes: (id, notes) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, notes, updatedAt: now() } : o,
          ),
        })),
      refundOrder: (id, amount, reason) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: "refunded",
                  paymentStatus:
                    amount >= o.total ? "refunded" : "partially_refunded",
                  notes: o.notes
                    ? `${o.notes}\n[REFUND ${amount}] ${reason}`
                    : `[REFUND ${amount}] ${reason}`,
                  updatedAt: now(),
                }
              : o,
          ),
        })),

      // ───────── Reviews ─────────
      updateReviewStatus: (id, status, adminNote) =>
        set((s) => ({
          reviews: s.reviews.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  adminNote: adminNote ?? r.adminNote,
                  updatedAt: now(),
                }
              : r,
          ),
        })),
      deleteReview: (id) =>
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),

      // ───────── Banner ─────────
      updateBannerConfig: (patch) =>
        set((s) => ({ bannerConfig: { ...s.bannerConfig, ...patch } })),
      upsertBannerMessage: (m) =>
        set((s) => {
          const exists = s.bannerMessages.find((x) => x.id === m.id);
          const updated = { ...m, updatedAt: now() };
          return {
            bannerMessages: exists
              ? s.bannerMessages.map((x) => (x.id === m.id ? updated : x))
              : [...s.bannerMessages, { ...updated, createdAt: now() }],
          };
        }),
      deleteBannerMessage: (id) =>
        set((s) => ({
          bannerMessages: s.bannerMessages.filter((x) => x.id !== id),
        })),
      reorderBannerMessages: (ids) =>
        set((s) => ({
          bannerMessages: s.bannerMessages
            .map((m) => {
              const i = ids.indexOf(m.id);
              return i === -1 ? m : { ...m, sortOrder: i + 1 };
            })
            .sort((a, b) => a.sortOrder - b.sortOrder),
        })),

      // ───────── Inner circle ─────────
      updateInnerCircleStatus: (id, status, note) =>
        set((s) => {
          const member = s.innerCircle.find((m) => m.id === id);
          let customersNext = s.customers;
          if (status === "approved" && member) {
            const linked = s.customers.find((c) => c.email === member.email);
            if (linked) {
              customersNext = s.customers.map((c) =>
                c.id === linked.id ? { ...c, innerCircle: true } : c,
              );
            }
          }
          return {
            customers: customersNext,
            innerCircle: s.innerCircle.map((m) =>
              m.id === id
                ? {
                    ...m,
                    status,
                    notes: note ?? m.notes,
                    approvedAt:
                      status === "approved" ? now() : m.approvedAt,
                  }
                : m,
            ),
          };
        }),

      // ───────── Settings ─────────
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      inviteAdmin: (name, email, role) =>
        set((s) => ({
          admins: [
            ...s.admins,
            {
              id: `adm_${Date.now().toString(36)}`,
              name,
              email,
              role,
              createdAt: now(),
            },
          ],
        })),
      removeAdmin: (id) =>
        set((s) => ({ admins: s.admins.filter((a) => a.id !== id) })),
    }),
    {
      name: "unap-admin-store",
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // Persist everything except the hydrated flag.
        const { hydrated: _h, ...rest } = s;
        void _h;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
