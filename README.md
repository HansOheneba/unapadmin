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
| `/admin/reviews` | Review moderation |
| `/admin/analytics` | Sales analytics |
| `/admin/settings` | Store settings and admin users |

## Build

```bash
npm run build
```

## cPanel (Node.js Selector)

Deploy on a **subdomain root** (e.g. `admin.example.com`). Requires Node.js Selector / Passenger — not plain PHP hosting.

1. Create a Node.js app in Selector: **Node 20+**, Application startup file **`server.js`**, Application root = this project.
2. Upload or clone the repo into the application root.
3. Set Environment Variables in Selector (then rebuild so `NEXT_PUBLIC_*` are baked in):
   - `NEXT_PUBLIC_API_URL` — backend origin
   - `NEXT_PUBLIC_USE_MOCK_API=false` — required in production
   - `NEXT_PUBLIC_RIDER_APP_URL` — rider app URL if used
4. Install and build:

```bash
npm ci
npm run build
```

5. Restart the Node app in Selector (`npm start` runs `node server.js`).

Optional lean artifact after build:

```bash
npm run prepare-cpanel
```

That copies `.next/static`, `public`, and `server.js` into `.next/standalone`. The default Selector layout still uses the project-root `server.js`.
