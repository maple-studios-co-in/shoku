# Shoku — Competitive Enhancements Plan (vs Petpooja)

Derived from the Petpooja demo (Shakti Foods, 23-min recording, 2026-07-06) and mapped
against the current Shoku codebase. Goal: close the credibility gaps that lose
restaurant deals **without** turning Shoku into a full ERP or losing our edge
(white-label direct ordering, 0% commission, AI, WhatsApp, multi-tenant SaaS).

**Legend:** effort S ≈ ≤1 wk · M ≈ 1–2 wk · L ≈ 3–4 wk (small team). Sequenced by impact ÷ effort.

---

## Where we stand (data model reality)

- `Item` has `sizes` (JSON) + a hardcoded `milk` list — **no modifier/add-on groups**.
- `OrderItem` stores `size` + `milk` only — **no modifier selections**.
- `live` is a single boolean — **no per-channel availability**.
- **No models** for raw materials, recipes, stock movements, suppliers, purchases, table areas.
- We already have: POS Phase 1 (billing, KOT, GST invoice, day-end), analytics, loyalty,
  WhatsApp, tables+QR, multi-tenant, per-café AI. These are the foundation each phase extends.

---

## Phase 1 — Menu depth: Variations + Add-on modifier groups  ⭐ (L)

The #1 gap. Their menu had variations (8pc ₹280 / 12pc ₹500) **and** multi-select add-on
groups with min/max ("Toppings — max 2 of 6", sauce groups). Ours can't express this, and
no serious food menu (pizza, rolls, thali, customizable drinks) works without it.

**Schema**
```
model ModifierGroup { id, tenantId, name, min Int, max Int, required Bool, sort }
model Modifier      { id, groupId, label, price Int, veg Bool, sort, available Bool }
model ItemModifier  { itemId, groupId }          // many-to-many: attach shared groups to items
// Item.sizes already exists → formalize as "variations" (name + price); no schema change needed.
// OrderItem: add `modifiers String @default("[]")` (JSON snapshot: [{group,label,price}]).
```

**Server** — extend `resolveUnitPrice(item, {size, modifiers})` to price = variation price +
Σ modifier prices, and **validate min/max per group server-side** (never trust the client).
This slots into the existing `lib/menu.js` + `lib/orders.js` pricing chokepoint.

**UI** — (a) admin item editor: define variations + attach modifier groups; a groups manager.
(b) storefront item page + (c) POS: a modifier modal (like the demo) enforcing min/max.
(d) cart/KOT/invoice lines render the chosen modifiers.

**Why first:** unavoidable for restaurant credibility, and everything downstream (KOT, reports,
recipe consumption) depends on knowing exactly what was ordered.

---

## Phase 2 — POS billing depth + cross-channel availability (M)

High demo impact, moderate effort — makes the POS feel "real" next to theirs.

- **Billing ops:** split bill, complimentary, sales return/void, item-level discount, hold,
  advance/future order. Extends the existing POS ticket + `createOrder` (most are total/line math).
- **Cross-channel availability / 86-ing:** replace `Item.live` (bool) with a `channels` JSON
  (`{dinein,pickup,delivery,online}`) so an item can be off on delivery but on at the counter;
  add a **store-wide on/off** switch. This is a small schema change with big operational value.
- **Time-based availability** (available from/to) — optional add-on here.

---

## Phase 3 — Inventory & recipe (lite)  (L, shippable in slices)

Big gap (they had raw-material stock, recipes with auto-consumption, purchases, wastage, AI
recipe suggestions). Ship a **lite** version, not a warehouse system.

**Schema**
```
model RawMaterial  { id, tenantId, name, unit, stock Float, reorderLevel Float, costPerUnit Int }
model Recipe       { id, itemId, lines String }   // JSON [{rawMaterialId, qty}]
model StockMovement{ id, tenantId, rawMaterialId, type, qty Float, note, at }  // purchase|consume|waste|adjust
```

**Slices (ship in order):**
1. Raw materials + manual stock + low-stock alerts (S).
2. Recipes → **auto-consume on each paid order** (hooks into `settlePaid`) (M).
3. Purchases (simple GRN) + wastage entry (M).
4. **AI recipe suggestion** — reuse the `lib/llm.js` bridge to draft a recipe from the item
   name/ingredients. Matches their AI feature and plays to our AI strength (S once 1–2 done).

---

## Phase 4 — Dine-in / table management depth (M–L)

They had table **areas/floors** and running tables. We have tables + QR but no floor/running bill.

- `Table` gets `area`/`floor`; a **running-table view** (open bill per table, add rounds, KOT
  per round), merge/transfer/split tables, then settle. Builds on existing tables + POS ticket.

---

## Phase 5 — Reporting suite + CRM (M)

Extend, don't rebuild — we already have analytics + day-end + `lib/segments.js`.

- **Reports:** typed reports (bill / order / KOT / item / category / customer / discount) with
  date-range + **CSV export**. Mostly queries over existing `Order`/`OrderItem`.
- **CRM:** customer profile (visit history, spend, favourite items, loyalty tier) + segments
  (partly exists via loyalty + segments). Surface as a proper Customers/CRM view.

---

## Phase 6 — Aggregator ingestion (Zomato/Swiggy)  (L+, strategic — decide)

They consolidate aggregator orders in one POS. We have none. **Tension:** our pitch is
"0% commission / go direct," but restaurants still run aggregators. Position as: *"Run Zomato/
Swiggy from Shoku while you migrate regulars to your own 0% app."* Heavy (partner APIs +
onboarding + menu sync); do **last**, and only if pursuing full-service restaurants.

---

## What we must NOT lose (our moat — they don't have these)

White-label branded customer app · 0% commission direct ordering · AI ordering assistant +
food intelligence · WhatsApp marketing/automation · multi-tenant SaaS + per-café AI. Every
phase should keep these first-class, not bury them under ERP surface area.

---

## Recommended sequence & rough timeline

| Order | Phase | Effort | Rationale |
| --- | --- | --- | --- |
| 1 | **Variations + modifier groups** | L | Table-stakes; unblocks KOT/reports/recipes |
| 2 | **POS billing depth + channel availability** | M | Cheap, huge demo lift |
| 3 | **Inventory + recipe (lite)** — slices 1→4 | L | Deepest gap; ship incrementally |
| 4 | **Table/floor + running bills** | M–L | Needed for full-service dine-in |
| 5 | **Reports + CRM** | M | Extends what we have |
| 6 | **Aggregator ingestion** | L+ | Strategic; decide before starting |

**Target:** Phases 1–2 make Shoku demo-credible vs Petpooja for café/QSR; +3–4 for full-service
restaurants like Shakti Foods; 5–6 for parity depth.

## Next step

Recommend spinning **Phase 1** into a build spec (same format as `POS-PHASE1-SPEC.md`) —
exact schema migration, `resolveUnitPrice` changes, the modifier-modal UX, and a test plan —
then implement in chunks behind the existing plan-gating.
