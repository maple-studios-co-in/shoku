# Enhancement Phase 1 — Variations + Add-on Modifier Groups

**Status:** draft spec · **Source:** Competitive Enhancements Plan, Phase 1 (vs Petpooja)
**Target user:** any café/restaurant tenant whose menu has customizable items (pizza toppings,
roll fillings, thali add-ons, milk/syrup choices, portion sizes).
**Why first:** it's the #1 gap in the Petpooja demo and everything downstream (KOT lines,
reports, recipe consumption) depends on capturing *exactly* what was ordered.

---

## 1. Scope

**In:** reusable **modifier groups** (shared across items) with min/max/required rules;
per-item **variations** (formalizing the existing `sizes`); server-authoritative pricing +
validation; selection UX on the storefront item page **and** the POS; modifiers rendered on
cart lines, KOT, and the GST invoice; a migration that turns today's hardcoded milk list into
a normal modifier group.

**Out (later):** nested/conditional modifiers, per-modifier inventory linkage (Phase 3),
per-channel modifier availability (folds into Phase 2), combo/meal builders.

## 2. What already exists (build on, don't duplicate)

- `Item.sizes` (JSON `[{name,price}]`) — becomes the canonical **variations** list; no new field.
- `resolveUnitPrice(item, wantSize, wantMilk)` in `lib/menu.js` — the **single** price chokepoint,
  already called by `createOrder`. We extend its signature; nothing else computes line price.
- `OrderItem` (`size`, `milk`, `unit`, `qty`) — add one JSON field; keep `milk` for old rows.
- Cart `lineKey(item, opts)` in `components/Providers.js` — extend so identical items with
  different modifiers are distinct lines.
- `MILK_OPTIONS` in `lib/menu.js` — the seed source for the migrated "Milk" group.
- Item editor `/admin/menu`, storefront `/item/[id]`, POS ticket `/admin/pos` — the three
  surfaces that gain selection UI.

## 3. Data model changes (Prisma)

```prisma
model ModifierGroup {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  name      String                       // "Toppings", "Milk", "Spice level"
  min       Int      @default(0)         // min selections
  max       Int      @default(1)         // max selections (1 = single-select)
  required  Boolean  @default(false)     // must choose >= min
  sort      Int      @default(0)
  modifiers Modifier[]
  items     ItemModifier[]
  @@index([tenantId])
}

model Modifier {
  id        String   @id @default(cuid())
  groupId   String
  group     ModifierGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  label     String                       // "Extra cheese"
  price     Int      @default(0)         // ₹ delta (may be 0)
  veg       Boolean  @default(true)
  available Boolean  @default(true)
  sort      Int      @default(0)
}

model ItemModifier {                     // many-to-many: attach a shared group to an item
  itemId  String
  groupId String
  sort    Int    @default(0)
  @@id([itemId, groupId])
  @@index([groupId])
}

model OrderItem {
  modifiers String @default("[]")        // JSON snapshot: [{group,label,price}] — historical, immutable
}
```

Notes: groups are **tenant-level and reusable** (one "Extra shot" group on many drinks), exactly
like the demo's shared add-on groups. `OrderItem.milk` stays nullable for backward compatibility;
new orders record the milk choice inside `modifiers` once migrated.

## 4. Pricing & validation (server-authoritative — the core of this phase)

Extend the chokepoint:

```
resolveUnitPrice(item, { size, modifiers }) -> { size, modifiers: [{groupId, groupName, modifierId, label, price}], unit }
  unit = variationPrice(size)  +  Σ modifier.price   // all prices read from DB, never the client
```

`createOrder` (`lib/orders.js`) does the resolve **and** validates each attached group before
accepting the line:
- selected count in group ∈ `[required ? max(min,1) : 0 .. max]`; else **400** with the group name.
- every selected `modifierId` must belong to an attached group and be `available`.
- unavailable/removed modifiers → reject (don't silently drop, so the customer isn't overcharged/undercharged).

This is the same "catalog-only pricing" invariant already enforced for size — extended to modifiers.
Unit-tested in `lib/menu.test.js` (pure) + `createOrder` validation path.

## 5. API

| Route | Method | Gate | Purpose |
|---|---|---|---|
| `/api/modifier-groups` | GET / POST | requireAdmin | list / create a group (+ its modifiers) |
| `/api/modifier-groups/[id]` | PATCH / DELETE | requireAdmin | edit group + modifiers; delete (blocked if attached — detach first) |
| `/api/items/[id]` | PATCH | requireAdmin | now also accepts `variations` + `modifierGroupIds` (attach/detach) |
| `/api/menu` | GET | public | each live item includes its attached groups + modifiers (storefront/POS render) |
| `/api/orders`, `/api/pos/orders` | POST | (existing) | line body gains `modifiers: [{groupId, modifierId}]`; validated as §4 |

## 6. UI

- **`/admin/menu` item editor:** a **Variations** editor (rename of sizes) + an **Add-on groups**
  section to attach existing groups or create one inline. Plus a standalone **Modifier groups**
  manager (list, min/max/required, modifiers with prices).
- **Storefront `/item/[id]`:** render each group; single-select (max 1) as pills, multi-select as
  checkboxes; enforce min/max in-UI; live price updates; "Add" disabled until required groups satisfied.
- **POS `/admin/pos`:** a **modifier modal** on item tap (matches the demo) — same rules, keyboard-fast.
- **Cart / KOT / invoice:** each line shows chosen modifiers under the item name; KOT groups them
  for the kitchen; price rolls up per line.
- **Cart key:** extend `lineKey` to include a stable hash of selected modifier ids so
  "Latte + oat + extra shot" and "Latte + oat" are separate lines.

## 7. Migration & backward compatibility

- One-off script: for each tenant, create a **"Milk"** `ModifierGroup` (`min 1, max 1, required`)
  from `MILK_OPTIONS`, and attach it to items in drink categories (reuse the `foodImages`
  drink-keyword heuristic / category check). Existing `Item.sizes` are already the variations — no change.
- `OrderItem.milk` on historical rows is untouched; UI reads `milk` when `modifiers` is empty.
- Items with no attached groups behave exactly as today (zero regression for simple menus).

## 8. Roles

Reuse `requireAdmin` (owner + staff manage groups). No new role. Storefront selection is public.

## 9. Acceptance criteria (Phase 1 done =)

1. An owner can create a "Toppings" group (max 2, optional) + a "Size" variation and attach the
   group to a pizza; it appears on storefront and POS.
2. A customer/cashier selects a variation + modifiers; the **line price equals variation + modifiers**,
   computed server-side; tampering with posted prices has no effect.
3. Selecting more than `max`, or skipping a `required` group, is blocked (UI + server 400).
4. The order, KOT, and GST invoice all show the chosen modifiers; order history renders them from the
   immutable snapshot even after the menu changes.
5. Same item with different modifiers = separate cart lines; identical selections merge + increment qty.
6. A café with a plain menu (no groups) sees **no change** and no errors (migration safe).

## 10. Build plan (sequenced, ~3 weeks focused)

1. **Schema + migration** — models, `OrderItem.modifiers`, milk→group migration script. (2–3d)
2. **Pricing core** — extend `resolveUnitPrice` + `createOrder` validation; unit tests. (2–3d)
3. **Admin** — modifier-groups manager + item-editor attach/variations UI + APIs. (4–5d)
4. **Storefront item page** — selection UI, live pricing, min/max gating, cart `lineKey`. (3–4d)
5. **POS modal** — reuse the storefront selector, keyboard-fast. (2–3d)
6. **Render everywhere** — cart, KOT, invoice, order history + admin order detail. (2–3d)
7. **Test pass** — unit (pricing/validation) + e2e (order with modifiers, tamper attempt, plain-menu regression). (2d)

## 11. Test plan (regression-suite additions)

- **Unit (`lib/menu.test.js`):** `resolveUnitPrice` sums modifiers; ignores client price; drops unknown
  modifier; variation fallback still holds.
- **Integration (`createOrder`):** rejects over-max / missing-required / unavailable-modifier; accepts
  valid; total reflects modifiers; snapshot persisted.
- **E2E:** storefront add-with-modifiers → cart shows them → checkout → invoice/KOT render them;
  price-tamper POST is neutralized; plain item still orders with zero groups.

## 12. Open decisions

- **Keep `OrderItem.milk` or fully migrate?** Recommend keep the column (read-only legacy) and route
  new selections through `modifiers` — least risk.
- **Group scope:** tenant-shared (recommended, matches demo) vs per-item only. Shared chosen.
- **Per-channel modifier availability** deferred to Phase 2 (channel work) to keep this phase tight.
