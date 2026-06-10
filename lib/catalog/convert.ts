/**
 * Converts storefront catalog source records into admin API product shape.
 * Mirrors lib/products.ts toVariants() in the storefront repo.
 */

import type { ColorVariant, Product, SizeStock } from "@/types";

export type CatalogSourceProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  gender: "male" | "female";
  collectionId: string;
  images: string[];
  colors?: { name: string; hex: string; image?: string }[];
  sizes?: string[];
  tag: string;
  details: string[];
  careInstructions: string[];
};

export type CatalogSourceCollection = {
  id: string;
  subtitle: string;
  title: string;
  tagline: string;
  featured: string;
  href: string;
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function defaultStock(sizes: string[]): SizeStock[] {
  return sizes.map((size, i) => ({
    size,
    stock: Math.max(4, 18 - i * 3),
  }));
}

export function toVariants(catalog: CatalogSourceProduct): ColorVariant[] {
  const sizes = catalog.sizes ?? ["One Size"];
  const images = catalog.images;

  if (catalog.colors && catalog.colors.length > 0) {
    return catalog.colors.map((color) => ({
      id: slugify(color.name),
      colorName: color.name,
      colorHex: color.hex,
      images: color.image ? [color.image, ...images] : images,
      sizes: defaultStock(sizes),
    }));
  }

  return [
    {
      id: "default",
      colorName: "Default",
      colorHex: "#1a1a1a",
      images,
      sizes: defaultStock(sizes),
    },
  ];
}

export function computeTotalStock(variants: ColorVariant[]): number {
  return variants.reduce(
    (s, v) => s + v.sizes.reduce((ss, sz) => ss + sz.stock, 0),
    0,
  );
}

export function catalogProductToAdmin(
  catalog: CatalogSourceProduct,
  timestamps: { createdAt: string; updatedAt: string },
): Product {
  const variants = toVariants(catalog);
  return {
    id: catalog.id,
    slug: catalog.slug,
    name: catalog.name,
    description: catalog.description,
    price: catalog.price,
    gender: catalog.gender,
    collectionId: catalog.collectionId,
    variants,
    details: catalog.details,
    careInstructions: catalog.careInstructions,
    isActive: true,
    totalStock: computeTotalStock(variants),
    totalSold: 0,
    averageRating: 0,
    reviewCount: 0,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  };
}

export function catalogCollectionToAdmin(
  meta: CatalogSourceCollection,
  sortOrder: number,
  timestamps: { createdAt: string; updatedAt: string },
): import("@/types").Collection {
  return {
    id: meta.id,
    subtitle: meta.subtitle,
    title: meta.title,
    tagline: meta.tagline,
    featured: meta.featured,
    href: meta.href,
    isActive: true,
    sortOrder,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  };
}
