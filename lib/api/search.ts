import type { Customer, Order, Product } from "@/types";
import { apiFetchOrMock } from "./client";
import { mockSearch } from "@/lib/mock/data-store";

export type SearchResults = {
  orders: Order[];
  customers: Customer[];
  products: Product[];
};

export async function globalSearch(q: string): Promise<SearchResults> {
  return apiFetchOrMock(`/search?q=${encodeURIComponent(q)}`, () =>
    mockSearch(q),
  );
}
