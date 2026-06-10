/**
 * Sync catalog seed from the storefront repo.
 * Run: npx tsx scripts/sync-catalog-seed.ts
 *
 * Requires storefront at ../unapologetic (or STOREFRONT_PATH env).
 */

import * as fs from "fs";
import * as path from "path";
import {
  catalogCollectionToAdmin,
  catalogProductToAdmin,
} from "../lib/catalog/convert";

const STOREFRONT =
  process.env.STOREFRONT_PATH ??
  path.resolve(__dirname, "../../unapologetic");

async function main() {
  const catalogPath = path.join(STOREFRONT, "lib/data/catalog.ts");
  if (!fs.existsSync(catalogPath)) {
    console.error(`Storefront catalog not found at ${catalogPath}`);
    process.exit(1);
  }

  // Dynamic import storefront catalog (tsx resolves TS)
  const mod = await import(path.join(STOREFRONT, "lib/data/catalog.ts"));
  const { COLLECTION_META, CATALOG_PRODUCTS } = mod as {
    COLLECTION_META: import("../lib/catalog/convert").CatalogSourceCollection[];
    CATALOG_PRODUCTS: import("../lib/catalog/convert").CatalogSourceProduct[];
  };

  const baseDate = new Date("2026-05-23T10:00:00Z").getTime();
  const days = (n: number) =>
    new Date(baseDate - n * 86400000).toISOString();

  const collections = COLLECTION_META.map((c, i) =>
    catalogCollectionToAdmin(c, i + 1, {
      createdAt: days(120 - i * 10),
      updatedAt: days(5),
    }),
  );

  const products = CATALOG_PRODUCTS.map((p, i) =>
    catalogProductToAdmin(p, {
      createdAt: days(90 - i),
      updatedAt: days(3),
    }),
  );

  const out = {
    syncedAt: new Date().toISOString(),
    storefrontPath: STOREFRONT,
    collections,
    products,
    meta: {
      collectionCount: collections.length,
      productCount: products.length,
    },
  };

  const outPath = path.join(__dirname, "../lib/data/catalog-seed.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(
    `Wrote ${out.meta.collectionCount} collections, ${out.meta.productCount} products → ${outPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
