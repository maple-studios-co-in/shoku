# Shoku — Productionization & Organisation Plan

**Inputs:** team of 4–5 (can hire) · first 10 paying customers in 3 months · both segments
served as **two SKUs on one platform** · all three funding scenarios compared.
**Benchmark:** Petpooja — what they have as an organisation that we lack, and what closing
each gap costs. (Petpooja figures are public-knowledge estimates; verify before quoting.)

---

## 1. The honest starting point (what "production" means vs where we are)

The codebase is a good MVP, but several things are **not chargeable-customer grade** yet:

| Area | Today | Production bar |
| --- | --- | --- |
| Database | SQLite file on one VPS | Managed Postgres (Neon/RDS/Supabase), point-in-time recovery. Prisma makes this a config+migration job, not a rewrite |
| Deploys | PM2 + deploy-live.sh (good start) | CI (GitHub Actions: lint→test→build), staging env, then the same script |
| Testing | 36 unit tests, manual E2E | CI-gated suite + the regression plan run per release; a QA owner |
| Observability | /api/health only | Sentry (errors), uptime monitor + alerts, structured logs, weekly restore drill |
| Payments | Razorpay scaffold; **mock-paid fallback if keys absent** | Live keys, webhook registered, **mock path hard-disabled in prod**, refunds flow |
| POS resilience | Online-only | **Offline-first is table stakes for restaurant POS** (Petpooja works when WiFi dies). PWA + local queue first; desktop app later |
| Security/legal | Solid app-level auth/tenancy | NextAuth vuln upgrade; DPDP Act basics (privacy policy, consent, deletion/export); GST invoice format legal review; ToS/MSA; per-tenant data export |
| Media | Images on local disk (`public/uploads`) | Object storage (R2/S3) — breaks on multi-node otherwise |
| Rate limiting | In-memory (single node) | Fine now; Redis when >1 node |
| Support | None | WhatsApp-first support channel, onboarding checklist, response-time targets |

**P0 sprint (weeks 1–3, ~2 engineers):** Postgres migration → CI + staging + Sentry/uptime →
payments live + kill mock fallback → NextAuth upgrade → automated backups + restore drill →
the 4 MVP quick-wins (meta tags, Place-Order bug, testimonials/logos, nudge cron). This is
the minimum before invoicing strangers.

## 2. What Petpooja has as an organisation that we lack

Product is maybe 20% of their moat. The rest:

1. **A field sales machine.** Feet-on-street reps + **channel partners/resellers in 100+ cities**.
   Restaurant software in India is sold in person, in local language, often over chai.
2. **24/7 phone support in local languages.** Billing downtime = lost revenue; owners buy the
   phone number as much as the software. Support is likely their largest department.
3. **On-site onboarding & training.** They physically set up printers, import menus, train staff.
4. **Offline-first product.** A desktop-class POS that keeps billing without internet.
5. **Hardware ecosystem.** Printers/cash drawers/KDS bundles + installation.
6. **Integration marketplace.** 200+ integrations (Zomato/Swiggy, payment, Tally, loyalty…) —
   each one a reason not to churn.
7. **13 years of brand + case studies** (~100k outlets). Owners buy what the neighbour runs.
8. **An engineering org behind the product:** QA teams, DevOps/SRE, security/compliance,
   release management — the invisible stuff that makes 100k concurrent billing counters boring.
9. **Capital efficiency:** famously lightly-funded and profitable — the bar is a business that
   *sells* its way to scale, not one that burns to it.

**Useful planning anchor:** mature vertical-SaaS-in-India ratio ≈ **1 employee per 100–150 live
outlets** (sales+support heavy). 1,000 outlets ≈ a 10–15 person company; 10k ≈ 80–120.

## 3. Two SKUs, one platform (how "both consumers" works without splitting focus)

- **SKU A — Shoku Direct** (cafés/QSR): white-label ordering app + loyalty + WhatsApp + light
  counter POS. **Sellable in 3 months.** Differentiators Petpooja doesn't have: 0% commission
  direct channel, branded app, AI assistant, WhatsApp automation.
- **SKU B — Shoku POS** (full-service restaurants): needs enhancement Phases 1–4 (modifiers,
  billing depth, inventory-lite, tables/floors) **plus offline mode** before it can survive a
  head-to-head Petpooja demo (we watched one — today we lose it).

**Sequencing:** months 0–3 sell SKU A only (founder-led). Months 3–9 build Phases 1–2 + offline,
upsell POS to the SKU-A base, pilot 3–5 friendly full-service restaurants. Month 9+ sell SKU B
openly. Same codebase, same admin, two pitches — the discipline is **not demoing SKU B before
it's credible.**

## 4. The 3-month plan → 10 paying customers (team of 4–5)

- **Roles:** 2 eng (1 product, 1 platform/P0s) · 1 founder on sales full-time · 1 ops/support+
  onboarding (owns every install end-to-end) · flex 5th (QA + content + demo data).
- **Weeks 1–3:** P0 sprint above. Sales prep in parallel: one city, list of 150 target cafés,
  pricing card, the `/demo` brochure + ad set (done), reference demo café.
- **Weeks 3–12:** founder-led sales — walk-ins/DMs/referrals: 150 contacts → ~30 demos → **10–15
  closes** (Direct SKU at ₹1,999–2,999/mo or ₹20–25k/yr prepaid; POS add-on +₹1,499/mo).
  White-glove onboarding: **we** import the menu (CSV/AI tools exist), we print the QR stands,
  WhatsApp support group per café, weekly check-in call.
- **Success = 10 paying + <2 churn + a support load you can measure.** These 10 write the
  case studies that replace the placeholder testimonials.

## 5. Funding scenarios (all three, as requested)

| | **Bootstrapped** | **Angel ₹50L–1.5Cr** | **Seed ₹4–8Cr** |
| --- | --- | --- | --- |
| Team by month 12 | 5–6 (current + 1 support) | 8–10 (+2 field sales, +1 support, +1 eng/QA) | 18–25 (sales mgr + 6–8 reps, support pod ×3, +3 eng, QA, DevOps) |
| Geography | 1 city, inbound + founder sales | 1 city **deep** (own it), pilot 2nd | 2–3 cities + channel-partner pilot |
| Product depth | SKU A + Phase 1–2 only | + offline mode + inventory-lite (SKU B pilot) | + aggregator integrations, integrations marketplace start, hardware bundle partner |
| 12-mo outlet target | 40–80 | 150–300 | 800–1,500 |
| MRR target (12 mo) | ₹1–2L | ₹4–8L | ₹15–30L |
| Infra spend/mo | ₹5–15k (managed PG + VPS + Sentry free tiers) | ₹20–50k (+staging, monitoring, support tooling) | ₹1–2L (multi-node, Redis, data pipeline, security audit) |
| Main risk | Founder burnout; support swallows eng time | Hiring wrong first reps | Scaling support quality; burning before sales machine repeats |
| What it proves | Willingness-to-pay + retention | **Repeatable sales motion in one city** (the seed metric) | City playbook copies; org survives founders stepping out of sales |

Indicative India salary anchors: field sales rep ₹3–5 LPA + incentives · support agent ₹2.5–4 LPA ·
mid engineer ₹12–20 LPA · senior ₹25–40 LPA · QA ₹6–12 LPA. (The unit-economics doc already
models per-café gross margin at 78–81% — CAC/LTV math lives there.)

## 6. Org chart evolution (the Petpooja-scale shape)

- **0→10 outlets (now):** everyone does everything; founder sells.
- **10→100:** first dedicated **support/onboarding hire** (before more engineers — support debt
  kills vertical SaaS faster than tech debt); 1–2 field reps; QA ownership (person or rigor).
- **100→1,000:** teams form — Eng (platform / POS+offline / integrations), QA+release, Sales
  (manager + city reps), Support pod w/ SLAs + local languages, Onboarding/training, 1 finance/ops.
  Channel partners piloted. **~12–15 people.**
- **1,000→10,000 (Petpooja territory):** city launch playbook + reseller network, 24/7 tiered
  support, DevOps/SRE + security/compliance function, integration marketplace as a product,
  hardware partnerships, real HR/finance. **~80–120 people.** This stage is a different company —
  the plan's job is to make stages 1–3 so solid that stage 4 is a scaling problem, not a rescue.

## 7. Metrics that decide everything

Weekly: MRR + net new outlets · **weekly-active billing outlets** (are they actually using it) ·
orders/GMV through direct channel (SKU A's proof) · support first-response + resolution time ·
churn (logo + revenue) · CAC per closed café vs LTV (unit-economics doc) · uptime + Sentry error rate.

## 8. Decisions log (updated)

| Decision | Call | Implication |
| --- | --- | --- |
| City | **Delhi NCR, in-person** | Target list = NCR cafés (Hauz Khas, GK, CP, Gurgaon Galleria/CyberHub, Noida sectors). Dense, high rents → owners feel aggregator commissions hardest = our pitch lands |
| Pricing philosophy | **Survival pricing — no loss-leading** | Price above fully-loaded cost from customer #1. See §9 floor math |
| Legal / GST | **Invoice under Maple Studios** | Invoice #1 unblocked today. Revisit a separate entity only if raising institutional money (investors will ask) |
| Wedge | Two SKUs, SKU A first (per §3) | No SKU-B demos until Phases 1–2 + offline are credible |
| First revenue | 10 paying in 3 months | Founder-led NCR sales per §4 |
| **Still open →** | Who owns support/onboarding · funding path (defer to month 3, §10) | |

## 9. Survival pricing (the no-loss floor, NCR)

Marginal cost per café is small — shared infra ₹50–150/mo, WhatsApp ~₹0.88/msg, AI pennies
(plan-tiered models). The real cost is **people-time** (onboarding ~1 day, support ~2–3 hrs/mo).
Fully-loaded at a 5-person team, break-even is roughly **₹40–60k MRR** (infra + part salaries).

**Recommended card (simple, cash-first):**
- **Shoku Direct:** ₹1,999/mo, or **₹20,000/yr prepaid** (~2 months free — annual prepay IS the
  survival strategy: cash up-front, commitment, zero collection chasing).
- **POS add-on:** +₹1,499/mo (+₹15,000/yr prepaid).
- **Onboarding fee ₹4,999 one-time** (waivable in a close) — covers the white-glove setup day and
  filters non-serious owners.
- Floor discipline: never below ₹1,499/mo equivalent; discount with **duration (prepaid months),
  never with price**. 20 cafés ≈ ₹40k+ MRR ≈ break-even.

## 10. The streamlined decision path (read this when overwhelmed)

Everything above compresses to **two open decisions and four sequenced workstreams.**

**Decide now (this week):**
- **D1 — Support owner:** name the one person (of the 4–5) who owns onboarding + support
  end-to-end. Without this, engineers become support and the roadmap dies.
- **D2 — Funding:** *explicitly defer.* Bootstrap by default for 90 days; revisit with evidence
  (see the month-3 gate below). Deciding not to decide is the correct call here.

**Then it's only execution, in order:**
1. **Weeks 1–3 — Make it chargeable** (P0 sprint, §1). Exit test: a stranger can pay real money,
   nothing mock, backups restore, errors alert us.
2. **Weeks 2–12 — Sell in NCR** (§4). 150-café list → 30 demos → 10–15 closes at §9 pricing.
   Exit test: 10 paying, <2 churned, support hours/café measured.
3. **Months 2–4 — Build SKU-B credibility in the background** (Phase 1 modifiers → Phase 2
   billing depth; greenlight offline-mode *design* only, not build).
4. **Month 3 — The gate.** Sit down with three numbers: **close rate** (demos→paying),
   **churn**, **support hrs/café**. Then:
   - Close rate ≥ 30% and churn ≤ 10% → the motion repeats → *now* choose: bootstrap deeper
     into NCR or raise the angel round to hire 2 reps + 1 support (§5 middle column).
   - Close rate < 15% → pricing/pitch/segment problem — fix positioning before hiring anyone.
   - Churn > 20% → product/support problem — stop selling, fix retention first.

**The one-line strategy:** *Get chargeable in 3 weeks, sell survival-priced annual deals to NCR
cafés for 10 weeks, let the month-3 numbers make the funding decision for you.*
