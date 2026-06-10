# Unapologetic Admin Dashboard

Staff CMS for the Unapologetic streetwear brand. Separate from the customer storefront.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Runs on [http://localhost:3001](http://localhost:3001).

## Source of truth

**Storefront catalog wins** on any conflict. See `AGENTS.md` and `docs/README.md`.

## Catalog sync

Product and collection seed data is synced from the storefront repo:

```bash
npm run sync-catalog
```

This writes `lib/data/catalog-seed.json` (7 collections, 38 products). See `docs/catalog-field-mapping.md` for how admin shapes map to the storefront.

## Mock mode (default)

With `NEXT_PUBLIC_USE_MOCK_API=true`, all API calls use an in-memory backend seeded from `lib/data/seed.ts`. No backend required for local development.

**Sign in:** use a seeded admin email (e.g. `admin@unapologetic.store`) and any 6-digit OTP.

## Real API

Set `NEXT_PUBLIC_USE_MOCK_API=false` and point `NEXT_PUBLIC_API_URL` at the backend. See `docs/backend-api-spec.json` for the full contract.

## Pages

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard KPIs and charts |
| `/admin/orders` | Order management |
| `/admin/customers` | Customer CRM |
| `/admin/products` | Product catalog with variants |
| `/admin/collections` | Collection management |
| `/admin/announcements` | Storefront banner bar |
| `/admin/inner-circle` | Membership applications |
| `/admin/reviews` | Review moderation |
| `/admin/analytics` | Sales analytics |
| `/admin/settings` | Store settings and admin users |

## Build

```bash
npm run build
```
