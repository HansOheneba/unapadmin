<!-- AGENTS.md — Copilot reads this automatically -->

# Unapologetic Admin Dashboard — Build Brief

## What you are building

A standalone **frontend-only** Next.js admin dashboard for the **Unapologetic** streetwear brand.
This is a **separate project** from the storefront. It talks to a REST API that will be supplied
by the backend team. Your job is to build every page, component, and hook — wired to real API
service functions that accept a base URL from the environment. Use **mock/placeholder data** for
any endpoint that does not exist yet so every screen is fully renderable on day one.

Before writing any code, read `node_modules/next/dist/docs/` for current Next.js API conventions.

---

## Public Assets

Copy the entire `/public` folder from the storefront project into this project.
All product images, logos, hero videos, and favicons live there. The full tree is:

```
public/
  logos/
    unap_logo_black.png      ← use in sidebar (on white bg)
    unap_logo_white.png      ← use on dark/black bg
    unapologeticBlack.png
    unapologeticWhite.png
  favicon/                   ← all favicon files + site.webmanifest
  collections/
    boxers/                  ← boxersWhite.jpeg, boxersBlue.jpg, boxersBrown.jpeg,
    │                           boxersGray.jpg, boxersCream.jpeg, boxersBlackWhite.jpeg,
    │                           boxersMixed.jpeg, boxersSizeChart.jpg, boxModel.jpg,
    │                           + *2 variant images for each color
    female_shirts/           ← shirtBrown.jpeg, shirtCream.jpeg
    female_undergarments/    ← lingerie.jpeg
    glases/                  ← outlawGlasses1.jpg, outlawGlasses3.jpg, outlawGlases4.jpg,
    │                           outlawGlasses5.jpg, shadesFemale.jpg–shadesFemale4.jpg
    headwear/                ← boldSocietyCapBlack/Cream/Red (+ numbered variants),
    │                           suedeCapBlack.jpg + suedeCapBlack2.jpeg,
    │                           beanie.jpg, beanieRed.jpg, beanieRed2.jpg
    hoodies/                 ← hoodieBlackMan.jpg, hoodieColors.jpg, hoodieManXMan.jpg
    men_shirt/               ← shirtCollection.jpeg
    tracks/                  ← track.jpg, track2.jpg
  creed/
    creed.jpg
  hero/
    hero_vid1.mp4, hero_vid2.mp4, hero_vid3.mp4
  home/
    beanieRed.jpg, boxModel.jpg, hoodieBlackMan.jpg, manBeach.jpg,
    manBlackCap.jpg, manStudio.jpg, manXmanModels.jpg, shadesMan.jpg,
    track.jpg, womanXman.jpg
```

Use these images everywhere — product thumbnails, banners, hero previews, collection covers.

---

## Tech Stack

| Layer           | Choice                                                                |
| --------------- | --------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, TypeScript) *latest                           |
| Styling         | Tailwind CSS v4 + **shadcn/ui**                                       |
| Server state    | **React Query v5** (`@tanstack/react-query`)                          |
| Forms           | **React Hook Form** + **Zod**                                         |
| Charts          | **Recharts**                                                          |
| CSV export      | **papaparse**                                                         |
| Date formatting | **date-fns**                                                          |
| Auth (frontend) | **NextAuth v5** — credentials provider against `POST /api/auth/login` |
| Drag-to-reorder | **@dnd-kit/core**                                                     |
| Notifications   | **sonner** (toast library)                                            |

---

## Visual Design

- **Sidebar:** always `bg-black` with white logo (`unap_logo_white.png`) and white nav text.
- **Topbar:** `bg-white border-b border-zinc-100`.
- **Page backgrounds:** `bg-zinc-50`.
- **Cards / panels:** `bg-white border border-zinc-100 rounded-lg`.
- **Primary buttons:** black fill, white text. Secondary: zinc outline.
- **Tables:** shadcn `<Table>` with `hover:bg-zinc-50` rows.
- **Inputs:** `bg-white border border-zinc-200 focus:border-zinc-400` — no glow rings.
- **Typography:** `Space Grotesk` (import from Google Fonts) for headings; system sans for body.
- **Status badges:** pill shape, color-coded per status (see Orders section).
- Never use em dashes (—) in any UI text. Use a period or restructure.

---

## Role-Based Access

Four roles. Gate UI elements (hide buttons, disable routes) based on the role stored in the
NextAuth session. The backend enforces the real permissions — this is frontend gating only.

| Role          | Access                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| `SUPER_ADMIN` | Everything including Settings, user management, affiliate payouts        |
| `MANAGER`     | Everything except creating/deleting admin users                          |
| `EDITOR`      | Collections, Products, Banners, Discounts. Read-only on Orders/Customers |
| `VIEWER`      | Read-only across the board. No create/edit/delete                        |

Create a `lib/permissions.ts` file that exports a `can(role, action)` helper used throughout the UI.

---

## Project Structure

```
app/
  (auth)/
    login/page.tsx
  (dashboard)/
    layout.tsx              ← sidebar + topbar, requires session
    page.tsx                ← redirect to /dashboard
    dashboard/page.tsx      ← KPI cards + charts
    collections/
      page.tsx
      new/page.tsx
      [id]/page.tsx         ← edit collection + products list
    products/
      page.tsx
      new/page.tsx
      [id]/page.tsx
    orders/
      page.tsx
      [id]/page.tsx
    customers/
      page.tsx
      [id]/page.tsx
    inventory/page.tsx      ← stock levels + low-stock alerts
    discounts/
      page.tsx
      new/page.tsx
      [id]/page.tsx
    banners/
      page.tsx
      new/page.tsx
      [id]/page.tsx
    affiliates/
      page.tsx
      [id]/page.tsx         ← affiliate detail + payout history
    returns/
      page.tsx
      [id]/page.tsx
    deliveries/
      page.tsx
      [id]/page.tsx
    analytics/page.tsx
    settings/page.tsx

components/
  layout/
    sidebar.tsx
    topbar.tsx
    breadcrumb.tsx
  ui/                       ← shadcn components
  shared/
    status-badge.tsx        ← reusable colored pill
    data-table.tsx          ← wrapped shadcn table with sort/filter
    csv-export-button.tsx
    confirm-dialog.tsx
    image-picker.tsx        ← pick from existing /public assets OR paste URL

lib/
  api/                      ← one file per domain, all fetch calls live here
    client.ts               ← base fetch wrapper (adds auth header, handles errors)
    collections.ts
    products.ts
    orders.ts
    customers.ts
    inventory.ts
    discounts.ts
    banners.ts
    affiliates.ts
    returns.ts
    deliveries.ts
    analytics.ts
    auth.ts
  hooks/                    ← React Query hooks (useCollections, useOrders, etc.)
  permissions.ts
  utils.ts

types/
  index.ts                  ← all TypeScript types (see section below)
```

---

## TypeScript Types

> These are the shapes the frontend expects from the API. Share this section with the backend team.

```ts
// types/index.ts

export type AdminRole = "SUPER_ADMIN" | "MANAGER" | "EDITOR" | "VIEWER";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  totalOrders: number;
  totalSpent: number; // in cents or float — agree with backend
  createdAt: string;
};

export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  image: string | null; // variant image shown when this color is selected
};

export type ProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

export type Product = {
  id: string; // e.g. "boxers-1"
  name: string;
  description: string;
  price: string; // display "US$45"
  priceNum: number;
  tag: string; // "Signature" | "Limited" | "Essential" etc.
  collectionId: string;
  stock: number; // current inventory count
  lowStockThreshold: number; // alert when stock <= this
  images: ProductImage[];
  colors: ProductColor[];
  createdAt: string;
  updatedAt: string;
};

export type Collection = {
  id: string; // slug e.g. "sunglasses"
  subtitle: string; // "Sunglasses"
  title: string; // "The Eclipse Edit"
  tagline: string;
  featured: string; // cover image URL/path
  href: string; // "/collections/sunglasses"
  sortOrder: number; // controls display order on storefront
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type OrderItem = {
  id: string;
  productId: string | null;
  productName: string; // snapshot
  productImage: string; // snapshot
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
};

export type Order = {
  id: string;
  orderNumber: string; // "UNP-00042"
  customer: Pick<Customer, "id" | "name" | "email"> | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: "momo" | "card" | "cash" | null;
  paymentRef: string | null;
  status: OrderStatus;
  notes: string | null;
  items: OrderItem[];
  statusHistory: { status: OrderStatus; at: string; by: string }[];
  createdAt: string;
  updatedAt: string;
};

export type DiscountType = "PERCENTAGE" | "FIXED";

export type Discount = {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // 20 = 20% or $20
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type BannerPosition =
  | "HOME_HERO"
  | "COLLECTIONS_TOP"
  | "PRODUCT_SIDEBAR"
  | "ANNOUNCEMENT_BAR";

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  imageUrl: string;
  position: BannerPosition;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
};

export type Affiliate = {
  id: string;
  name: string;
  email: string;
  code: string; // promo code tied to this affiliate
  commissionRate: number; // e.g. 0.1 = 10%
  totalReferrals: number;
  totalRevenue: number; // revenue they generated
  totalOwed: number; // unpaid commissions
  totalPaid: number;
  active: boolean;
  createdAt: string;
};

export type AffiliatePayout = {
  id: string;
  affiliateId: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
};

export type ReturnReason =
  | "WRONG_SIZE"
  | "WRONG_ITEM"
  | "DAMAGED"
  | "NOT_AS_DESCRIBED"
  | "CHANGED_MIND"
  | "OTHER";

export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";

export type Return = {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: Pick<Customer, "id" | "name" | "email">;
  items: OrderItem[];
  reason: ReturnReason;
  notes: string | null;
  status: ReturnStatus;
  refundAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryStatus =
  | "AWAITING_PICKUP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED_TO_SENDER";

export type Delivery = {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: Pick<Customer, "id" | "name" | "email">;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: DeliveryStatus;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  address: string;
  city: string;
  country: string;
  events: { description: string; location: string | null; at: string }[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  totalRevenue: number;
  revenueChange: number; // % vs previous period
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockCount: number;
  openReturns: number;
  revenueChart: { date: string; revenue: number }[]; // last 30 days
  ordersByStatus: { status: OrderStatus; count: number }[];
  topProducts: {
    productId: string;
    name: string;
    image: string;
    unitsSold: number;
    revenue: number;
  }[];
};

// Paginated response wrapper
export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};
```

---

## API Service Layer

All API calls go through `lib/api/client.ts`. Base URL comes from `NEXT_PUBLIC_API_URL`.

```ts
// lib/api/client.ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // NextAuth session token forwarded automatically via cookies in SSR,
      // or attach Bearer token for client-side calls:
      ...options?.headers,
    },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
```

Each domain file (`lib/api/orders.ts`, etc.) exports typed functions:

```ts
export const getOrders = (params: {
  status?: OrderStatus;
  q?: string;
  page?: number;
}) =>
  apiFetch<Paginated<Order>>(`/orders?${new URLSearchParams(params as any)}`);
```

Each React Query hook (`lib/hooks/useOrders.ts`) wraps these:

```ts
export const useOrders = (params) =>
  useQuery({ queryKey: ["orders", params], queryFn: () => getOrders(params) });
```

**When an API endpoint is not ready, return mock data from the service function** and add a
`// TODO: remove mock` comment. Never leave a page blank or broken.

---

## REST Endpoints (tell the backend team to implement these)

```
# Auth
POST   /auth/login                   { email, password } → { token, user: AdminUser }
POST   /auth/logout
GET    /auth/me                      → AdminUser

# Dashboard
GET    /dashboard/stats              → DashboardStats

# Collections
GET    /collections                  → Collection[]
POST   /collections                  body: Omit<Collection, "id"|"productCount"|"createdAt"|"updatedAt">
PATCH  /collections/:id
DELETE /collections/:id
PATCH  /collections/reorder          body: { ids: string[] }   ← updates sortOrder

# Products
GET    /products                     ?collectionId= &q= &page= → Paginated<Product>
POST   /products
PATCH  /products/:id
DELETE /products/:id
POST   /products/:id/images          body: { url: string; isPrimary: boolean }
DELETE /products/:id/images/:imageId
PATCH  /products/:id/images/:imageId/primary
POST   /products/:id/colors
DELETE /products/:id/colors/:colorId
PATCH  /products/:id/stock           body: { stock: number }

# Orders
GET    /orders                       ?status= &q= &page= → Paginated<Order>
GET    /orders/:id                   → Order
PATCH  /orders/:id/status            body: { status: OrderStatus }
PATCH  /orders/:id/notes             body: { notes: string }
POST   /orders                       (manual order creation)
GET    /orders/export/csv            ?status= &from= &to= → CSV file

# Customers
GET    /customers                    ?q= &page= → Paginated<Customer>
GET    /customers/:id                → Customer & { orders: Order[] }
PATCH  /customers/:id

# Inventory
GET    /inventory                    → Product[] sorted by stock asc, include lowStock flag
PATCH  /inventory/:productId         body: { stock: number; lowStockThreshold: number }

# Discounts
GET    /discounts                    → Discount[]
POST   /discounts
PATCH  /discounts/:id
DELETE /discounts/:id

# Banners
GET    /banners                      → Banner[]
POST   /banners
PATCH  /banners/:id
DELETE /banners/:id
PATCH  /banners/reorder              body: { ids: string[] }

# Affiliates
GET    /affiliates                   → Affiliate[]
GET    /affiliates/:id               → Affiliate & { payouts: AffiliatePayout[] }
POST   /affiliates
PATCH  /affiliates/:id
POST   /affiliates/:id/payouts       body: { amount, method, reference? }

# Returns
GET    /returns                      ?status= &page= → Paginated<Return>
GET    /returns/:id                  → Return
PATCH  /returns/:id/status           body: { status: ReturnStatus; refundAmount?: number }

# Deliveries
GET    /deliveries                   ?status= &q= &page= → Paginated<Delivery>
GET    /deliveries/:id               → Delivery
PATCH  /deliveries/:id               body: { carrier?, trackingNumber?, trackingUrl?, status?, estimatedDelivery? }

# Analytics
GET    /analytics                    ?from= &to= → extended analytics beyond DashboardStats
GET    /analytics/export/csv         ?from= &to= → CSV

# Settings
GET    /settings                     → { storeName, contactEmail, currency, defaultCountry }
PATCH  /settings
GET    /admin-users                  → AdminUser[]
POST   /admin-users                  body: { name, email, role }
PATCH  /admin-users/:id              body: { role }
DELETE /admin-users/:id
```

---

## Pages — Detailed Requirements

### Sidebar Navigation

```
[unap_logo_white.png]
──────────────────────
  Dashboard
  Collections
  Products
  Inventory           ← red badge if any low-stock items
  Orders              ← yellow badge: pending count
  Customers
  Deliveries
  Returns             ← badge: open count
──────────────────────
  Discounts
  Banners
  Affiliates
──────────────────────
  Analytics
  Settings
──────────────────────
  ← Back to Storefront  (opens storefront URL in new tab)
  [Avatar] Name · Role
```

---

### `/dashboard` — Overview

- 6 KPI cards: **Total Revenue**, **Orders**, **Customers**, **Pending Orders**, **Low Stock Items**, **Open Returns**
  - Each card shows current value, % change vs prior 30 days (green up / red down arrow)
- **Revenue line chart** (last 30 days) — Recharts `<LineChart>`
- **Orders by status** — Recharts `<PieChart>`
- **Top 5 products** table — image, name, units sold, revenue
- **Recent orders** table (last 10) — order number, customer, date, total, status badge

---

### `/collections` — Collections

- Card grid: cover image (from `/public/collections/`), title, subtitle, product count
- Drag-to-reorder cards with `@dnd-kit` — saves new `sortOrder` via `PATCH /collections/reorder`
- Note under the grid: "Order controls the left/right hero alternation on the storefront. Even position = hero text left. Odd = right."
- "New Collection" button (EDITOR+)
- Inline delete with `<ConfirmDialog>` (MANAGER+)

### `/collections/[id]` — Edit Collection

- Form: subtitle, title, tagline, cover image (URL input + preview — use images from `/public/collections/`)
- Products table below with thumbnail, name, price, stock badge, edit/delete links
- "Add Product" → `/products/new?collectionId=[id]`

---

### `/products` — Products

- Searchable data table, filterable by collection
- Columns: image, name, collection, price, tag, stock (red if low), actions
- Bulk delete (MANAGER+)
- Export CSV button → calls `GET /orders/export/csv`

### `/products/[id]` — Edit Product

- Form: name, description, price (display string + numeric), tag, collectionId
- **Image gallery**: paste URL or pick from `/public` asset browser (a modal that shows all images currently in `/public/collections/`). Set primary, remove.
- **Color swatches**: add (name + hex color picker + optional variant image URL). Remove.
- **Stock field**: current count + low-stock threshold input
- Danger zone: delete product (MANAGER+)

---

### `/orders` — Orders

- Status filter tabs: All / Pending / Confirmed / Processing / Shipped / Delivered / Cancelled / Refunded
- Search by order number, customer name, email
- Columns: order#, customer, date, items, total, payment method, status badge, actions
- Export CSV (filtered result) via `GET /orders/export/csv`
- Pagination: 20/page

**Status badge colors:**

```
PENDING      → yellow
CONFIRMED    → blue
PROCESSING   → indigo
SHIPPED      → purple
DELIVERED    → green
CANCELLED    → red
REFUNDED     → zinc
```

### `/orders/[id]` — Order Detail

- Customer card (name, email, phone, address, country)
- Line items table (product image, name, color, size, qty, unit price, line total)
- Order summary (subtotal, shipping, total, payment method + ref)
- **Status update** — dropdown + "Update Status" button with `<ConfirmDialog>`
- **Internal notes** — textarea, auto-saves on blur
- **Status timeline** — vertical stepper built from `statusHistory[]`

---

### `/customers` — Customers

- Searchable table: name, email, country, orders, lifetime value, joined
- Click row → customer detail

### `/customers/[id]` — Customer Detail

- Profile card
- Stats: total orders, lifetime value, average order value
- Order history table (links to `/orders/[id]`)

---

### `/inventory` — Stock Management

- Table of all products sorted by stock level ascending
- Red "LOW" badge when `stock <= lowStockThreshold`
- Inline stock edit — click the number, type new value, press Enter → `PATCH /inventory/:id`
- Summary bar: "X products low on stock" — click to filter to only low-stock
- Export stock CSV

---

### `/discounts` — Discount Codes

- Table: code, type, value, uses / max uses, active toggle, expires, actions
- "New Discount" → form: code, type (%), value, min order, max uses, expiry date
- Toggle active inline
- Delete (MANAGER+)

---

### `/banners` — Content Banners

- List view: banner image preview, title, position, active toggle, date range, sort handle
- Drag-to-reorder within each position group
- Create/edit: title, subtitle, CTA text + URL, image URL (picker from `/public`), position select, schedule (start/end dates)
- **Positions**: Home Hero, Collections Top, Product Sidebar, Announcement Bar

---

### `/affiliates` — Affiliate Program

- Table: name, code, commission rate, referrals, revenue generated, owed, paid, status
- "Add Affiliate" form: name, email, promo code, commission %
- `/affiliates/[id]`: profile + payout history table + "Record Payout" button (MANAGER+)
  - Payout form: amount, method (bank / momo / paypal), reference

---

### `/returns` — Returns & Refunds

- Status tabs: All / Requested / Approved / Rejected / Received / Refunded
- Table: return ID, order#, customer, reason, items count, requested date, status
- `/returns/[id]`: items being returned, reason + notes, approve/reject buttons, refund amount input

---

### `/deliveries` — Deliveries

- Status tabs: All / Awaiting Pickup / In Transit / Out for Delivery / Delivered / Failed
- Table: order#, customer, carrier, tracking#, estimated delivery, status, last update
- `/deliveries/[id]`: full delivery card with tracking events timeline (vertical), edit carrier/tracking fields

---

### `/analytics` — Analytics

- Date range picker (default: last 30 days)
- Revenue over time — line chart
- Orders over time — bar chart
- Sales by collection — bar chart (which collection generates most revenue)
- Sales by country — bar chart
- New vs returning customers — pie chart
- Top products table
- Export full report as CSV

---

### `/settings`

- Store info section: name, contact email, currency, default country
- Admin users table (SUPER_ADMIN only): name, email, role badge, created date, remove button
- "Invite Admin" button: name, email, role → creates user, backend sends invite email

---

## Auth Setup

1. `app/(auth)/login/page.tsx` — email + password form. On submit calls `POST /auth/login`.
   Store token in cookie via NextAuth. Show error toast on failure.
2. `lib/auth.ts` — NextAuth v5 `CredentialsProvider`. On `authorize`, POST to `NEXT_PUBLIC_API_URL/auth/login`.
   Store `{ id, name, email, role, token }` in the JWT.
3. `middleware.ts` — protect all routes except `/(auth)/**`. Redirect to `/login` if no session.
4. After login → redirect to `/dashboard`.

---

## Shared Components

### `<StatusBadge status={} />`

Renders a colored pill. Accepts `OrderStatus | ReturnStatus | DeliveryStatus`.

### `<DataTable />`

Wrapped shadcn table. Props: `columns`, `data`, `isLoading` (shows skeleton rows), `onRowClick`.

### `<CsvExportButton url="/orders/export/csv" params={filters} filename="orders.csv" />`

Fetches the CSV endpoint and triggers browser download.

### `<ConfirmDialog trigger={} title="" description="" onConfirm={} />`

Used before any destructive action.

### `<ImagePicker onSelect={(url) => {}} />`

Modal with two tabs:

- **From Library** — grid of all images from `/public/collections/`, `/public/home/`, `/public/creed/`
- **Paste URL** — text input for external URLs

---

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:4000   # Backend REST API base URL
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=http://localhost:3001
```

Run the admin on port 3001 to avoid conflict with the storefront (port 3000):

```json
// package.json
"dev": "next dev -p 3001"
```

---

## Getting Started

```bash
npx create-next-app@latest unapologetic-admin --typescript --tailwind --app
cd unapologetic-admin

# Install dependencies
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers \
  recharts papaparse date-fns sonner @dnd-kit/core @dnd-kit/sortable \
  next-auth@beta

# Install shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input label select table badge card dialog \
  dropdown-menu tabs skeleton tooltip popover calendar

# Copy assets from storefront
cp -r ../unapologetic/public ./public

cp .env.example .env   # fill in vars
npm run dev            # starts on :3001
```

Read `node_modules/next/dist/docs/` before writing code — this is Next.js 15 with breaking changes.
