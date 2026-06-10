import type { Collection, Product } from "@/types";
import catalogSeed from "./catalog-seed.json";

export const seedCollections: Collection[] = catalogSeed.collections as Collection[];
export const seedProducts: Product[] = catalogSeed.products as Product[];

export const CATALOG_META = catalogSeed.meta;
