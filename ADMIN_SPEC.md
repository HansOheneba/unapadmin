# Unapologetic Admin - CRM & Order Management System

## Specification Document for Frontend Build

> All UI, data shapes, and page structures are defined here.
> The only work left after this frontend is built is wiring up the real backend REST API endpoints.
> Every section that mentions "API endpoint" is a placeholder — the backend team will supply the real URLs.

---

## 1. Tech Stack

- **Framework:** Next.js (latest)
- **Styling:** Tailwind CSS v4
- **State:** Zustand (with `persist` + `devtools`)
- **Tables:** TanStack Table v8
- **Charts:** Recharts
- **Date handling:** date-fns
- **Icons:** lucide-react
- **Toast notifications:** custom (reuse pattern from storefront)
- **Auth guard:** all `/admin/*` routes require an authenticated admin session(leave out for development and testing)

---

## 2. Admin Layout

```
/admin
  layout.tsx          ← shared sidebar + topbar shell
  page.tsx            ← Dashboard
  /orders
    page.tsx          ← Orders list
    /[id]/page.tsx    ← Order detail
  /customers
    page.tsx          ← Customer list
    /[id]/page.tsx    ← Customer profile (CRM)
  /products
    page.tsx          ← Products list (all, filterable by collection)
    /new/page.tsx     ← Create product
    /[id]/page.tsx    ← Edit product
  /collections
    page.tsx          ← Collections list
    /new/page.tsx     ← Create collection
    /[id]/page.tsx    ← Edit collection
  /announcements
    page.tsx          ← Banner message manager
  /inner-circle
    page.tsx          ← Inner Circle applicants + members
  /reviews
    page.tsx          ← Product review moderation
  /analytics
    page.tsx          ← Sales + traffic charts
  /settings
    page.tsx          ← Store settings
```

### 2.1 Sidebar Navigation

```
Logo (Unapologetic Admin)
─────────────────────────
Overview
  Dashboard

Commerce
  Orders
  Customers
  Products
  Collections

Marketing
  Announcements
  Inner Circle

Content
  Reviews

Insights
  Analytics

System
  Settings
```

### 2.2 Top Bar

- Store name + environment badge (LIVE / STAGING)
- Global search (customers, orders, products by keyword)
- Admin user avatar + sign-out

---

## 3. Data Models

### 3.1 User / Customer

```typescript
interface Customer {
  id: string; // "usr_001"
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // stored without country code
  whatsapp: string;
  country: string; // "Ghana" | "Nigeria"
  region: string; // state / region
  city: string;
  address: string;
  landmark: string;
  birthDay: string; // "12"
  birthMonth: string; // "06" (zero-padded)
  birthYear: string; // "1996"
  topSize: string; // "XS" | "S" | "M" | "L" | "XL" | "XXL"
  bottomSize: string;
  addresses: CustomerAddress[];
  status: "active" | "suspended" | "unverified";
  tags: string[]; // e.g. ["VIP", "Inner Circle"]
  notes: string; // internal CRM note
  joinedDate: string; // ISO date
  lastOrderDate: string | null; // ISO date
  totalOrders: number;
  totalSpend: number; // raw number in local currency
  currency: "GHS" | "NGN";
  innerCircle: boolean;
  wishlist: string[]; // product slugs
  createdAt: string; // ISO timestamp
  updatedAt: string;
}
```

### 3.2 Customer Address

```typescript
interface CustomerAddress {
  id: string;
  label: string; // "Home" | "Office" | custom
  firstName: string;
  lastName: string;
  email: string;
  country: string; // "Ghana" | "Nigeria"
  region: string; // region (GH) or state (NG)
  city: string;
  district: string; // district (GH) or LGA (NG)
  address: string; // street line 1
  address2: string; // apartment / suite (optional)
  phone: string; // local number without country code
  postcode: string;
  whatsapp: string;
  isDefault: boolean;
}
```

### 3.3 Order

```typescript
interface Order {
  id: string; // "ORD-2026-0052"
  trackingNumber: string; // "UNAP-000007"
  customerId: string;
  customerName: string; // denormalized for display
  customerEmail: string;
  customerPhone: string;
  shippingAddress: CustomerAddress;
  billingAddress: CustomerAddress | null; // null = same as shipping
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "momo" | "card" | "cash";
  paymentReference: string | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  discountCode: string | null;
  total: number;
  currency: "GHS" | "NGN";
  notes: string; // internal order notes
  customerNote: string; // note left by customer at checkout
  carrier: string | null; // "DHL Express" etc.
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "exception";

type PaymentStatus =
  | "unpaid"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed";
```

### 3.4 Order Item

```typescript
interface OrderItem {
  productId: string;
  productName: string; // denormalized
  productSlug: string;
  collectionId: string;
  variantId: string;
  colorName: string;
  colorHex: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
}
```

### 3.5 Product

```typescript
interface Product {
  id: string; // "boxers-1"
  slug: string; // "comfortfit-cotton-boxers"
  name: string;
  description: string;
  price: number; // base price
  compareAtPrice: number | null; // for sale/crossed-out price
  category: string; // "boxers" | "tops" | "tracks" | "headwear" | "sunglasses" | "hoodies" | "lingerie"
  tag: string; // "Essential" | "Signature" | "Limited" | "New"
  collectionId: string;
  variants: ColorVariant[];
  details: string[]; // bullet points
  careInstructions: string[];
  isVisible: boolean;
  isFeatured: boolean;
  totalStock: number; // computed across all variants
  totalSold: number;
  averageRating: number; // 0-5
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 3.6 Product Variant (Color)

```typescript
interface ColorVariant {
  id: string; // "boxers-1-black"
  colorName: string; // "Midnight Black"
  colorHex: string; // "#1a1a1a"
  images: string[]; // array of image URLs; first is primary
  sizes: SizeStock[];
}

interface SizeStock {
  size: string; // "XS" | "S" | "M" | "L" | "XL" | "XXL" | "One Size" | "S/M" | "L/XL"
  stock: number; // 0 = out of stock
  sku: string; // stock keeping unit
}
```

### 3.7 Collection

```typescript
interface Collection {
  id: string; // "boxers"
  subtitle: string; // "Boxers"
  title: string; // "The Foundation Edit"
  tagline: string; // short marketing line
  featured: string; // hero/cover image URL
  href: string; // "/collections/boxers"
  isVisible: boolean;
  sortOrder: number; // display order in nav/overview
  products: Product[];
  createdAt: string;
  updatedAt: string;
}
```

### 3.8 Announcement Banner

```typescript
interface BannerMessage {
  id: string;
  text: string; // "Free shipping over GHS 500"
  href: string; // "/collections"
  isActive: boolean;
  startsAt: string | null; // ISO timestamp — null = always active
  endsAt: string | null; // ISO timestamp — null = no expiry
  sortOrder: number; // rotation order
  createdAt: string;
  updatedAt: string;
}

interface BannerConfig {
  isEnabled: boolean; // master on/off for the entire banner
  rotationIntervalMs: number; // default 10000 (10 seconds)
  backgroundColor: string; // default "#18181b" (zinc-900)
  textColor: string; // default "#ffffff"
  messages: BannerMessage[];
}
```

### 3.9 Review

```typescript
interface Review {
  id: string;
  productId: string;
  productName: string; // denormalized
  customerId: string | null; // null = anonymous/guest
  author: string;
  email: string | null;
  rating: number; // 1-5
  title: string | null;
  body: string;
  verified: boolean; // purchased and verified
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.10 Inner Circle Member

```typescript
interface InnerCircleMember {
  id: string;
  customerId: string | null; // null if applied before creating account
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "rejected" | "waitlisted";
  appliedAt: string;
  approvedAt: string | null;
  notes: string; // internal notes
}
```

## 4. Dashboard Page

### Metrics Row (top)

| Metric                | Description                                         |
| --------------------- | --------------------------------------------------- |
| Total Revenue (month) | Sum of all paid orders this calendar month          |
| Orders Today          | Count of orders placed today                        |
| Active Customers      | Customers with at least 1 order in last 90 days     |
| Pending Orders        | Count of orders in `pending` or `processing` status |
| Low Stock Alerts      | Count of variant sizes with stock <= 3              |
| Avg Order Value       | Revenue / order count for the current month         |

Each metric card shows: current value, percentage change vs. last period, small sparkline.

### Charts

1. **Revenue Over Time** - Line chart, daily for last 30 days, switchable to weekly/monthly
2. **Orders by Status** - Donut chart showing breakdown across all statuses
3. **Top Products** - Horizontal bar chart, top 5 by revenue this month
4. **Sales by Country** - Ghana vs Nigeria side-by-side bar

### Recent Orders Table

Last 10 orders. Columns: Order ID, Customer, Items, Total, Status, Date, Action (View).

### Low Stock Alerts Table

Products where any size has stock <= 3. Columns: Product, Color, Size, Stock, Action (Edit).

---

## 5. Orders Page

### 5.1 Orders List

**Filters (left panel or top filter row):**

- Status (multi-select checkboxes)
- Payment status
- Date range picker (from / to)
- Country (Ghana / Nigeria)
- Search (order ID, tracking number, customer name, email)

**Table columns:**
| Column | Notes |
|---|---|
| Order ID | Link to detail page |
| Customer | Name + email |
| Items | Count + first item name |
| Total | Formatted currency |
| Payment | Badge (paid / unpaid / refunded) |
| Status | Colored badge |
| Date | Relative + absolute on hover |
| Actions | View, Print Invoice |

**Bulk actions:** Mark as processing, Mark as shipped, Export CSV.

### 5.2 Order Detail Page

Sections:

1. **Header** - Order ID, date, status badge, payment badge, action buttons (Update Status, Print Invoice, Cancel Order, Refund)
2. **Status Timeline** - Visual stepper: Pending > Processing > Shipped > In Transit > Out for Delivery > Delivered. Click a step to update status (opens modal with optional note + carrier/tracking fields).
3. **Order Items** - Table of items with image, name, variant (color + size), qty, unit price, total. Subtotals at the bottom.
4. **Customer Info** - Name, email, phone, WhatsApp, link to customer profile.
5. **Shipping Address** - Full formatted address block.
6. **Payment Info** - Method, reference number, amount, payment date.
7. **Order Totals** - Subtotal, shipping, discount (+ code), total.
8. **Internal Notes** - Textarea for admin notes (saved separately, never shown to customer).

---

## 6. Customers Page (CRM)

### 6.1 Customer List

**Filters:**

- Status (active / suspended / unverified)
- Country (Ghana / Nigeria)
- Tags (VIP, Inner Circle, etc.)
- Date joined range
- Search (name, email, phone)

**Table columns:**
| Column | Notes |
|---|---|
| Customer | Avatar initials + name + email |
| Phone | With country code prefix |
| Country | Flag emoji + name |
| Orders | Count |
| Total Spend | Formatted |
| Points | Balance |
| Status | Badge |
| Joined | Date |
| Actions | View, Suspend |

**Bulk actions:** Export CSV, Add tag, Send notification (future).

### 6.2 Customer Profile Page

Sections:

1. **Profile Header** - Avatar, name, email, status badge, joined date, quick stats (orders, total spend, points).
2. **Tabs:**

#### Tab: Overview

- Contact details: phone, WhatsApp, email, birthday, country, region, city.
- Size preferences: topSize, bottomSize.
- Internal tags + editable notes textarea (auto-save on blur).

#### Tab: Orders

- Full order history table for this customer.
- Same columns as global orders list minus the customer column.

#### Tab: Addresses

- All saved delivery addresses in card grid.
- Read-only (editing is customer-side).

#### Tab: Wishlist

- Grid of wishlisted products with image, name, price.

#### Tab: Activity

- Reverse-chronological log: account created, order placed, address added, points earned, etc.

## 7. Products Page

### 7.1 Product List

**Filters:**

- Collection (dropdown)
- Category
- Tag (Essential, Signature, Limited, New)
- Stock status (in stock / low stock / out of stock)
- Visibility (visible / hidden)
- Search

**Table columns:**
| Column | Notes |
|---|---|
| Product | Thumbnail + name + slug |
| Collection | Badge |
| Price | Formatted |
| Tag | Badge |
| Stock | Total units + colored status dot |
| Rating | Stars + count |
| Visibility | Toggle switch |
| Actions | Edit, Duplicate, Delete |

### 7.2 Create / Edit Product Form

Fields grouped into sections:

**Basic Info**

- Name (`text`)
- Slug (`text`, auto-generated from name, editable)
- Description (`textarea`)
- Category (`select`: boxers, tops, tracks, headwear, sunglasses, hoodies, lingerie)
- Collection (`select`, populated from collections list)
- Tag (`select`: Essential, Signature, Limited, New)
- Price (`number`)
- Compare-at Price (`number`, optional — for showing crossed-out original price)
- Is Visible (`toggle`)
- Is Featured (`toggle`)

**Details & Care**

- Product Details (`dynamic list` - add/remove bullet points)
- Care Instructions (`dynamic list`)

**Variants (Color + Sizes)**
Dynamic list of color variants. Each variant:

- Color Name (`text`)
- Color Hex (`color picker`)
- Images (`file upload`, multi-image, drag to reorder, first = primary)
- Sizes (`dynamic table`):
  | Size | SKU | Stock |
  |------|-----|-------|
  | S | ... | 0 |
  | M | ... | 12 |

"Add another color" button appends a new empty variant block.

---

## 8. Collections Page

### 8.1 Collection List

Table columns: Cover Image, Title, Subtitle, Products (count), Visibility, Sort Order, Actions (Edit, View on site, Delete).

Drag-and-drop row reorder to update `sortOrder`.

### 8.2 Create / Edit Collection Form

Fields:

- ID / Slug (`text`, read-only on edit)
- Subtitle (`text`, e.g. "Boxers")
- Title (`text`, e.g. "The Foundation Edit")
- Tagline (`text`)
- href (`text`, e.g. "/collections/boxers")
- Cover Image (`file upload` / URL)
- Is Visible (`toggle`)
- Sort Order (`number`)

---

## 9. Announcements / Banner

### 9.1 Banner Config Panel

Top of page: master **Enable Banner** toggle + preview strip showing how the banner looks.

**Global Settings** (expandable section):

- Background Color (`color picker`, default `#18181b`)
- Text Color (`color picker`, default `#ffffff`)
- Rotation Interval (`number` in seconds, default 10)

### 9.2 Messages Table

Columns: Sort Order (drag handle), Message Text, Link, Status, Schedule (start - end), Actions (Edit, Delete).

**Add / Edit Message Modal:**

- Text (`text input`, max 80 chars, live character count)
- Link href (`text`, e.g. `/collections`)
- Is Active (`toggle`)
- Starts At (`datetime-local`, optional)
- Ends At (`datetime-local`, optional)
- Sort Order (`number`, auto-assigned, editable)

Drag-and-drop reorder for rotation sequence.

---

## 10. Inner Circle Page

### 10.1 Summary Row

Cards: Total Members, Pending Applications, Approved This Month, Waitlisted.

### 10.2 Applications Table

Tabs: All | Pending | Approved | Rejected | Waitlisted

Columns: Name, Email, Phone, Applied, Status badge, Linked Account (yes/no), Actions.

**Actions per row:**

- Approve (moves to `approved`, links to customer account if email matches)
- Reject
- Waitlist
- View Notes (opens inline note editor)

**Bulk actions:** Approve selected, Reject selected, Export CSV.

---

## 11. Reviews Page

### 11.1 Reviews Queue

Tabs: Pending | Approved | Rejected | All

**Table columns:**
| Column | Notes |
|---|---|
| Product | Thumbnail + name |
| Author | Name + verified badge if applicable |
| Rating | Stars |
| Review | Truncated body |
| Status | Badge |
| Date | |
| Actions | Approve, Reject, Edit, Delete |

Clicking a row expands an inline panel with full review text, author email, product link, and an admin note field.

---

## 12. Analytics Page

### Charts

1. **Revenue** - Line chart with daily/weekly/monthly toggle. Date range picker. Total + avg line.
2. **Orders** - Bar chart by status distribution over time.
3. **Top Products by Revenue** - Horizontal bar, top 10.
4. **Top Products by Units Sold** - Horizontal bar, top 10.
5. **Customer Acquisition** - New customers per day/week.
6. **Geographic Sales** - Ghana vs Nigeria revenue + orders split.
7. **Payment Method Split** - Donut: MoMo / Card / Cash.
8. **Average Order Value** - Line chart over time.

### Stat Cards Row

Revenue (period), Orders (period), New Customers, Return Customer Rate, Conversion Rate (future — needs session data), Avg Order Value.

---

## 13. Settings Page

### Sections

**Store Info**

- Store name, email, phone, address, logo upload.

**Currency & Pricing**

- Primary currency (`GHS` / `NGN`)
- Formatting locale

**Shipping**

- Free shipping threshold (per country)
- Default carrier

**Notifications**

- Admin email for new order alerts
- Admin email for low stock alerts
- Low stock threshold (default: 3 units)


- Points per order (e.g. 1 point per GHS 10 spent)
- Points redemption rate (e.g. 100 points = GHS 5 discount)

**Admin Users**

- List of admin accounts (name, email, role: `super_admin` | `admin` | `viewer`)
- Invite new admin by email.

---

### Auth

```
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
GET    /api/admin/auth/me
```

### Dashboard

```
GET    /api/admin/dashboard/metrics          ?period=month|week|today
GET    /api/admin/dashboard/revenue-chart    ?range=30d|90d|1y&granularity=day|week
GET    /api/admin/dashboard/recent-orders    ?limit=10
GET    /api/admin/dashboard/low-stock        ?threshold=3
```

### Orders

```
GET    /api/admin/orders                     ?status=&paymentStatus=&from=&to=&country=&q=&page=&limit=
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id/status          { status, note?, carrier?, trackingNumber? }
PATCH  /api/admin/orders/:id/notes           { notes }
POST   /api/admin/orders/:id/refund          { amount, reason }
GET    /api/admin/orders/:id/invoice         → PDF blob
GET    /api/admin/orders/export              → CSV
```

### Customers

```
GET    /api/admin/customers                  ?status=&country=&tags=&from=&to=&q=&page=&limit=
GET    /api/admin/customers/:id
PATCH  /api/admin/customers/:id              { status?, tags?, notes? }
GET    /api/admin/customers/:id/orders
GET    /api/admin/customers/:id/addresses
GET    /api/admin/customers/:id/wishlist
GET    /api/admin/customers/:id/activity
GET    /api/admin/customers/:id/points
POST   /api/admin/customers/:id/points/adjust { points, reason }
GET    /api/admin/customers/export           → CSV
```

### Products

```
GET    /api/admin/products                   ?collectionId=&category=&tag=&stock=&q=&page=&limit=
POST   /api/admin/products
GET    /api/admin/products/:id
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
PATCH  /api/admin/products/:id/visibility    { isVisible }
POST   /api/admin/products/:id/duplicate
```

### Collections

```
GET    /api/admin/collections
POST   /api/admin/collections
GET    /api/admin/collections/:id
PUT    /api/admin/collections/:id
DELETE /api/admin/collections/:id
PATCH  /api/admin/collections/reorder        { order: string[] }   ← array of ids in new order
```

### Announcements / Banner

```
GET    /api/admin/banner
PUT    /api/admin/banner                     { isEnabled, rotationIntervalMs, backgroundColor, textColor }
GET    /api/admin/banner/messages
POST   /api/admin/banner/messages
PATCH  /api/admin/banner/messages/:id
DELETE /api/admin/banner/messages/:id
PATCH  /api/admin/banner/messages/reorder    { order: string[] }
```

### Inner Circle

```
GET    /api/admin/inner-circle               ?status=&q=&page=&limit=
PATCH  /api/admin/inner-circle/:id/status   { status: "approved"|"rejected"|"waitlisted", note? }
GET    /api/admin/inner-circle/export       → CSV
```

### Reviews

```
GET    /api/admin/reviews                    ?status=&productId=&q=&page=&limit=
PATCH  /api/admin/reviews/:id/status        { status: "approved"|"rejected", adminNote? }
DELETE /api/admin/reviews/:id
```

### Analytics

```
GET    /api/admin/analytics/revenue         ?from=&to=&granularity=day|week|month
GET    /api/admin/analytics/orders          ?from=&to=&granularity=day|week|month
GET    /api/admin/analytics/top-products    ?from=&to=&by=revenue|units&limit=10
GET    /api/admin/analytics/customers       ?from=&to=
GET    /api/admin/analytics/geography       ?from=&to=
GET    /api/admin/analytics/payments        ?from=&to=
```

### Settings

```
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/settings/admin-users
POST   /api/admin/settings/admin-users/invite  { email, role }
DELETE /api/admin/settings/admin-users/:id
```

---

## 15. Design System

### Colors (light admin theme)

- Page background: `bg-zinc-50`
- Card / panel: `bg-white border border-zinc-200`
- Primary action: `bg-zinc-900 text-white`
- Danger: `bg-red-600 text-white`
- Success: `bg-emerald-600 text-white`
- Warning: `bg-amber-500 text-white`
- Input: `bg-white border border-zinc-200 focus:border-zinc-900`
- Sidebar background: `bg-zinc-900 text-white`
- Sidebar active item: `bg-white/10`

### Status Badges

| Status           | Colors                   |
| ---------------- | ------------------------ |
| pending          | amber bg, amber text     |
| processing       | blue bg, blue text       |
| shipped          | indigo bg, indigo text   |
| in_transit       | violet bg, violet text   |
| out_for_delivery | orange bg, orange text   |
| delivered        | emerald bg, emerald text |
| cancelled        | zinc bg, zinc text       |
| refunded         | rose bg, rose text       |
| exception        | red bg, red text         |
| paid             | emerald                  |
| unpaid           | amber                    |
| failed           | red                      |

### Typography

- Page title: `text-2xl font-semibold text-zinc-900`
- Section label: `text-[10px] tracking-[0.2em] uppercase text-zinc-500`
- Table header: `text-xs font-medium text-zinc-500 uppercase tracking-wide`
- Body: `text-sm text-zinc-700`
- Muted: `text-xs text-zinc-400`

### Punctuation

- No em dashes (—) anywhere in UI copy. Use a period or restructure.
- Currency: display GHS with symbol (GHS 1,200.00) or NGN (NGN 45,000.00).

---

## 16. Key Business Rules

1. When an order status is updated to `shipped`, `carrier` and `trackingNumber` fields become required.
2. `isDefault` address: only one address per customer can be `isDefault: true`. Setting a new default auto-clears the previous one.
4. Inner Circle: approving an applicant who has a matching customer email automatically sets `customer.innerCircle = true`.
5. Banner messages with `startsAt` / `endsAt` are filtered client-side on the storefront; the API returns all active messages and the storefront handles scheduling.
6. Product `totalStock` is computed as the sum of all `SizeStock.stock` values across all color variants.
7. Deleting a collection does NOT delete its products — products become orphaned and appear in the products list without a collection. Reassign or delete separately.
8. `compareAtPrice` must be greater than `price` if set; the storefront displays it as a crossed-out original price.
9. Orders cannot be deleted, only cancelled or refunded.
10. Admin roles: `super_admin` can do everything including manage admin users. `admin` can manage all commerce data. `viewer` is read-only.
