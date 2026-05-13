import type { Product, Paginated } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_PRODUCTS: Product[] = [
  {
    id: "boxers-white",
    name: "Signature Boxer - White",
    description: "Premium comfort boxers in crisp white.",
    price: "US$45",
    priceNum: 45,
    tag: "Signature",
    collectionId: "boxers",
    stock: 120,
    lowStockThreshold: 20,
    images: [
      { id: "1", url: "/collections/boxers/boxersWhite.jpeg", isPrimary: true },
    ],
    colors: [
      {
        id: "c1",
        name: "White",
        hex: "#FFFFFF",
        image: "/collections/boxers/boxersWhite.jpeg",
      },
      {
        id: "c2",
        name: "Blue",
        hex: "#3B82F6",
        image: "/collections/boxers/boxersBlue.jpg",
      },
      {
        id: "c3",
        name: "Brown",
        hex: "#92400E",
        image: "/collections/boxers/boxersBrown.jpeg",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "hoodie-black",
    name: "Classic Hoodie - Black",
    description: "The staple hoodie for any occasion.",
    price: "US$85",
    priceNum: 85,
    tag: "Essential",
    collectionId: "hoodies",
    stock: 8,
    lowStockThreshold: 10,
    images: [
      {
        id: "2",
        url: "/collections/hoodies/hoodieBlackMan.jpg",
        isPrimary: true,
      },
    ],
    colors: [
      {
        id: "c4",
        name: "Black",
        hex: "#000000",
        image: "/collections/hoodies/hoodieBlackMan.jpg",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "bold-cap-black",
    name: "Bold Society Cap - Black",
    description: "Statement cap for the unapologetic.",
    price: "US$55",
    priceNum: 55,
    tag: "Limited",
    collectionId: "headwear",
    stock: 5,
    lowStockThreshold: 10,
    images: [
      {
        id: "3",
        url: "/collections/headwear/boldSocietyCapBlack.jpg",
        isPrimary: true,
      },
    ],
    colors: [
      {
        id: "c5",
        name: "Black",
        hex: "#000000",
        image: "/collections/headwear/boldSocietyCapBlack.jpg",
      },
      {
        id: "c6",
        name: "Cream",
        hex: "#F5F5DC",
        image: "/collections/headwear/boldSocietyCapCream.jpg",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "outlaw-glasses",
    name: "Outlaw Shades",
    description: "Shield your eyes in style.",
    price: "US$75",
    priceNum: 75,
    tag: "Signature",
    collectionId: "sunglasses",
    stock: 22,
    lowStockThreshold: 15,
    images: [
      {
        id: "4",
        url: "/collections/glases/outlawGlasses1.jpg",
        isPrimary: true,
      },
    ],
    colors: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "track-set",
    name: "Movement Track Set",
    description: "Move with intention in the movement set.",
    price: "US$95",
    priceNum: 95,
    tag: "Essential",
    collectionId: "tracks",
    stock: 3,
    lowStockThreshold: 10,
    images: [
      { id: "5", url: "/collections/tracks/track.jpg", isPrimary: true },
    ],
    colors: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

export const getProducts = (params: {
  collectionId?: string;
  q?: string;
  page?: number;
}): Promise<Paginated<Product>> => {
  // TODO: remove mock
  let data = MOCK_PRODUCTS;
  if (params.collectionId)
    data = data.filter((p) => p.collectionId === params.collectionId);
  if (params.q) {
    const q = params.q.toLowerCase();
    data = data.filter((p) => p.name.toLowerCase().includes(q));
  }
  return Promise.resolve({ data, total: data.length, page: 1, totalPages: 1 });
  // return apiFetch<Paginated<Product>>(`/products?${new URLSearchParams(params as Record<string, string>)}`);
};

export const getProduct = (id: string): Promise<Product> => {
  // TODO: remove mock
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!product) return Promise.reject(new Error("Not found"));
  return Promise.resolve(product);
};

export const createProduct = (
  body: Omit<Product, "id" | "createdAt" | "updatedAt">,
) =>
  apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateProduct = (id: string, body: Partial<Product>) =>
  apiFetch<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteProduct = (id: string) =>
  apiFetch<void>(`/products/${id}`, { method: "DELETE" });

export const updateProductStock = (id: string, stock: number) =>
  apiFetch<void>(`/products/${id}/stock`, {
    method: "PATCH",
    body: JSON.stringify({ stock }),
  });
