import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AdminUser,
  BannerConfig,
  BannerMessage,
  Collection,
  Customer,
  DeliveryEvent,
  InnerCircleMember,
  NewsletterSubscriber,
  Order,
  Product,
  Review,
  Rider,
  StoreSettings,
} from "@/types";
import {
  seedAdmins,
  seedBannerConfig,
  seedBannerMessages,
  seedCollections,
  seedCustomers,
  seedDeliveryEvents,
  seedInnerCircle,
  seedNewsletter,
  seedOrders,
  seedProducts,
  seedReviews,
  seedRiders,
  seedSettings,
} from "@/lib/data/seed";

export type MockStoreData = {
  collections: Collection[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  deliveryEvents: DeliveryEvent[];
  reviews: Review[];
  bannerConfig: BannerConfig;
  bannerMessages: BannerMessage[];
  innerCircle: InnerCircleMember[];
  newsletter: NewsletterSubscriber[];
  riders: Rider[];
  settings: StoreSettings;
  admins: AdminUser[];
};

/** Bump when seed shape changes to reset stale localStorage demos. */
export const MOCK_STORE_VERSION = 4;

export function createSeedStore(): MockStoreData {
  return {
    collections: [...seedCollections],
    products: [...seedProducts],
    customers: [...seedCustomers],
    orders: [...seedOrders],
    deliveryEvents: [...seedDeliveryEvents],
    reviews: [...seedReviews],
    bannerConfig: { ...seedBannerConfig },
    bannerMessages: [...seedBannerMessages],
    innerCircle: [...seedInnerCircle],
    newsletter: [...seedNewsletter],
    riders: [...seedRiders],
    settings: { ...seedSettings },
    admins: [...seedAdmins],
  };
}

const ssrSnapshot: MockStoreData = createSeedStore();
let syncHydrated = false;

function ensureSyncHydrated(): void {
  if (typeof window === "undefined" || syncHydrated) return;
  syncHydrated = true;
  try {
    const raw = localStorage.getItem("unap-admin-data");
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      state?: MockStoreData;
      version?: number;
    };
    if (parsed.version !== MOCK_STORE_VERSION || !parsed.state) return;
    adminDataStore.setState(parsed.state, true);
  } catch {
    // corrupt storage — seed will be used
  }
}

export const adminDataStore = createStore<MockStoreData>()(
  persist(() => createSeedStore(), {
    name: "unap-admin-data",
    version: MOCK_STORE_VERSION,
    storage: createJSONStorage(() => localStorage),
    migrate: (persisted, version) => {
      if (version !== MOCK_STORE_VERSION) return createSeedStore();
      return persisted as MockStoreData;
    },
  }),
);

export function getPersistedStore(): MockStoreData {
  if (typeof window === "undefined") return ssrSnapshot;
  ensureSyncHydrated();
  return adminDataStore.getState();
}

export function setPersistedStore(next: MockStoreData): void {
  if (typeof window === "undefined") {
    Object.assign(ssrSnapshot, next);
    return;
  }
  adminDataStore.setState(next, true);
}

export function resetPersistedStore(): void {
  const seed = createSeedStore();
  setPersistedStore(seed);
  if (typeof window !== "undefined") {
    adminDataStore.persist.clearStorage();
    adminDataStore.setState(seed, true);
  }
}

export async function rehydratePersistedStore(): Promise<void> {
  if (typeof window === "undefined") return;
  await adminDataStore.persist.rehydrate();
}
