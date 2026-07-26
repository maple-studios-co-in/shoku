# Shoku — Developer Guide

**Shoku** is an AI-powered, white-label, multi-tenant online ordering platform for cafés and restaurant chains. One Next.js application serves three audiences off a single shared database: the **platform** (Shoku's marketing site + super-admin), each **café storefront** (a branded ordering app on its own subdomain), and each café's **admin dashboard**.

This guide documents the system as it actually exists in the codebase. App root: `shoku/`.

- **Framework:** Next.js 14 (App Router) + React 18
- **Database:** Prisma ORM over PostgreSQL
- **Auth:** NextAuth (Credentials provider, JWT sessions, bcrypt passwords)
- **Styling:** Tailwind CSS (brand colors driven by CSS variables for live theming)
- **AI:** heuristic-first, LLM-optional (zero external dependency required)

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Project structure](#2-project-structure)
3. [Data model](#3-data-model)
4. [Multi-tenancy & auth](#4-multi-tenancy--auth)
5. [The AI layer](#5-the-ai-layer)
6. [WhatsApp marketing internals](#6-whatsapp-marketing-internals)
7. [API reference](#7-api-reference)
8. [Environment variables](#8-environment-variables)
9. [Local setup & development](#9-local-setup--development)
10. [Deployment](#10-deployment)
11. [Extending Shoku](#11-extending-shoku)
12. [Conventions & gotchas](#12-conventions--gotchas)

---

## 1. Architecture overview

Shoku is a single Next.js 14 App Router application. Hostname determines which of the three surfaces a request hits:

| Surface | Host | Audience | What it serves |
| --- | --- | --- | --- |
| **Platform / super-admin** | apex `shoku.…` (+ `www`) | Shoku staff | Marketing landing, `/super` console, platform analytics, pitch deck |
| **Café storefront** | `<slug>.shoku.…` | Diners | Branded menu, AI assistant, cart, checkout, loyalty, account |
| **Café admin** | `<slug>.shoku.…/admin` | Café owner/staff | Menu, orders, customers, marketing, loyalty, branding, settings |

### Request lifecycle

1. **`middleware.js`** runs on the edge. It parses the café slug from the `Host` header and forwards it downstream as the `x-tenant-slug` request header (Prisma can't run in middleware, so it only does string parsing). On a café subdomain it also rewrites `/` → `/menu` so the café's root shows its storefront, not the platform landing.
2. **Server components / route handlers** call `getCurrentTenant()` (`lib/tenant.js`), which resolves the tenant from `x-tenant-slug` → host → default tenant.
3. **Data isolation** is row-level on a shared database: nearly every model carries a `tenantId`, and every query filters on it. There is no schema-per-tenant or DB-per-tenant separation — isolation is enforced in application code (the `requireAdmin()` gate returns the caller's `tenantId`, and queries always scope `where: { tenantId }`).
4. **Auth** is NextAuth with a Credentials provider and JWT session strategy. The JWT carries `role` and `tenantId`; route handlers read these to authorize.

### Roles

| Role | Scope | Capabilities |
| --- | --- | --- |
| `superadmin` | Platform-wide (`tenantId = null`) | Manage all cafés, platform analytics, audit log, pitch deck. Lives only on the apex host. |
| `owner` | One café | Full café admin: menu, orders, branding, loyalty, marketing, settings. |
| `staff` | One café | Café admin (same gate as owner via `requireAdmin`). |
| `customer` | One café | Order, earn/redeem loyalty, leave feedback, manage own account. |

> `requireAdmin()` accepts roles `owner`, `staff`, and `admin` (legacy alias). The superadmin is deliberately **excluded** from café-admin gates and from logging in on café hosts.

### Why one shared Postgres DB

The whole platform runs from one Postgres database (multi-tenant by `tenantId`, not a DB-per-café). This keeps provisioning trivial (creating a café is a set of `INSERT`s, not a migration) and analytics cross-tenant. Early prototypes used a single SQLite file; the app migrated to Postgres for production-grade backups, concurrency and managed hosting (`scripts/migrate-sqlite-to-postgres.js` did the one-time data copy). Several columns are still JSON-encoded as `String` for portability; see [§12](#12-conventions--gotchas).

---

## 2. Project structure

```
shoku/
├── middleware.js              # subdomain → x-tenant-slug header; "/" → "/menu" rewrite on café hosts
├── prisma/
│   ├── schema.prisma          # full data model
│   ├── seed.js                # superadmin + 2 demo cafés (CBTL, Blue Tokai) + menu/orders/feedback
│   └── migrate-to-multitenant.js  # idempotent backfill run on every deploy
├── lib/
│   ├── db.js                  # Prisma singleton + parseItem() (JSON-string field parser)
│   ├── tenant.js              # slugFromHost, getCurrentTenant, DEFAULT_TENANT_SLUG, BASE_DOMAIN, RESERVED
│   ├── auth.js                # NextAuth config: host-scoped credentials, COOKIE_DOMAIN cross-subdomain cookies
│   ├── admin.js               # requireAdmin / requireSuperadmin gates
│   ├── ai.js                  # rule-based menu recommender (QUICK_PROMPTS, recommend())
│   ├── llm.js                 # optional OpenAI-compatible bridge (llmEnabled, llmComplete)
│   ├── aiInsights.js          # analyzePlatform, platformNarrative, PLAN_PRICE (super-admin analytics)
│   ├── aiMessage.js           # personalize(), suggestCopy(), GOALS (WhatsApp copy)
│   ├── segments.js            # SEGMENTS, tenantCustomers(), inSegment(), buildAudience(), segmentCounts()
│   ├── whatsapp.js            # provider-agnostic sender, waMode(), Meta/Twilio/BSP adapters, demo mode
│   ├── loyalty.js             # DEFAULT_TIERS, parseTiers(), tierFor()
│   ├── orders.js              # createOrder (buyerId/skipLoyalty opts, tenant gstRate), settlePaid
│   ├── pos.js                 # requirePos gate, allocateInvoiceNo, dayEnd (POS add-on)
│   ├── posMath.js             # pure gstSplit + formatInvoiceNo (unit-tested)
│   ├── foodImages.js          # keyword → curated food photo (menu importer fallback)
│   ├── imageGen.js            # AI menu images via /images/generations → public/uploads/menu/
│   ├── payments.js            # Razorpay REST + HMAC signature verification
│   ├── rateLimit.js, sanitize.js  # in-memory rate limiting; safeMarkdownHtml
│   ├── audit.js               # logAudit() (never throws)
│   ├── starterMenu.js         # STARTER_CATEGORIES + STARTER_ITEMS for provisioning new cafés
│   └── menu.js                # shared menu helpers
├── app/
│   ├── layout.js, page.js     # platform marketing landing
│   ├── menu/, item/[id]/, cart/, checkout/, success/, ai/   # storefront
│   ├── login/, register/, set-password/, account/           # customer auth & account
│   ├── pitch/                 # public pitch-deck viewer
│   ├── admin/                 # café admin pages (pos, analytics, menu, orders, customers, marketing, loyalty, branding, settings, tables, banners, discounts, feedback)
│   ├── print/                 # 80mm print routes: invoice/[id], kot/[id] (outside admin layout)
│   ├── super/                 # super-admin console (cafes incl. Manage drawer, audit) + layout
│   └── api/                   # all route handlers (see §7)
├── components/                # AppShell, Header, BottomNav, CartBar, ProductCard, AdminUI, Providers
├── scripts/                   # deploy.sh, update.sh, add-cafe.sh, seed-demo-data.js, backup-r2.sh, nginx-shoku-wildcard.conf
├── package.json
└── docs: README.md, DEPLOY.md, DEPLOY_HOSTINGER.md, SUBDOMAINS.md, WILDCARD_TLS.md, GIT_SETUP.md, MULTI_TENANT_PLAN.md
```

---

## 3. Data model

Defined in `prisma/schema.prisma`. PostgreSQL is the datasource. Several columns are **JSON encoded as `String`** (a portability choice carried over from the SQLite prototype) and are parsed at the application layer — these are flagged below.

### Tenant

The café. Holds white-label config, AI feature flags, loyalty config, and WhatsApp settings.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String (cuid) | PK |
| `name` | String | Café name |
| `slug` | String **@unique** | Subdomain label, e.g. `cbtl` |
| `status` | String = `active` | `active` \| `trial` \| `suspended` (non-active blocks storefront/orders) |
| `plan` | String = `growth` | `starter` \| `growth` \| `enterprise` (drives MRR in analytics) |
| `brandHex` | String = `#7AB04A` | Primary brand color |
| `darkHex` | String = `#36511F` | Dark brand color |
| `font` | String = `Inter` | White-label font |
| `aiAssistant` | Boolean = true | AI feature flags (toggle storefront AI surfaces) |
| `aiCards` | Boolean = true | |
| `aiUpsell` | Boolean = true | |
| `aiLoyalty` | Boolean = false | |
| `storeName`, `address` | String? | Store display info |
| `loyaltyEarnRate` | Int = 10 | Points earned per ₹100 of subtotal |
| `tiers` | String = `[]` | **JSON** `[{name,min}]` (falls back to `DEFAULT_TIERS`) |
| `waProvider` | String? | `meta` \| `twilio` \| `bsp` \| null (demo) |
| `waEnabled` | Boolean = false | Master switch for live WhatsApp |
| `waFromName` | String? | Sender display name |
| `waConfig` | String = `{}` | **JSON** per-provider credentials |
| `waTriggers` | Boolean = true | Auto order-confirmation / ready messages |
| `waNudges` | Boolean = true | Reward-close / win-back nudges (cron) |
| `locations` | String = `[]` | **JSON** `[{id,label,address}]` — outlets; drives the storefront location picker + per-location analytics |
| `aiApiKey` | String? | Café-specific LLM key (superadmin-set; null = platform key) |
| `aiModel` | String? | Model override (null = plan default, see `lib/llm.js`) |
| `aiBaseUrl` | String? | OpenAI-compatible endpoint override |
| `posEnabled` | Boolean = false | POS add-on gate (superadmin toggles via the Manage drawer) |
| `gstin` | String? | 15-char GSTIN printed on invoices |
| `gstRate` | Int = 5 | GST % applied by `createOrder` |
| `invoicePrefix` | String = `INV` | Invoice number prefix |
| `invoiceSeq` | Int = 0 | Last issued invoice number (atomic increment) |
| `invoiceYear` | Int = 0 | Year the sequence belongs to; resets `invoiceSeq` on rollover (`0` = legacy, adopts current year without reissuing) |
| `kotAutoPrint` | Boolean = true | Auto-open the KOT print window after billing |
| `createdAt` | DateTime | |

Relations: `categories`, `items`, `orders`, `discounts`, `users`, `rewards`, `feedback`, `tables`, `banners`, `campaigns`, `messages`.

### User

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String (cuid) | PK |
| `tenantId` | String? | **null for platform superadmins** |
| `name` | String? | |
| `email` | String | Unique per tenant via `@@unique([tenantId, email])` |
| `password` | String | bcrypt hash |
| `role` | String = `customer` | `superadmin` \| `owner` \| `staff` \| `customer` |
| `points` | Int = 120 | Loyalty points balance |
| `phone` | String? | For WhatsApp |
| `waOptIn` | Boolean = true | WhatsApp marketing consent |
| `inviteToken` | String? **@unique** | Owner invite flow |
| `inviteExpires` | DateTime? | Invite TTL (7 days) |

The same email can exist once per café and once as superadmin — uniqueness is scoped by `(tenantId, email)`.

### Category

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK; convention `<tenantId>-<key>` to stay globally unique |
| `tenantId` | String? | |
| `key` | String | Logical id within a tenant, e.g. `ice-blended` |
| `label` | String | Display name |
| `sort` | Int = 0 | Display order |

### Item

The menu item. Several array fields are JSON strings parsed by `parseItem()`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK; convention `<slugOrTenant>-<key>` |
| `tenantId` | String? | |
| `categoryId` | String | FK → Category |
| `name`, `desc`, `img`, `origin` | String | |
| `price` | Int | **₹ stored as integer** |
| `veg` | Boolean = true | |
| `kcal`, `caffeine`, `protein`, `sugar` | Int | Nutrition (used by the AI recommender) |
| `signature` | Boolean = false | |
| `rating` | Float = 0, `reviews` Int = 0 | |
| `ingredients`, `allergens`, `tags`, `sizes` | String | **JSON arrays** — parsed by `parseItem`. `sizes` is `[{name,price}]` |
| `aiTip` | String | Inline AI hint shown on the item |
| `live` | Boolean = true | Hidden from storefront when false |
| `sort` | Int = 0 | |

`parseItem(it)` (in `lib/db.js`) returns the row with `ingredients/allergens/tags/sizes` JSON-parsed (with `[]` fallback), `category` flattened to `categoryId`, and `categoryKey`/`categoryLabel` lifted from the joined category.

### Order

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String (cuid) | PK |
| `tenantId`, `userId` | String | |
| `subtotal`, `tax`, `reward` | Int | Money in ₹. `tax` = `tenant.gstRate`% (default 5), `reward` = 5% of subtotal |
| `discount` Int, `discountCode` String? | | Promo code discount |
| `loyaltyDiscount` Int, `pointsRedeemed` Int, `rewardTitle` String? | | Reward redemption |
| `total` | Int | `max(0, subtotal + tax − reward − discount − loyaltyDiscount)` — floored at 0 so stacked promo + reward can't go negative |
| `fulfilment` | String = `pickup` | `pickup` \| `dinein` \| `delivery` |
| `payment` | String = `upi` | |
| `paymentStatus` | String = `paid` | `paid` \| `pending` \| `failed` (Razorpay flow) |
| `tableId`, `tableLabel` | String? | Dine-in (from table QR) |
| `source` | String = `online` | `online` \| `pos` — where the order was rung up |
| `paymentMethod` | String? | POS only: `cash` \| `upi` \| `card` |
| `invoiceNo` | String? | Sequential GST invoice, e.g. `INV-2026-00042` (POS) |
| `locationLabel` | String? | Chosen store outlet (from the storefront picker / demo seed) |
| `cgst`, `sgst` | Int = 0 | GST display split; `cgst + sgst = tax` (sgst gets the odd ₹) |
| `staffId` | String? | User id of the staff member who billed a POS sale |
| `status` | String = `preparing` | `preparing` \| `ready` \| `completed` \| `cancelled` |
| `items` | OrderItem[] | |

**Order-integrity invariants** (all enforced in `lib/orders.js`, the single place totals are computed for both mock and Razorpay checkout):
- **Line prices come from the catalog, never the request.** `createOrder` resolves each unit price via `resolveUnitPrice(item, size, milk)` (`lib/menu.js`); the client-sent `unit` is ignored, so orders can't be under-priced.
- **`total` is floored at 0** — a 90%-off promo stacked with a full loyalty reward yields ₹0, never a negative charge.
- **Redeemed loyalty points are reserved atomically at order creation** (conditional `updateMany` decrement), so two concurrent redemptions of the same balance can't drive it negative. The earn side is credited later, on `settlePaid`. A **failed** Razorpay payment refunds the reserved points exactly once (webhook `payment.failed`).

### OrderItem

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String (cuid) | PK |
| `orderId` | String | FK → Order, `onDelete: Cascade` |
| `itemId` | String | FK → Item |
| `name` | String | Snapshotted name |
| `size` | String = `Regular` | |
| `milk` | String? | |
| `unit`, `qty` | Int | Unit price (₹) and quantity |

### Discount

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `tenantId` | String? | `@@unique([tenantId, code])` |
| `code` | String | Uppercased, whitespace-stripped |
| `percent` | Int | 1–90 |
| `active` | Boolean = true | |

### Reward

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `tenantId` | String? | |
| `title` | String | |
| `type` | String = `discount` | `discount` \| `freeItem` |
| `cost` | Int | Points required to redeem |
| `amount` | Int = 0 | ₹ off (discount type) |
| `itemId`, `itemName` | String? | Free item (freeItem type) |
| `active` | Boolean = true | |

### Table

Dine-in QR tables.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `tenantId` | String? | |
| `label` | String | e.g. `T1` |
| `active` | Boolean = true | Deactivated rather than deleted if it has orders |

### Feedback

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `tenantId`, `userId`, `orderId` | String? | |
| `name` | String? | |
| `rating` | Int | 1–5 |
| `comment` | String? | ≤ 500 chars |

### Banner

Storefront hero banners.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `tenantId` | String (required) | |
| `title`, `subtitle`, `link` | String? | |
| `imageUrl` | String | Data URL or hosted URL (max ~2–3 MB) |
| `active` | Boolean = true, `sort` Int = 0 | |

### Campaign

A WhatsApp marketing blast.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `tenantId` | String (required) | |
| `name` | String | |
| `segment` | String = `all` | Segment key (see [§6](#6-whatsapp-marketing-internals)) |
| `template` | String | Base copy with `{name}`/`{brand}`/… tokens |
| `status` | String = `draft` | `draft` \| `sent` |
| `audience`, `sentCount` | Int = 0 | |
| `messages` | Message[] | |

### Message

Every WhatsApp send (real or demo-logged).

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `tenantId` | String (required) | |
| `campaignId`, `userId` | String? | |
| `channel` | String = `whatsapp` | |
| `kind` | String = `campaign` | `campaign` \| `trigger` \| `nudge` |
| `toName`, `to` | String | `to` is the phone (or `demo:<email>` / `(no number)`) |
| `body` | String | Final personalized text |
| `status` | String = `demo` | `demo` \| `queued` \| `sent` \| `failed` |
| `provider`, `error` | String? | |

### AuditLog

Platform action trail (no tenant relation — global).

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `actorId`, `actorEmail`, `actorRole` | String? | Who |
| `action` | String | e.g. `tenant.create`, `campaign.send`, `pitch.upload` |
| `target` | String? | Usually the café slug |
| `meta` | String? | **JSON** |

### PitchDeck

Versioned binary store for the investor pitch deck (PDF + editable PPTX).

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String | PK |
| `kind` | String = `pdf` | `pdf` \| `pptx` |
| `version` | Int = 1 | Auto-incremented per kind on upload |
| `filename`, `mime` | String | |
| `size` | Int | Bytes |
| `data` | Bytes | The file itself, stored in-DB |
| `uploadedBy` | String? | Email |

---

## 4. Multi-tenancy & auth

### How a request resolves a tenant

```
Host header  ──►  middleware.js  ──►  sets x-tenant-slug
                                          │
server component / route handler  ──►  getCurrentTenant()  (lib/tenant.js)
        x-tenant-slug  →  slugFromHost(host)  →  DEFAULT_TENANT_SLUG
```

`lib/tenant.js` exports the pieces:

- **`BASE_DOMAIN`** — `process.env.BASE_DOMAIN || "getshoku.com"`.
- **`DEFAULT_TENANT_SLUG`** — `process.env.DEFAULT_TENANT_SLUG || "cbtl"`. The fallback café for apex/localhost/unknown hosts.
- **`RESERVED`** — `www, console, admin, api, app, mail, assets, static, super` — subdomains that never map to a café.
- **`slugFromHost(host)`** — returns the café slug for `<slug>.BASE_DOMAIN`, or `null` for apex, `www`, `localhost`, raw IPs, reserved labels, and unknown domains.
- **`getCurrentTenant()`** — `cache()`-wrapped. Resolves in order: middleware header → host parse → default tenant. Returns `null` only if no tenants exist at all.

`getTenantBySlug` and `getDefaultTenant` are also `cache()`-wrapped, so within a single request render the tenant is fetched once.

### Host-scoped login

`lib/auth.js` defines a NextAuth Credentials provider whose `authorize()` is **host-aware** — the host header decides which user pool is searched:

- **On a café subdomain** (`slugFromHost(host)` returns a slug): only that café's own users may sign in (`tenantId = tenant.id`, and `role != superadmin`). The platform superadmin is intentionally **not** allowed on café hosts.
- **On the apex/platform host** (no slug): first try the superadmin (`role = superadmin`); if not found, fall back to the **default tenant's** users.

Passwords are bcrypt-compared. On success the provider returns `{ id, name, email, role, tenantId }`. The `jwt` callback copies `uid`, `role`, `tenantId` onto the token; the `session` callback exposes them as `session.user.{id,role,tenantId}`. Session strategy is **JWT** (no DB session table).

### Cross-subdomain cookies

By default NextAuth uses host-only cookies, so a login at `cbtl.shoku.…` would not carry to `bluetokai.shoku.…` (which is correct — cafés are isolated). But the **same café** must work across its own host plus any shared surfaces, and a deployment may want one session domain. Setting **`COOKIE_DOMAIN`** (e.g. `.getshoku.com`) switches `auth.js` into cross-subdomain mode: it sets `useSecureCookies: true` and pins the session/callback/csrf cookies to that parent domain with `secure: true`. Leave it **unset** for local dev / single-host (NextAuth host-only defaults).

### Authorization gates (`lib/admin.js`)

```js
// Café admin (owner/staff). Returns { session, tenantId } or { error, status }.
const gate = await requireAdmin();
if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
// use gate.tenantId in every query

// Platform superadmin. Returns { session } or { error, status }.
const gate = await requireSuperadmin();
```

`requireAdmin` returns `401` if unauthenticated, `403` if the role isn't `owner`/`staff`/`admin`, and `403` if there's no `tenantId`. `requireSuperadmin` returns `401`/`403` and only passes `role === "superadmin"`.

### Tenant isolation in queries

There is no automatic row-level security — isolation is **manual and consistent**: every café-scoped query passes `where: { tenantId: gate.tenantId }`, and mutations on a single row first do a `findFirst({ where: { id, tenantId } })` ownership check (or use `updateMany`/`deleteMany` scoped by `tenantId`, returning 404 when `count === 0`). When auditing or extending the code, **this pattern is mandatory** for any new café-scoped endpoint.

---

## 5. The AI layer

Shoku's AI is **heuristic-first and LLM-optional**. Every AI feature ships a built-in, deterministic implementation that works with **zero external dependencies**, and **upgrades automatically** to a real model the moment an API key is present. There is no hard dependency on any AI provider.

### The optional LLM bridge — `lib/llm.js`

```js
const KEY  = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "";
const BASE = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const MODEL= process.env.LLM_MODEL   || "gpt-4o-mini";

llmEnabled();                       // → !!KEY
await llmComplete(system, user, {   // OpenAI-compatible /chat/completions call
  json: false, max: 600, temperature: 0.7
});                                 // → string | parsed object (json:true) | null on ANY failure
```

`llmComplete` is the single chokepoint. It returns **`null`** on a missing key, a non-OK response, a parse error, or any exception — so callers simply do `const out = await llmComplete(...); if (out) return out; /* else heuristic */`. Pointing `LLM_BASE_URL` at any OpenAI-compatible endpoint (OpenRouter, Together, a local server, Azure-compatible gateway, etc.) works.

### Per-tenant AI config — `getTenantLLMConfig(tenant)`

AI cost scales with the café's plan, and a café can bring its own key. Resolution order (each field independently):

```js
getTenantLLMConfig(tenant) // → { key, base, model, imageModel }
// key   : tenant.aiApiKey  || env key
// base  : tenant.aiBaseUrl || LLM_BASE_URL
// model : tenant.aiModel   || PLAN_MODELS[tenant.plan] || LLM_MODEL
//         PLAN_MODELS: starter/growth → LLM_MODEL_STARTER/GROWTH (default gpt-4o-mini),
//                      enterprise → LLM_MODEL_ENTERPRISE (default gpt-4o)
// imageModel: LLM_IMAGE_MODEL (default gpt-image-1)
```

`llmComplete(system, user, { tenant })` uses this automatically when a `tenant` is passed. Superadmins set the per-café values from **Super → Cafés → Manage** (PATCH `/api/super/tenants/[id]` with `aiApiKey` / `aiModel` / `aiBaseUrl`; empty string clears back to defaults).

### Pricing helper — `resolveUnitPrice` (`lib/menu.js`)

`resolveUnitPrice(item, wantSize, wantMilk)` → `{ size, milk, unit }`. The **single source of truth for a line's price**, used by `createOrder`. It reads the price from the item's `sizes` JSON (falling back to the first size / base price for an unknown size) and adds the `MILK_OPTIONS` surcharge for a known milk only. Client-supplied prices are never used — this closes the "buy anything for ₹1" class of tampering. Pure and unit-tested (`lib/menu.test.js`).

### Menu images — `lib/foodImages.js` + `lib/imageGen.js`

Used by the CSV importer (`POST /api/items/import`):

- **`imageFor(name, categoryLabel)`** (`lib/foodImages.js`) — pure keyword→photo matcher over a curated pool of known-good Unsplash photos. Order matters: specific terms (matcha, chai) are listed before generic ones (latte). Always succeeds.
- **`generateMenuImage(tenant, name, desc)`** (`lib/imageGen.js`) — OpenAI-compatible `POST {base}/images/generations` (b64), saved to `public/uploads/menu/<slug>-<hash>.png`, returns the public path — or **`null` on any failure**, so the importer falls back to `imageFor`. Requires a key via `getTenantLLMConfig`; only attempted when the import request sets `generateImages: true`. Note: writes to the local filesystem, so it assumes the PM2/VPS deployment (not serverless).

### What an LLM upgrades — and what stays rule-based

| Module | LLM-aware? | Behavior |
| --- | --- | --- |
| **`lib/ai.js`** (menu recommender) | **No** — always rule-based | Scores menu items against the user's intent. Used by `POST /api/ai`. |
| **`lib/aiInsights.js`** (`platformNarrative`) | **Yes** | Super-admin "what changed & why" insights. LLM when keyed, else a data-grounded summary. The numeric `analyzePlatform()` is always deterministic. |
| **`lib/aiMessage.js`** (`suggestCopy`) | **Yes** | Drafts WhatsApp campaign copy from a goal. LLM when keyed, else a curated heuristic library. `personalize()` is always deterministic token substitution. |

Setting **`OPENAI_API_KEY`** (or `LLM_API_KEY` + optionally `LLM_BASE_URL` / `LLM_MODEL`) upgrades `aiInsights` and `aiMessage`. **`lib/ai.js` stays rule-based by design** — its `recommend()` is fast, free, and explainable.

### `lib/ai.js` — the rule-based recommender

`recommend(query, items, limit=3)` returns `{ intro, picks: [{ item, why }] }`:

1. **`buildIntent(query)`** keyword-matches the free-text query into scoring rules (cold, pick-me-up, sweet, vegan, protein, low-cal, low-caffeine, hot, tea, coffee) and picks a tailored `intro`. No match → "crowd favourites" (signature + rating).
2. **`scoreItem(item, rules)`** scores each item using its `tags` and nutrition fields (`caffeine`, `kcal`, `protein`, `rating`) and category key.
3. **`reasonFor(item, query)`** builds the human "why" string (e.g. `9g protein · cold & refreshing`).

`QUICK_PROMPTS` exposes the storefront quick-chip prompts (Cold & refreshing, Need a pick-me-up, etc.). The return contract is stable so `recommend()` could be swapped for an LLM later without changing callers.

### `lib/aiInsights.js` — super-admin analytics

- **`PLAN_PRICE`** = `{ starter: 1499, growth: 3999, enterprise: 9999 }` (₹/month) — drives MRR/ARR.
- **`analyzePlatform({ tenants, orders, now })`** — pure function returning: 6-month revenue/orders/new-café series, totals (cafés, active, trial, revenue, orders, MRR, ARR), `mrrByPlan`, an **at-risk** list (suspended, no-orders-since-signup, lapsed ≥21/45 days), a weighted next-month **forecast** + MoM growth, and `topCafes` by revenue.
- **`platformNarrative(a)`** — async. Tries `llmComplete` for 3–4 founder-grade bullet insights (`source: "ai"`); on null, returns a deterministic data-grounded summary (`source: "heuristic"`). Either way the response shape is `{ source, lines: [...] }`.

### `lib/aiMessage.js` — WhatsApp copy

- **`personalize(template, customer, tenant)`** — deterministic token substitution: `{name}` (first name), `{brand}` (storeName/name), `{tier}`, `{points}`, `{toReward}`.
- **`GOALS`** — campaign goal presets, each mapped to a default segment (`winback`→lapsed, `reward`→near_reward, `vip`→loyal, `promo`/`newdrop`→all).
- **`suggestCopy({ tenant, goal, segmentLabel, notes })`** — async. Tries `llmComplete` for a single warm WhatsApp message; on null, returns the curated `HEURISTIC[goal]` template.

---

## 6. WhatsApp marketing internals

The WhatsApp engine (`lib/whatsapp.js` + `lib/segments.js`) is **provider-agnostic** and runs in **demo mode by default** so the entire flow is demonstrable without any real account or credentials.

### Sender — `lib/whatsapp.js`

- **`waMode(tenant)`** returns the effective mode: `demo` unless `waEnabled` is true, a `waProvider` is set, **and** valid credentials exist in `waConfig` for that provider — then it returns the provider name. Missing or partial creds silently fall back to `demo`.
- **`sendWhatsApp({ tenant, to, body, kind, userId, toName, campaignId })`** — sends (live) or demo-logs (always), then **records a `Message` row** with the resulting status. **It never throws** — callers don't have to guard messaging. In demo mode, or when `to` is empty / starts with `demo`, nothing is dispatched and the message is stored with `status: "demo"`.

### Demo mode

A café with no provider configured runs in demo mode: every message is **personalized and persisted** (so campaigns, triggers, and nudges all appear in the admin UI and in `/api/campaigns` history) but **never actually dispatched**. Dropping real credentials into the café's settings switches that single café to live sending — **no code change**.

### Provider adapters

Adapters are only invoked when live creds exist (`hasCreds(provider, cfg)`):

| Provider | `waConfig` keys | Transport |
| --- | --- | --- |
| `meta` | `phoneId`, `token` | `POST graph.facebook.com/v19.0/<phoneId>/messages` (WhatsApp Cloud API) |
| `twilio` | `sid`, `token`, `from` | `POST api.twilio.com/.../Messages.json` (Basic auth, `whatsapp:` prefix) |
| `bsp` | `url`, `apiKey`, optional `extra` | Generic Indian BSP REST webhook (AiSensy / Interakt / Gupshup style) |

`waConfig` is a JSON string on the Tenant. Credentials are written via `PATCH /api/wa/settings`, which **masks** secrets on read and merges new values on write (a save that doesn't re-enter a masked secret keeps the stored one).

### Segments — `lib/segments.js`

`tenantCustomers(tenantId)` enriches each `customer` user with order stats (count, spend, last order, days-since-order, days-since-join) and loyalty tier. `SEGMENTS`:

| Key | Predicate (`inSegment`) |
| --- | --- |
| `all` | Everyone opted-in |
| `loyal` | `orderCount >= 5` |
| `gold` | tier is `Gold` or `Platinum` |
| `near_reward` | within 80 points of the cheapest reward |
| `lapsed` | no order in ≥ 30 days |
| `new` | joined ≤ 14 days ago and ≤ 1 order |

`buildAudience(tenantId, key)` returns opted-in customers in a segment; `segmentCounts(tenantId)` returns per-segment counts for the UI.

### Triggers

In **`POST /api/orders`**, after an order is created, if `tenant.waTriggers` is on and the buyer has `waOptIn`, an order-confirmation message is sent via `sendWhatsApp(..., kind: "trigger")`. It's wrapped in try/catch — **an order never fails because of messaging**.

### Nudge cron — `GET|POST /api/cron/nudges`

Runs automated **reward-close** and **win-back** nudges across all `active` cafés with `waNudges` on. For each opted-in customer not already nudged in the last 7 days:

- **reward-close** if `toReward` is between 1 and 60 points → "you're just N points from a reward".
- **win-back** if `daysSinceOrder` is between 30 and 60 → "we miss you, here's 15% off".

Capped at 200 sends per café per run. **Auth:** a superadmin session, **or** the `CRON_SECRET` (passed as `?key=` or header `x-cron-key`) so it can be wired to a scheduler / GitHub Action / cron job.

---

## 7. API reference

All handlers set `export const dynamic = "force-dynamic"` (no static caching; every request re-resolves tenant/session). Gate column legend: **public** (no auth), **customer** (logged-in diner), **admin** (`requireAdmin` — owner/staff), **super** (`requireSuperadmin`), **cron** (superadmin or `CRON_SECRET`).

### Public (storefront)

| Route | Method | Gate | Purpose |
| --- | --- | --- | --- |
| `/api/menu` | GET | public | Current café's categories + live items (`?all=1` includes hidden, for admin). Returns `{ suspended: true }` if café isn't active. |
| `/api/menu/[id]` | GET | public | Single parsed item for the current tenant. |
| `/api/brand` | GET | public | Current café's white-label config (name, colors, font, AI flags, store info). |
| `/api/ai` | POST | public | Body `{ query }`. Returns `{ intro, picks:[{why, item:{id,name,img,price,kcal}}] }` from the rule-based recommender. |
| `/api/rewards` | GET | public | Active rewards for the current café (checkout/account). |
| `/api/banners` | GET | public | Active banners for the current café (`?manage=1` switches to admin list). |
| `/api/discounts/validate` | POST | public | Body `{ code }`. Returns `{ valid, code, percent }`. |
| `/api/tables/[id]` | GET | public | Resolve a table label (for the "ordering for Table X" banner). |
| `/api/register` | POST | public | Body `{ name, email, password }`. Creates a `customer` in the current tenant. |
| `/api/invite/accept` | GET / POST | public | `GET ?token=` validates an owner invite; `POST { token, password }` sets the password and consumes the token. |
| `/api/auth/[...nextauth]` | GET / POST | public | NextAuth handler (sign-in, callbacks, session). |

### Customer (authenticated diner)

| Route | Method | Gate | Purpose |
| --- | --- | --- | --- |
| `/api/me` | GET | customer | Current user profile: points, order count, loyalty tier. |
| `/api/orders` | GET | customer | The user's orders (newest first) with items. |
| `/api/orders` | POST | customer | **Place an order.** Validates items belong to the tenant, recomputes totals server-side (tax 5%, reward 5%), applies promo code + loyalty reward, sets dine-in table, increments points (earn − redeemed), fires a WhatsApp trigger. Café must be `active`. |
| `/api/feedback` | POST | customer | Body `{ rating(1–5), comment?, orderId? }`. Records feedback for the tenant. |

> Loyalty redemption at checkout lives **inside** `POST /api/orders` (via `body.rewardId`) — there is no separate redeem endpoint.

### Café admin (`requireAdmin`)

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/items` | POST | Create a menu item (validates category ownership, generates a tenant-prefixed id, JSON-encodes array fields). |
| `/api/items/[id]` | PATCH | Quick toggle (`live`) / price update. |
| `/api/items/[id]` | PUT | Full item edit. |
| `/api/items/[id]` | DELETE | Delete — **blocked (409)** if the item appears in past orders (toggle off instead). |
| `/api/admin/orders` | GET | All orders (filter `?status=`) with customer + items. |
| `/api/orders/[id]` | PATCH | Update order status (`preparing`/`ready`/`completed`/`cancelled`), scoped by tenant. |
| `/api/admin/stats` | GET | Dashboard: revenue, AOV, 14-day series, top items, status breakdown, recent orders, counts. |
| `/api/admin/analytics` | GET | `?days=7\|30\|90` — KPIs (+half-vs-half growth), revenue by day, orders by hour, POS-vs-online + payment-method splits, top items, revenue by location. Paid orders only. |
| `/api/admin/customers` | GET | Café users with order count, spend, last-order date. |
| `/api/admin/feedback` | GET | Feedback list + average + 1–5 star distribution. |
| `/api/brand` | PUT | Update white-label config (name, colors, font, AI flags, store info, `locations` array — validated/JSON-stringified server-side). |
| `/api/items/import` | POST | **Bulk menu import.** Body `{items:[{name,category,price,desc?,veg?,kcal?,caffeine?,tags?,signature?}], generateImages?}` (≤200 rows). Upserts by id `<slug>-<name-slug>`; if that id already exists under a **different category** it disambiguates to `<slug>-<category>-<name-slug>` (so the same name in two categories makes two items, not an overwrite). Creates missing categories, assigns images (AI via `generateMenuImage` when requested + keyed, else `imageFor`). Returns `{created, updated, aiImages, errors, aiAvailable}`. |
| `/api/discounts` | GET / POST | List / create promo codes (percent 1–90; unique per tenant). |
| `/api/discounts/[id]` | PATCH / DELETE | Toggle/edit percent / delete. |
| `/api/loyalty` | GET / PUT | Get/set earn rate (0–100) and tiers (JSON). |
| `/api/loyalty/rewards` | POST | Create a reward (`discount` with `amount`, or `freeItem` with a valid `itemId`). |
| `/api/loyalty/rewards/[id]` | PATCH / DELETE | Toggle active / edit cost & amount / delete. |
| `/api/tables` | GET / POST | List (with order counts) / create a dine-in table. |
| `/api/tables/[id]` | PATCH / DELETE | Edit/toggle / delete (deactivates instead if it has orders). |
| `/api/banners` | POST | Create a storefront banner (image required, ~2 MB cap). |
| `/api/banners/[id]` | PATCH / DELETE | Edit/reorder/toggle / delete. |
| `/api/campaigns` | GET | WhatsApp mode + recent campaigns + recent messages. |
| `/api/campaigns` | POST | **Send a campaign.** Builds the audience for a segment (cap 500), personalizes + sends each via `sendWhatsApp`, marks the campaign sent, writes an audit log. |
| `/api/campaigns/segments` | GET | Segment list with live counts + campaign goals. |
| `/api/campaigns/suggest` | POST | Body `{ goal, segmentLabel, notes }` → AI/heuristic campaign copy. |
| `/api/wa/settings` | GET / PATCH | Read (secrets masked) / update WhatsApp provider, creds, toggles, mode. |
| `/api/pos/settings` | GET / PUT | Read POS config (incl. `posEnabled`) / owner-only update of `gstin`, `gstRate` (0–28), `invoicePrefix`, `kotAutoPrint`. `posEnabled` itself is superadmin-only. |

### POS (`requirePos` = `requireAdmin` **+** `tenant.posEnabled`)

The POS module lives in `lib/pos.js` (+ pure helpers in `lib/posMath.js`, unit-tested):

- **`requirePos()`** — the gate; 403 with "POS is not enabled" when the add-on is off.
- **`allocateInvoiceNo(tenantId)`** — atomic `invoiceSeq: { increment: 1 }` then `formatInvoiceNo(prefix, year, seq)` → `INV-2026-00042`. Safe under concurrent billing terminals. The sequence **resets each calendar year** (conditional `updateMany` on `invoiceYear`, concurrency-safe); a legacy tenant with `invoiceYear = 0` adopts the current year without resetting `invoiceSeq`, so existing numbers are never reissued.
- **`gstSplit(tax)`** — `{cgst, sgst}` halves; sgst gets the odd rupee; sum always equals `tax`.
- **`dayEnd(tenantId, date?)`** — one calendar day's aggregation (bills, gross, GST, byMethod, topItems, POS/online counts). The returned `date` label is the **local** calendar day (matches the query window), not `toISOString()` — which would report the previous day for timezones ahead of UTC (e.g. IST).

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/pos/orders` | GET | Last 5 POS bills (reprint drawer). |
| `/api/pos/orders` | POST | **Ring up a counter sale.** Body `{lines, paymentMethod: cash\|upi\|card, customerPhone?, discountCode?}`. Phone-matched customers earn loyalty (`buyerId`); walk-ins bill under the staff user with `skipLoyalty` (no points, no WhatsApp). Creates the order via `createOrder`, then assigns `invoiceNo` + `cgst/sgst`. |
| `/api/pos/day-end` | GET | `?date=YYYY-MM-DD` (default today) → Z-report JSON. |

Print pages (server components, `requireAdmin`, 80 mm thermal CSS, auto-`window.print()`):
`/print/invoice/[id]` (GST invoice: GSTIN header, CGST/SGST split, totals) and `/print/kot/[id]` (kitchen ticket: big items + qty, no prices). They live **outside** the admin layout so the sidebar never prints.

### Super-admin (`requireSuperadmin`)

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/super/stats` | GET | Platform totals: tenant count, active, revenue, orders, customers, top cafés, plan mix. |
| `/api/super/analytics` | GET | Full `analyzePlatform()` output + customer count + AI/heuristic `narrative`. |
| `/api/super/audit` | GET | Last 250 audit-log entries (meta JSON-parsed). |
| `/api/super/tenants` | GET | All cafés with counts (orders/users/items) + revenue. |
| `/api/super/tenants` | POST | **Provision a café.** Creates the tenant, starter categories, optional starter menu (`seedMenu !== false`), default rewards, 6 tables, and an owner (with a password, or an invite link). Audit-logged. |
| `/api/super/tenants/[id]` | PATCH | Update a café: name, status, plan, brand, store info, **`posEnabled`** (POS add-on), and AI overrides **`aiApiKey` / `aiModel` / `aiBaseUrl`** (empty string clears → plan/env defaults). Drives the **Manage** drawer in `/super/cafes`. |

### Pitch deck

| Route | Method | Gate | Purpose |
| --- | --- | --- | --- |
| `/api/pitch` | GET | public | Metadata for the latest PDF + PPTX decks + download/source URLs. |
| `/api/pitch` | POST | super | Upload a deck (multipart `file` + optional `kind`). Auto-detects pdf/pptx, version-increments, stores bytes in `PitchDeck`. Caps: PDF 15 MB, PPTX 25 MB. |
| `/api/pitch/download` | GET | public | Streams the latest **PDF** (`?inline=1` for inline). Falls back to `public/pitch-deck.pdf`. |
| `/api/pitch/source` | GET | super | Streams the editable **PPTX** source. Falls back to `public/pitch-deck.pptx`. |

### Cron

| Route | Method | Gate | Purpose |
| --- | --- | --- | --- |
| `/api/cron/nudges` | GET / POST | cron | Run reward-close + win-back nudges across cafés (see [§6](#6-whatsapp-marketing-internals)). |

---

## 8. Environment variables

Copy `.env.example` → `.env` and fill in real values. Never commit `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Prisma datasource (Postgres). Local: a Postgres URL; prod: managed Postgres. (Schema provider is `postgresql`.) |
| `NEXTAUTH_SECRET` | **Yes** (prod) | Signs the JWT session. `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | **Yes** (prod) | Canonical app URL, e.g. `https://getshoku.com`. |
| `BASE_DOMAIN` | Recommended | Apex domain used by middleware/auth to parse `<slug>.BASE_DOMAIN`. Default `getshoku.com`. |
| `NEXT_PUBLIC_BASE_DOMAIN` | Recommended | Same value, exposed to the client for building café URLs in the UI. |
| `DEFAULT_TENANT_SLUG` | Optional | Fallback café for apex/localhost/unknown hosts. Default `cbtl`. |
| `COOKIE_DOMAIN` | Prod only | Set to `.getshoku.com` to share the login session across café subdomains. Leave **unset** locally (NextAuth host-only defaults). |
| `OPENAI_API_KEY` | Optional | Enables LLM upgrades for `aiInsights` + `aiMessage`. |
| `LLM_API_KEY` | Optional | Alternative to `OPENAI_API_KEY` (checked second). |
| `LLM_BASE_URL` | Optional | OpenAI-compatible base URL. Default `https://api.openai.com/v1`. |
| `LLM_MODEL` | Optional | Global default model. Default `gpt-4o-mini`. |
| `LLM_MODEL_STARTER` / `LLM_MODEL_GROWTH` | Optional | Per-plan default models (both default `gpt-4o-mini`). Overridden per café by `tenant.aiModel`. |
| `LLM_MODEL_ENTERPRISE` | Optional | Enterprise-plan default model. Default `gpt-4o`. |
| `LLM_IMAGE_MODEL` | Optional | Image-generation model for the menu importer. Default `gpt-image-1`. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional | Enables live Razorpay checkout; unset = demo "paid" flow. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Verifies `/api/payments/razorpay/webhook` signatures. |
| `CRON_SECRET` | Optional | Bearer for `/api/cron/nudges` (via `?key=` or `x-cron-key`) when no superadmin session. |

Without any LLM variable, all AI features run on their built-in heuristics. Per-café AI settings (`tenant.aiApiKey` / `aiModel` / `aiBaseUrl`, superadmin-set) take precedence over all of these — see [§5](#5-the-ai-layer).

---

## 9. Local setup & development

```bash
cd shoku
npm install          # also runs `prisma generate` (postinstall)
npm run setup        # prisma db push  +  node prisma/seed.js
npm run dev          # http://localhost:3000
```

`npm run setup` = `prisma db push && node prisma/seed.js`. You can also run them separately:

```bash
npm run db:push      # prisma db push  (creates/updates the Postgres schema)
npm run seed         # node prisma/seed.js
```

### Seed accounts (all password `password`)

| Login | Role | Where |
| --- | --- | --- |
| `super@shoku.app` | superadmin | apex host → `/super` |
| `demo@shoku.app` | owner (CBTL) | `cbtl` café → `/admin` |
| `owner@bluetokai.app` | owner (Blue Tokai) | `bluetokai` café |
| `aarav@example.com`, `diya@example.com` | customers (CBTL) | storefront |

The seed provisions a superadmin + two demo cafés (CBTL = default/enterprise, Blue Tokai = growth) with menus, banners, discounts (`WELCOME10`, `SHOKU15`), rewards, tables, feedback, and ~14 days of synthetic orders.

**Richer demo data** (what makes the Analytics page and POS day-end look real in demos):

```bash
node scripts/seed-demo-data.js [slug=cbtl] [days=30]
```

Generates ~350–450 paid orders over the window with café-realistic hourly peaks, a weekend lift, a gentle upward trend, a ~45% POS / 55% online mix (cash/UPI/card), sequential invoice numbers (bumps `invoiceSeq`), and per-location labels when the tenant has `locations`. It refuses to run if the café already has >150 orders in the window, so it won't double-seed.

### Local subdomains

`localhost` resolves to the default tenant. To exercise real subdomain routing locally, map café hosts to loopback (e.g. `cbtl.localhost`, `bluetokai.localhost` via `/etc/hosts`) and set `BASE_DOMAIN=localhost` — or just rely on `DEFAULT_TENANT_SLUG` for single-tenant testing.

### Rebuilding the schema

Most changes apply cleanly with `prisma db push`. A destructive change (dropping a column, tightening a constraint on existing data) prompts for confirmation; use:

```bash
npx prisma db push --accept-data-loss
```

The flag is required for those rebuilds; existing data is preserved (the deploy script also takes a timestamped backup first). `prisma db push` is used throughout instead of migrations — there is no `prisma/migrations/` directory.

### Build

```bash
npm run build        # prisma generate && next build
npm start            # next start
```

---

## 10. Deployment

Production runs the Next.js app behind **PM2 + Nginx** with **wildcard TLS** for café subdomains. The repo ships ready-made scripts and docs — reference these rather than duplicating:

| Doc | Covers |
| --- | --- |
| `DEPLOY_HOSTINGER.md` | End-to-end Hostinger KVM VPS deploy (Node + PM2, Nginx/Apache detection). |
| `DEPLOY.md` | General hosting options incl. Docker/GHCR image + GitHub Actions CI. |
| `SUBDOMAINS.md` | Wildcard DNS, `COOKIE_DOMAIN`, and per-café bring-up. |
| `WILDCARD_TLS.md` | Zero-touch subdomains via one wildcard cert (DNS-01) + one Nginx block. |
| `GIT_SETUP.md` | Pushing the repo to GitHub. |
| `MULTI_TENANT_PLAN.md` | The original multi-tenant architecture decisions. |
| `POS-PHASE1-SPEC.md` | POS Phase 1 build spec (counter billing, KOT, GST invoices, day-end). |
| `REGRESSION-TEST-PLAN.md` (+ `.pdf`) | Priority-tagged regression suite; §9 pins the nine audit-fix regression cases. |

### Scripts

| Script | What it does |
| --- | --- |
| `scripts/deploy.sh` | First-time server provisioning. |
| `scripts/update.sh` | Pull + redeploy: `git pull` → `npm ci` → ensure env vars → **back up `prisma/dev.db`** → `prisma db push --accept-data-loss` → run `migrate-to-multitenant.js` (idempotent) → `npm run build` → `pm2 restart`. |
| `scripts/add-cafe.sh <slug>` | Per-café Nginx site + Certbot cert. **Only needed if you are not using wildcard TLS** — with `WILDCARD_TLS.md` set up, a café created in `/super` is instantly live with no per-café step. |
| `scripts/nginx-shoku-wildcard.conf` | The single wildcard Nginx server block. |

Typical redeploy: `./scripts/update.sh`. Two routing models exist — **wildcard TLS** (one cert, zero per-café steps; preferred) or **per-café** (`add-cafe.sh` per slug). Both require a wildcard DNS record `*.shoku → <server-ip>`.

---

## 11. Extending Shoku

### Add a café

Sign in as superadmin on the apex host → `/super` → create a café. This calls `POST /api/super/tenants`, which provisions the tenant, starter categories, optional starter menu, default rewards (₹75 off; + free latte if seeded), 6 dine-in tables, and an owner — either with a password or an **invite link** (`/set-password?token=…`, 7-day TTL). With wildcard TLS the storefront is live immediately at `https://<slug>.BASE_DOMAIN`.

### Add a menu item

As a café owner → `/admin/menu`, or directly:

```bash
POST /api/items
{ "name": "Cold Brew", "categoryId": "<tenantId>-ice-blended", "price": 260,
  "tags": ["cold","vegan"], "kcal": 15, "caffeine": 130,
  "sizes": [{ "name": "Regular", "price": 260 }] }
```

The handler verifies the category belongs to the tenant, generates a tenant-prefixed id, and JSON-encodes `ingredients/allergens/tags/sizes`. Toggle visibility with `PATCH /api/items/[id] { "live": false }`. Items referenced by past orders can't be deleted (409) — hide them instead.

### Add a new admin page + API route

Follow the established pattern:

```js
// app/api/<feature>/route.js
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const rows = await prisma.<model>.findMany({ where: { tenantId: gate.tenantId } });
  return NextResponse.json(rows);
}
```

Rules: always `force-dynamic`; always gate; always scope reads **and** single-row mutations by `gate.tenantId` (use a `findFirst({ where:{ id, tenantId } })` ownership check before update/delete, or `updateMany`/`deleteMany` and treat `count === 0` as 404). Add the UI under `app/admin/<feature>/page.js`.

### Switch a café to live WhatsApp

As the owner → café settings (or `PATCH /api/wa/settings`): set `provider` (`meta`/`twilio`/`bsp`), fill the provider's `config` keys, set `enabled: true`. Once `waMode(tenant)` returns the provider name (i.e. valid creds present), campaigns/triggers/nudges dispatch live — **no code change**. Secrets are masked on read and merged on write. Toggle `triggers`/`nudges` independently.

### Host / upload the pitch deck

As superadmin → upload via `POST /api/pitch` (multipart `file`, optional `kind=pdf|pptx`). The latest PDF is served publicly at `/api/pitch/download` (and embedded on `/pitch`); the editable PPTX source is superadmin-only at `/api/pitch/source`. Both fall back to static files in `public/` (`pitch-deck.pdf` / `pitch-deck.pptx`) when nothing is uploaded.

---

## 12. Conventions & gotchas

- **Arrays/JSON are stored as `String`.** `Item.ingredients/allergens/tags/sizes/diet`, `Tenant.tiers/waConfig/locations`, `AuditLog.meta`, and `Campaign`/`Message` payloads are JSON strings (a portability choice from the SQLite prototype, kept on Postgres). Read them through helpers (`parseItem`, `parseTiers`, `parseCfg`) which fall back to safe defaults on parse failure. Always `JSON.stringify` on write. (A future cleanup could switch these to Postgres native `Json` columns.)
- **Money is an integer in ₹.** Prices, totals, tax, discounts, reward `amount` — all integer rupees, no decimals/cents. Tax and the 5% "reward" accrual are computed server-side in `POST /api/orders`; never trust client totals.
- **Every API route is `force-dynamic`.** Tenant and session must be resolved per request, so nothing is statically cached.
- **Heuristic-first AI.** Every AI feature has a deterministic fallback and never hard-fails on a missing/broken LLM. `lib/ai.js` is intentionally never LLM-backed. `llmComplete` returns `null` on any error so callers degrade gracefully.
- **Messaging never blocks core flows.** `sendWhatsApp` and `logAudit` are designed to never throw; order placement and audited mutations proceed even if messaging/logging fails.
- **Tenant isolation is manual.** There's no automatic row-level security — correctness depends on every query scoping `tenantId`. New code must follow the gate + ownership-check pattern.
- **Superadmin is host-scoped.** It can only log in on the apex host and is excluded from café-admin gates; café users can only log in on their own subdomain.
- **`prisma db push`, not migrations.** There's no migrations folder — the deploy runs `db push`. On Postgres, additive changes apply cleanly; destructive ones need `--accept-data-loss`, and the deploy script backs up the DB first. (For a stricter prod flow, adopt `prisma migrate`.)
- **Deletes prefer soft-handling.** Items in past orders are un-deletable (409, hide instead); tables with orders are deactivated, not deleted — preserving order history.
- **`COOKIE_DOMAIN` is production-only.** Setting it locally breaks login (it forces `secure` cookies). Leave it unset for dev.
- **Reserved subdomains.** `www, console, admin, api, app, mail, assets, static, super` are never café slugs (enforced in both `middleware.js` and `lib/tenant.js`; keep the two lists in sync).
</content>
</invoke>
