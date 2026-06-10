# Unapologetic Admin Dashboard

Standalone Next.js admin for **Unapologetic**. Separate from the customer storefront.

## Source of truth (read in this order)

| Priority | What | Where |
|----------|------|--------|
| 1 | **Storefront catalog** (7 collections, 38 products, variant shapes) | Storefront repo: `lib/data/catalog.ts`, `lib/products.ts` |
| 2 | **Handoff exports** (synced from storefront) | `docs/catalog-snapshot.json`, `docs/catalog-field-mapping.md`, `docs/storefront-catalog-types.ts` |
| 3 | **This app's seed** (generated from storefront) | `lib/data/catalog-seed.json` via `npm run sync-catalog` |
| 4 | Admin-only domains (orders, customers, riders, etc.) | `docs/backend-api-spec.json` for ops endpoints. Catalog sections there are **deprecated** if they conflict with (1). |

When anything conflicts with the storefront catalog, **the storefront wins**. Remove or update the admin side.

Storefront repo path: `/Users/hansopoku/Desktop/code/unapologetic`

## Architecture

| Project | Role |
|---------|------|
| **Storefront** | Customer shopping. Reads published catalog. `POST /orders`. |
| **This app** | Staff CMS + order ops. Calls backend REST API. |
| **Backend** | Auth, catalog, orders, Paystack (backend only). |

No Paystack keys in this project. `NEXT_PUBLIC_API_URL` only.

## Catalog (storefront shape)

**Collections (7):** `underwear`, `tops`, `bottoms`, `tracksuits`, `active-wear`, `sunglasses`, `accessories`

**Product fields (required):** `slug`, `name`, `description`, `price` (GHS integer), `gender`, `collectionId`, `variants[]`, `details[]`, `careInstructions[]`, `isActive`

**Variant:** `id`, `colorName`, `colorHex`, `images[]` (API may use `imageUrls[]`), `sizes[]` with `{ size, stock }`

**Checkout line item:** `{ productId, variantId, size, quantity }`

Refresh seed after storefront catalog changes:

```bash
npm run sync-catalog
```

## Tech stack

- Next.js 16 (App Router), TypeScript, Tailwind v4
- React Query v5, React Hook Form + Zod, Recharts, sonner
- OTP auth (mock or `POST /auth/send-otp`, `POST /auth/verify-otp`)
- Mock API fallback: `NEXT_PUBLIC_USE_MOCK_API=true` (default)

## Design

- Sidebar: `bg-black`, white logo (`/logos/unapologeticWhite.png`)
- Content: `bg-zinc-50`, cards `bg-white border-zinc-200`
- Primary CTA: black button. No em dashes in UI copy.

## Pages (built)

`/admin` dashboard · orders · customers · products · collections · riders · announcements · inner circle · reviews · analytics · settings

## Rider PWA — U Rider (separate project)

Accra in-house delivery (`deliveryType: accra_inhouse`). All prices in **cedis (₵)**. Sequential flow: `processing` → admin marks `ready_for_pickup` → assign rider → rider drives `picked_up` → `in_transit` → `delivered` or `returned` (admin confirms return). No partner carriers.

| Doc | Purpose |
|-----|---------|
| `docs/RIDER_AGENTS.md` | Full U Rider build brief (copy to `unap-rider` as `AGENTS.md`) |
| `docs/RIDER_INTEGRATION.md` | Admin ↔ rider ↔ API alignment |

Env: `NEXT_PUBLIC_RIDER_APP_URL=http://localhost:3002`

## Roles

`super_admin` · `admin` · `viewer` — see `lib/permissions.ts`

## Build

```bash
npm run build
```

Read `node_modules/next/dist/docs/` for current Next.js APIs.
