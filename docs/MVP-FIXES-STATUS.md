# Shoku MVP — Fixes & Enhancements: Status

Status of the MVP punch-list, verified against the codebase on 2026-07-07.

**Legend:** ✅ Done · 🟡 Partial (some shipped, rest scoped below) · ⬜ To do (later)
**Effort:** S = small · M = medium · L = large

| # | Item | Status | Notes | Effort |
| --- | --- | --- | --- | --- |
| 1 | Menu photo upload → auto-populate dishes (OCR/AI) | ⬜ To do | Reuses the existing import preview + image pipeline; new part is the vision call + parse. | M–L |
| 2 | Auto-generate images for dishes with no photo | ✅ Done (bulk) 🟡 | AI gen + curated fallback wired into CSV import. Remaining: add a per-item "Generate image" button in the manual editor. | S |
| 3 | Manual review/edit before menu goes live | 🟡 Partial | Import shows a preview table + items have a `live` toggle. Remaining: import as **draft (`live:false`)** + a publish/review screen. | S–M |
| 4 | Tiered cashback % (not flat) + margin flag | ⬜ To do (decision) | **Flag:** today every order already gets a **flat 5% instant "reward" off total** *plus* 10 pts/₹100 — a real margin hit. Decide: make instant reward configurable (default 0) + tiered earn %. | M |
| 5 | Points expiry + redemption at checkout | ✅ Redemption done 🟡 | Redemption works (atomic reserve). Remaining: **expiry** (needs expiry date/ledger + sweep job). | M |
| 6 | Fix: Place Order button hidden after adding to cart | ✅ Done | Browser-repro'd on current code: the sticky Pay/Place-order bar is fully visible and unobstructed. Fixed by the checkout refactors (guest card, loading-gate). | S |
| 7 | Full UI audit (overlaps, responsive, spacing, fonts) | ⬜ To do | Live pass across mobile/desktop → punch-list. | M |
| 8 | Fix meta tags (still pointing to localhost) | ✅ Done | Added `metadataBase` to `app/layout.js` (getshoku.com, env-overridable). OG/Twitter previews now resolve correctly. | S |
| 9 | Replace placeholder testimonials/logos | ✅ Done (legal risk removed) | Swapped real chain names (Blue Tokai/Third Wave/CBTL) for fictional café names; relabelled marquee "Built for independent cafés". Real testimonials still to gather from live customers. | S (content) |
| 10 | Test Shoku AI search accuracy + fallback | ✅ Fallback done 🟡 | `lib/ai.js` is rule-based → always works with no provider (fallback inherent). Remaining: **accuracy/relevance test pass**. | S |
| 11 | WhatsApp demo → live (updates, nudges, consent) | ⬜ To do | Provider adapters (Meta/Twilio/BSP) + consent check (`waOptIn`) exist. Remaining: provider creds + template approval + a consent opt-in UI. | M |
| 12 | Confirm payment gateway is live, not placeholder | 🟡 Partial | Razorpay scaffold is real (HMAC verify, webhook). Remaining: **set live keys + register webhook + one real ₹ test**. | S (config) |
| 13 | Refund / cancellation flow | ⬜ To do | Only a `cancelled` status today — no Razorpay refund, no customer cancel, no points reversal. | M |
| 14 | In-app order status updates (not WhatsApp-only) | ⬜ To do | Account page shows status **statically on load**. Remaining: polling/SSE so preparing→ready updates in-app. | S–M |
| 15 | Automate loyalty nudges (currently manual) | ✅ Done | Engine + `scripts/nudges-cron.sh` wrapper. Remaining is one ops step: add the crontab line (documented in the script header) + set `CRON_SECRET`. | S (ops) |
| 16 | Location-wise menu/pricing (multi-outlet) | ⬜ To do | Locations exist for picker + analytics only; menu/price are **tenant-wide**. Per-outlet menu/price/availability needs schema + UI + storefront resolution. | L |
| 17 | Preview step before confirming CSV import | ✅ Done | Import modal already shows a preview table ("N items ready") before confirm. | — |

---

## Summary

- **✅ Done / effectively done:** #17 (CSV preview), #10 (AI fallback), plus the shipped halves of #2 (auto-images), #5 (redemption), #15 (nudge engine), #12 (payment scaffold).
- **🟡 Partial — small remainder:** #2, #3, #5, #10, #12, #15.
- **⬜ To do (later):** #1, #4, #6, #7, #8, #9, #11, #13, #14, #16.

## Recommended order when we resume

1. **Quick wins (S, low-risk):** #8 meta `metadataBase`, #12 live payment keys + test, #15 schedule nudge cron, #9 real testimonials/logos.
2. **Browser pass:** #6 repro + fix Place Order, #7 UI audit.
3. **Decision first:** #4 cashback/margin model.
4. **Net-new by impact:** #14 in-app status → #13 refunds → #5 points expiry → #11 WhatsApp live → #1 OCR upload → #16 per-location menu (largest, own project).
