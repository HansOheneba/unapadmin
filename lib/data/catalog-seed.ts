import type { Collection, Product } from "@/types";
import catalogSeed from "./catalog-seed.json";

export const seedCollections: Collection[] = catalogSeed.collections as Collection[];

export const seedProducts: Product[] = (
  catalogSeed.products as Array<
    Omit<Product, "isPreorder" | "availableDate"> & {
      isPreorder?: boolean;
      availableDate?: string | null;
    }
  >
).map((p) => ({
  ...p,
  isPreorder: p.isPreorder ?? false,
  availableDate: p.availableDate ?? null,
}));

export const CATALOG_META = catalogSeed.meta;
