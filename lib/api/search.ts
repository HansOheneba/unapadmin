import type { Customer, Order, Product } from "@/types";
import { restOrMock } from "./client";
import { mockSearch } from "@/lib/mock/data-store";

// Global search is a REST path under Admin v2 additions.

export type SearchResults = {
  orders: Order[];
  customers: Customer[];
  products: Product[];
};

export async function globalSearch(q: string): Promise<SearchResults> {
  return restOrMock("/search", () => mockSearch(q), {
    method: "GET",
    query: { q },
  });
}
