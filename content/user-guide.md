# Shoku — End-User Guide

A complete, practical reference for everyone who uses Shoku: café owners and staff, the Shoku platform (super-admin) team, and the customers who order food and drinks. This guide explains what each screen does and how to get things done, step by step. It is not a developer document.

All prices in Shoku are in Indian Rupees (₹).

---

## Table of contents

1. [What is Shoku](#1-what-is-shoku)
2. [Key concepts](#2-key-concepts)
3. [For customers — ordering, AI, loyalty & feedback](#3-for-customers--ordering-ai-loyalty--feedback)
4. [For café owners & staff — the admin console](#4-for-café-owners--staff--the-admin-console)
5. [For the Shoku platform team — the super-admin console](#5-for-the-shoku-platform-team--the-super-admin-console)
6. [Setting up WhatsApp for a café](#6-setting-up-whatsapp-for-a-café)
7. [FAQs & troubleshooting](#7-faqs--troubleshooting)
8. [Glossary](#8-glossary)

---

## 1. What is Shoku

Shoku is an AI-powered, white-label, multi-tenant online ordering platform for cafés and coffee shops. Each café gets its own fully branded ordering app — its own name, colours, menu, loyalty programme and an AI ordering assistant — running on its own web address (subdomain), with no app to download. Cafés pay a flat monthly SaaS subscription and keep 100% of every order, instead of paying a 20–30% commission to a food-delivery aggregator. Behind the scenes, the Shoku platform team provisions and monitors every café from a single control panel, while owners run their day-to-day store from a friendly admin console and customers order from a clean, mobile-first storefront.

**Who each part of this guide is for:**

- **Customers** order food and drinks. See [Section 3](#3-for-customers--ordering-ai-loyalty--feedback).
- **Café owners and staff** manage their store — menu, orders, tables, loyalty, marketing and branding. See [Section 4](#4-for-café-owners--staff--the-admin-console).
- **The Shoku platform team (super-admin)** onboards cafés, watches platform health and maintains the investor pitch deck. See [Section 5](#5-for-the-shoku-platform-team--the-super-admin-console).

---

## 2. Key concepts

### White-label café apps on their own subdomain
Every café on Shoku is a separate "tenant" with its own branded storefront. A café's app lives at an address like `your-cafe.getshoku.com`, where `your-cafe` is the café's chosen **subdomain**. The logo initial, brand colour, heading colour, typeface, store name and address all come from that café's own settings, so each storefront looks like the café's own product — not a generic Shoku page.

### Roles
Shoku has four kinds of users. What you can see and do depends on your role.

| Role | Who they are | What they can access |
| --- | --- | --- |
| **Super-admin** | The Shoku platform team | The platform console at `/super`: analytics, café management, audit log, pitch deck |
| **Owner / Admin** | The café owner | The full café admin console at `/admin` plus the storefront |
| **Staff** | Café team members | The café admin console at `/admin` (same areas as the owner) plus the storefront |
| **Customer** | People ordering food | The storefront: menu, AI assistant, cart, checkout, account, loyalty |

If you sign in as a customer and try to open an admin area, Shoku shows a "Staff only" screen and offers a link back to the menu. Likewise the platform console is "Shoku staff only".

### Demo mode vs live
Several features — most importantly WhatsApp marketing — can run in **demo mode** before a café connects real services. In demo mode the system does everything except actually dispatch the message: it personalizes the text and records it in the message history so the whole flow is visible, but nothing is sent to a real phone. Once a café adds valid provider credentials and switches sending on, the same flow goes **live** and messages really are delivered. See [Section 6](#6-setting-up-whatsapp-for-a-café).

### Loyalty points & tiers
Customers earn **points** when they order and can spend them on **rewards** at checkout. Each café sets:
- An **earn rate** — points earned per ₹100 of an order's subtotal (default 10).
- **Tiers** — named levels such as Member, Silver, Gold and Platinum, each with a minimum-points threshold. A customer's tier is the highest tier whose minimum they have reached.
- **Rewards** — redeemable perks that cost points, either a fixed ₹ discount or a free menu item.

Tiers are also used to target marketing (for example, "Gold & above").

---

## 3. For customers — ordering, AI, loyalty & feedback

This section covers the customer storefront. You reach it by opening your café's link or scanning a table QR code. No app install is needed — it works in your phone's browser.

### 3.1 Getting around
The storefront has a bottom navigation bar with five tabs:

- **Menu** (🏠) — browse and order.
- **Shoku AI** (✨) — the AI ordering assistant.
- **Shop** (🛒) — the café's merch shelf (beans, mugs, tees), picked up at the counter.
- **Bag** (🛍️) — your cart; a small badge shows how many items are in it.
- **Account** (👤) — your profile, points, tier, rewards, caffeine tracker and order history.

A header at the top shows the café's name and pickup location and a quick link to your bag.

### 3.2 Creating an account / signing in
You can browse the menu without signing in, but you must be signed in (or order as a guest with your number) to place an order, earn points and redeem rewards. There are three ways in:

1. **Phone (recommended)** — on the sign-in screen, the **📱 Phone** tab is the default. Enter your mobile number, tap **Send login code**, then type the 6-digit code you receive by SMS. Your points and orders are tied to your number, so they follow you online **and** at the counter.
2. **Guest checkout** — you don't have to sign in first. Add items, go to checkout, and just enter your mobile number under "Ordering as a guest". Your points are saved to that number, and when you later sign in by phone, those orders and points are already there.
3. **Email** — tap the **✉️ Email** tab to sign in or create an account with an email and password. (Google sign-in appears when the café has enabled it.)

### 3.3 Browsing the menu
On the **Menu** tab you'll see, from top to bottom:

- **Table banner** (only if you scanned a table QR) — shows "Ordering for [table]" with a **Leave table** option.
- **Sale banners** — promotional images the café has uploaded; some are tappable.
- **Shoku AI card** — "Not sure what to order?" tap it to open the AI assistant.
- **Category chips** — tap **All** or a category (for example "Ice Blended", "Hot Coffee", "Tea") to filter.
- **Dietary filters** — a second row of chips: **Jain, Vegan, Eggless, Vrat-safe, Halal, Diabetic-friendly, Low sugar, High protein**. Tap one to show only items that match (tap again to clear). Every item also carries small badges for the diets it fits, so you can see at a glance what's safe for you.
- **Picked for you** — an AI-curated rail of signature and top-rated items (shown when viewing "All").
- **Category lists** — every item with its photo, name, price and quick "add" control.

Tap any item to open its detail page.

> **How dietary tags work:** Shoku reads each dish's ingredients to work out tags like *vegan*, *eggless* and *jain* — and it's deliberately cautious (an item with mayonnaise, gelatin or milk is never marked vegan). Religious tags like *Halal* and *Vrat-safe* are set by the café itself. If a diet matters to your health or faith, still confirm with the café — the tags are a helpful guide, not a guarantee.

### 3.4 The item page and food intelligence
Each item's page shows its photo, rating, calories, price and description, plus a **"Know your cup ✨ SHOKU AI"** panel — Shoku's signature **food intelligence**:

- **🌍 Bean / origin** — where the coffee or key ingredient comes from.
- **🧾 Ingredients** — what's in it, shown as tags.
- **⚠️ Allergens** — listed plainly, or "No major allergens".
- **🥗 Nutrition (regular)** — calories, protein, sugar and caffeine.
- **💡 AI tip** — a helpful suggestion from Shoku (when the café has added one).
- **🛡️ Food safety** — the café's FSSAI licence number (when provided), so you know it's a registered kitchen.

Just under the title you'll also see the item's **dietary badges**, and — for a sweeter drink that has a lighter sibling on the same menu — a green **🍃 Lighter swap** suggestion ("…has 78% less sugar"). Tap it to jump to the lighter option.

Below that you customise and add to your bag:

1. **Choose size** (for example Regular / Large) — the price updates.
2. **Choose milk** (for drinks) — some options such as oat or almond may add a small charge.
3. Tap **Add to bag**. You're taken to your cart.

### 3.5 Using the AI ordering assistant (Shoku AI)
The **Shoku AI** tab is a chat that knows the whole menu — including caffeine, calories and what's good right now.

1. Open the **Shoku AI** tab (or tap the AI card on the menu).
2. Either tap a **quick prompt** chip — Cold & refreshing, Need a pick-me-up, Something sweet, Vegan options, High protein, Under 150 kcal, Low caffeine — or type your own request in the box (for example "something light for the evening").
3. Shoku replies with a short intro and a few **recommended items**, each with a one-line reason ("↳ why") such as "just 120 kcal" or "100% plant-based".
4. Tap an item to view it, or tap the **+** to add it straight to your bag.

The assistant understands mood, time of day and cravings, and matches them to items based on tags and nutrition.

### 3.6 Cart & checkout
Open your **Bag** and review the items. Near the top you'll often see a **"✨ Shoku AI · goes well with your bag"** card suggesting a couple of items that pair nicely with what you've added (a bite to go with your coffee, or a drink to go with your snack) — tap **Add** to include one. Then continue to **Checkout**. On the checkout screen you can:

1. **Choose how you'd like it** — Pickup, Dine-in or Delivery. (If you arrived by scanning a table QR, this is fixed to Dine-in at your table.)
2. **Pickup/Delivery time** — ASAP (about 12 minutes) or schedule; the café address is shown.
3. **Payment** — choose UPI (GPay / PhonePe), card or Shoku Wallet.
4. **Redeem points** — if you have enough points, pick a reward (a ₹ discount or a free item). Rewards you can't yet afford appear dimmed.
5. **Promo code** — type a code (for example WELCOME10) and tap **Apply**; valid codes show the percentage off.
6. Review the bill: subtotal, taxes & charges, an AI loyalty reward credit, any promo discount and any redeemed reward, then the **Total**.
7. Tap **Place order**.

After ordering you land on an **Order placed!** screen with your order number (shown as `#PS-XXXXXX`) and an estimated ready time. This screen also invites you to **leave feedback** ([§3.9](#39-leaving-feedback)) and to **share & earn** ([§3.11](#311-share--earn)).

### 3.7 Dine-in: ordering from your table by QR
Cafés can put a printed **QR code** on each table.

1. Scan the table's QR with your phone camera.
2. The café's menu opens with a banner reading "Ordering for [your table]".
3. Order as usual. At checkout the order is automatically marked **Dine-in** and tied to your table, so staff know where to serve it. (Tap **Leave table** if you want to switch back to pickup.)

### 3.8 Loyalty points & redeeming rewards
- You **earn points** automatically on every order, based on the café's earn rate (for example 10 points per ₹100). The exact points earned are confirmed on your order.
- See your balance, **tier** and progress on the **Account** tab — it tells you how many more points you need to reach the next tier.
- **Rewards you can unlock** are listed on your Account page; each shows its point cost and whether you can "Redeem at checkout" yet.
- To **redeem**, add items to your bag, go to checkout, and select a reward in the **Redeem points** section before placing the order. The discount (or free item) is applied to your bill.

### 3.9 Leaving feedback
After an order is placed, the confirmation screen invites you to rate your experience.

1. Tap **1–5 stars** under "How was your experience?".
2. Optionally add a comment.
3. Tap **Submit feedback**.

Your rating and comment go straight to the café owner's Feedback dashboard.

### 3.10 Your account, caffeine tracker & order history
The **Account** tab shows your name, your Points / Orders / Tier stats, your unlockable rewards, and your **Recent orders** (each with its items, total, fulfilment type and current status). You can sign out from here. If you also happen to be café staff or platform staff, shortcut links to the admin or platform consoles appear here too.

It also shows a **☕ Today's caffeine** meter — the total caffeine (in mg) from the drinks you've ordered today, against the widely-cited 400 mg daily guideline. It resets each morning. This is a friendly guide only, not medical advice.

### 3.11 Share & earn
Cafés can reward you for posting about your order on social media (Instagram, Snapchat — anywhere).

1. After placing an order, tap **"📸 Snap it, share it, earn points"** on the confirmation screen (or it appears there when the café has share rewards switched on).
2. Post your photo/story, then tap **I posted it** and paste the **link** to your post.
3. Tap **Submit for review**. The café checks the post and, once approved, the points land in your account.

You can submit **one share per day**. Points are awarded only after the café approves your post.

### 3.12 The Shop tab — café merch
The **🛒 Shop** tab is where a café sells merchandise — coffee beans, mugs, tote bags, tees.

1. Tap **Shop** to see what's available, with prices and stock ("Only 2 left" / "Sold out").
2. Add items to your bag just like food, and check out normally.
3. Merch is **collected at the counter** with your order — there's no shipping.

---

## 4. For café owners & staff — the admin console

The admin console lives at `/admin`. Sign in with the owner or staff account the Shoku team created for you. On desktop there's a left sidebar; on mobile the same sections appear as a scrollable strip of tabs at the top. A **View store** link lets you jump to your live customer app at any time.

The navigation has these sections:

**Overview · POS Billing · Orders · Analytics · Menu · Tables · Customers · Feedback · Discounts · Loyalty · Marketing · Banners · Branding · Settings**

> **POS Billing** and some AI features are add-ons. If you don't see **POS Billing**, or a feature says it isn't enabled, contact the Shoku team to turn it on for your plan.

### 4.1 Overview
Your live dashboard. At a glance:
- **KPI cards:** Revenue (all time), Orders (all time), Average order value, Customers (with the count of items currently live).
- **Revenue · last 14 days** bar chart.
- **Top sellers** — your best-selling items with quantities.
- **Recent orders** — the latest orders with customer, items, type, total and status, plus a **View all →** link to the Orders screen.

### 4.2 Orders
Track and advance every order.

- **Filter chips:** All, Preparing, Ready, Completed, Cancelled.
- Each row shows the order number, customer (name and email), items (with milk choice where relevant), **type** (Pickup / Dine-in / Delivery, plus the table for dine-in), total, the date placed and the current **status**.
- **Advancing an order:** use the action button to move it forward through the workflow:
  1. **Preparing** → tap **Mark ready**.
  2. **Ready** → tap **Mark completed**.
  Completed and cancelled orders have no further action.

Order statuses in plain terms: *Preparing* (being made), *Ready* (waiting for the customer), *Completed* (handed over / finished), *Cancelled* (not fulfilled).

### 4.2a POS Billing (add-on)
Ring up walk-in customers at the counter — the same system your online orders flow into, so your sales, stock of top-sellers and GST all live in one place.

**Taking a sale:**
1. Open **POS Billing**. The left side is your menu as tappable cards (with a search box — press **/** to jump to it — and category chips). The right side is the current sale ("ticket").
2. Tap items to add them; use the **− / +** steppers on each ticket line to change quantities.
3. (Optional) Type the customer's **phone number** to link the sale to their loyalty account — they earn points on counter purchases just like online. Leave it blank for an anonymous walk-in.
4. (Optional) Enter a **promo code**.
5. Choose the payment method — **Cash / UPI / Card**.
6. Tap **Bill**. Shoku assigns a sequential GST invoice number (e.g. `INV-2026-00042`), opens the **customer invoice** to print, and — if enabled — a **kitchen ticket (KOT)** to your kitchen printer.

**Printing:** invoices and KOTs are formatted for 80 mm thermal printers. Your browser's print dialog opens automatically; pick your receipt printer once and it remembers. A **KOT** lists just the items and quantities (no prices) in large type for the kitchen.

**Recent bills / reprint:** the ticket panel lists your last few bills — tap **Reprint** to print any invoice again.

**Day-end (Z) report:** the **Day-end report** button (top-right of POS) shows one day's totals — gross sales, number of bills, average bill, GST collected, a payment-method split, POS-vs-online mix, and top items. Pick any date, **Print** it, or export **CSV** for your accountant. Run it at close every day.

### 4.2b Analytics
A visual read on how the café is doing. Use the **7d / 30d / 90d** switch (top-right) to change the window.

- **KPI tiles:** Revenue, Orders, Average order, and Trend (this half of the period vs the previous half).
- **Revenue by day** — spot your best and worst days.
- **Orders by hour** — see your real rush hours so you can staff for them.
- **Counter vs online** — the revenue split between POS and app orders, plus a Cash/UPI/Card breakdown.
- **Top items** — your best sellers by quantity.
- **Revenue by location** — if you run more than one outlet (see Settings → Locations), revenue is split per outlet.

### 4.3 Menu management
Add, edit, publish and remove items.

**Bulk import from a spreadsheet (fastest way to load a menu):** tap **⬆ Import CSV**.
- **Download template** gives you a ready-made CSV with the right columns: `name, category, price, desc, veg, kcal, caffeine, tags, signature` (only **name** and **price** are required).
- Upload your file (or paste rows). You'll see a preview of what will be imported.
- **Images are handled for you** — Shoku matches each item to a professional food photo automatically, so you don't have to find or upload a picture for every item. If your plan includes **AI images**, tick *Generate AI images* to have unique photos generated instead (this is slower; it falls back to the matched stock photo if AI isn't available).
- Tap **Import**. Existing items with the same name are updated; new ones are added. Any rows with problems are listed so you can fix them.

- The table lists every item with its photo, name, category, price and a **Live** toggle. Flip **Live** on to show an item in the customer app, or off to hide it without deleting it.
- **Add an item:** tap **+ Add item**, then fill in the form:
  - **Name**, **Category**, **Price (₹)**, **Image URL**, **Description**.
  - Nutrition: **Calories**, **Caffeine (mg)**, **Protein (g)**, **Sugar (g)**.
  - Food intelligence: **Origin**, **Ingredients**, **Allergens**, **Tags** (all comma-separated), and an **AI tip**.
  - Checkboxes for **Vegetarian** and **Signature item** (signature items get a ★ and feature in "Picked for you").
  - Tap **Save item**.
- **Edit:** tap **Edit** on a row, change fields, save.
- **Delete:** tap **Delete** and confirm. (If an item can't be deleted because it's tied to past orders, you'll see a message — hide it with the Live toggle instead.)

Tip: the **Tags** field powers the AI assistant — useful values include `cold`, `sweet`, `vegan`, `high-protein`, `low-cal`, `low-caffeine`, `hot` and `signature`.

### 4.4 Tables & QR codes
Set up dine-in QR ordering.

- **Add a table:** type a name (for example "T4") and tap **Add**. Use **Bulk** to create a run of tables (T1…Tn) at once.
- Each row shows the table name, number of orders, an **ordering link** ("open"), an **Active** toggle, and **Show QR**.
- **Print a QR:** tap **Show QR**, then **Open / print**. Place the printed code on the table; when a diner scans it, the menu opens with that table attached and orders come through tagged for that table.
- Toggle a table **inactive** to stop its QR from accepting orders; **Delete** removes it.

### 4.5 Customers
Everyone who has signed up to your store.
- **Stat cards:** Total users, Customers, Lifetime spend.
- The table lists each person's name, email, role, number of orders, total spend, loyalty **points** and last-order date. This is your CRM view for understanding who your regulars are.

### 4.6 Feedback
The "Guest feedback" dashboard captures what customers thought after each order.
- **Stat cards:** Average rating, number of Responses, and 5-star share.
- **Rating breakdown** — a 1–5 star distribution chart.
- **Recent feedback** — each entry's customer name, star rating, comment and time.

### 4.7 Discounts
Create promo codes customers can apply at checkout.
1. Under **Create a code**, type a **Code** (for example SUMMER25), set the **Percent off** (1–90), and tap **Create**.
2. The **Active & past codes** table lists every code with its discount and status.
3. Use **Disable / Enable** to switch a code on or off, or **Delete** to remove it.

### 4.8 Loyalty (earn rate, tiers, rewards)
Configure your points programme.

- **Earning & tiers:**
  - Set **Points earned per ₹100 spent** (the earn rate).
  - Manage **Tiers** — each has a name and a minimum-points threshold. Add tiers with **+ Add tier**, edit names/minimums inline, remove with ✕. Remember: a customer's tier is the highest one whose minimum they've reached.
  - Tap **Save** to apply (it confirms with "Saved ✓").
- **Add a reward:**
  1. Enter a **Reward title** (for example "Free Cappuccino").
  2. Choose the **type** — **₹ discount** or **Free item**.
  3. Set the **cost** in points.
  4. For a discount, set the **₹ off**; for a free item, **choose the menu item**.
  5. Tap **Add reward**.
- **Rewards table:** lists each reward's title, type, point cost, value, and an **Active** toggle; **Delete** removes it. Active rewards appear to customers at checkout and on their Account page.

### 4.9 Marketing / WhatsApp
Reach loyal customers with personalized, AI-drafted WhatsApp messages. A badge at the top shows your current mode — **Demo mode — messages are logged, not sent**, or **Live** with the provider name. The screen has three tabs: **Compose**, **History**, **Settings**.

**Compose**

1. **AI quick-start:** tap a goal chip (✨ Win back lapsed customers, Nudge toward a reward, Thank loyal regulars, Announce an offer, New menu / seasonal drop). Shoku drafts a message for you and pre-selects a sensible audience.
2. **Campaign name:** give it a label (for example "Weekend win-back").
3. **Audience (segment):** choose who to target. Each shows a live count of opted-in people:
   - **All opted-in** — everyone who allows WhatsApp.
   - **Loyal regulars** — 5 or more orders.
   - **Gold & above** — top loyalty tiers.
   - **Close to a reward** — within 80 points of a reward.
   - **Lapsed (30d+)** — no order in 30 days.
   - **New customers** — joined in the last 14 days.
4. **Message:** edit the text. You can use personalization tokens that fill in per customer: `{name}`, `{brand}`, `{tier}`, `{points}`, `{toReward}`.
5. **Preview:** a sample preview shows how the message reads for a real customer.
6. Tap **Send to N customers**. In demo mode the messages are logged (not delivered); in live mode they're sent. A confirmation tells you how many went out.

**History**

- **Campaigns:** every campaign you've run, its segment, date and number sent.
- **Recent messages:** individual messages with a status dot — green = sent, amber = demo, red = failed, grey = queued — plus the recipient and the kind (campaign, trigger or nudge).

**Settings** (covered in detail in [Section 6](#6-setting-up-whatsapp-for-a-café))

- **Sender:** the business name shown in messages, and toggles for **Auto order updates** (order confirmation & ready alerts) and **Loyalty nudges** (reward-close & win-back reminders).
- **Provider:** choose Demo, Meta Cloud, Twilio or Indian BSP, enter credentials, and enable live sending.
- **Run nudges now:** manually trigger the automated reward-close and win-back reminders.

**Automated messages your café can send:**
- **Order triggers** — when *Auto order updates* is on, customers who opted in get an automatic WhatsApp order confirmation (with their order number, total, where it's served and points earned).
- **Loyalty nudges** — when *Loyalty nudges* is on, Shoku periodically messages customers who are very close to a reward (within ~60 points) or who have lapsed (no order in 30–60 days, offered a small win-back discount). Customers aren't messaged more than once a week by nudges.

### 4.10 Banners (sale banners)
Promo banners shown at the top of your live menu app.

1. Under **Add a banner**, upload an image (16:9 works best; under 2 MB) **or** paste a hosted image URL.
2. Optionally add a **Headline**, **Subtext**, and a **Tap link** (for example `/menu`).
3. Tap **Add banner**.
4. **Live banners** shows each banner; use **● Active / ○ Hidden** to show or hide it and **Delete** to remove it.

Active banners appear instantly in a swipeable strip atop the customer menu.

### 4.11 Branding
Make the customer app yours — changes preview live.

- **Identity:** Brand name, Subdomain, Primary colour, Heading / dark colour.
- **Typeface:** choose Inter, Poppins, Playfair or DM Sans.
- A **Live preview** panel shows a mini storefront updating as you change colours and fonts.
- **Reset to Shoku defaults** restores the standard look.
- Tap **Publish changes** to apply to your live app (confirms with "Published ✓"). Colours re-theme the whole app instantly.

### 4.12 Settings
Store details, locations and AI feature switches.

- **Store:** Store name and Address (these appear in the customer app and on order confirmations). It also shows your read-only Subdomain and Currency (INR ₹).
- **Locations:** If you run more than one outlet, add each one here with a short **label** (e.g. "Indiranagar") and address. When you have two or more, a **location picker** appears in your customer app's header so diners choose which outlet they're ordering from, and your **Analytics** splits revenue by location. Add with **+ Add location**; remove with the **✕** button. Remember to **Save changes**.
- **AI features** (toggle on/off):
  - **AI ordering assistant** — the chat "what should I eat" recommendations.
  - **Food intelligence cards** — auto origin, ingredients, allergens & nutrition.
  - **Smart upsell & pairings** — add-on suggestions in the cart.
  - **AI loyalty rewards** — personalised discounts to drive repeat visits.
- Tap **Save changes**.

---

## 5. For the Shoku platform team — the super-admin console

The platform console lives at `/super` and is for Shoku staff only. Its dark sidebar has four areas: **Analytics · Cafés · Audit log · Pitch deck**.

### 5.1 Analytics (platform overview)
An AI-assisted overview across all cafés on Shoku.

- **KPI cards:** **MRR** (with ARR), **Cafés** (active and trial counts), **Order revenue** (with total orders), **Customers**.
- **AI insights — what changed & why:** 3–4 plain-language bullets summarising the month — revenue movement, MRR, new cafés, at-risk accounts and the forecast. A badge marks whether the summary was AI-written or auto-generated.
- **Revenue trend:** a 6-month bar chart with a month-over-month growth indicator and a **next-month forecast**.
- **New cafés / month:** signups by month, plus orders in the period.
- **MRR by plan:** how recurring revenue splits across Starter / Growth / Enterprise.
- **At-risk cafés:** accounts flagged for attention (suspended, no orders since signup, or no orders in 21+ days), each tagged **high** or **watch**.
- **Top cafés by revenue.**

Header buttons link to the **Audit log** and **Manage cafés**.

### 5.2 Cafés (create, provision, plans, suspend)
The full list of café tenants with subdomain, plan, item count, orders, revenue and status.

**Provision a new café:**
1. Tap **+ New café**.
2. Fill the form: **Café name** (the subdomain auto-fills and can be edited), **Plan** (Starter / Growth / Enterprise), **Store address**, **Brand colour**, **Heading colour**, **Owner name**, **Owner email**, and optionally an **Owner password** (leave blank to generate an invite link instead). Keep **Pre-load a starter menu** ticked for a ready-to-go menu.
3. Tap **Create café**. This creates the tenant, default menu categories and the owner login.
4. If you left the password blank, a **set-password invite link** is shown — copy it and send it to the owner so they can finish setup. (Putting the subdomain live also needs its DNS and certificate to be set up on the server.)

**Manage status:** in the table, **Suspend** an active café (its storefront then shows "Store unavailable" to customers) or **Activate** a suspended one. Status badges show active (green), suspended (red) or trial (amber).

**Manage a café (plan, add-ons & AI):** tap **Manage** on any row to open its configuration drawer.
- **Plan** — move the café between Starter / Growth / Enterprise. The plan sets the default AI model.
- **POS add-on** — tick to enable **POS Billing** for the café (the ₹1,499/mo counter-billing module). Until this is on, the café's POS screen shows a "not enabled" message.
- **AI provider** — by default a café uses the platform's shared AI key and the default model for its plan (Starter/Growth → `gpt-4o-mini`, Enterprise → `gpt-4o`). To bill AI usage to a café's own account, or to use a different provider:
  - **API key** — paste the café's key (stored write-only; the field shows "••••••" once set — type to replace, or use **Clear café key** to revert to the platform default).
  - **Model override** — pin a specific model (e.g. a newer or cheaper one) for that café.
  - **Base URL** — point at any OpenAI-compatible endpoint (Azure OpenAI, a local gateway, etc.).
- Tap **Save**.

> **Why this matters for plans:** enterprise cafés can be given a stronger model and their own billing; starter cafés share the economical default. This is how AI cost scales with what each café pays.

### 5.3 Audit log
A chronological record of platform actions, most recent first — café creation, campaign sends, suspensions, logins and the like. Each entry shows who did it (actor email), the action, the target and a relative timestamp.

### 5.4 Pitch deck (view / download / upload new version)
A hosted investor pitch deck at `/pitch` (Shoku's own story — problem, solution, product, market, business model, financials and the ask).

- Anyone with the link can **View PDF**, **Download PDF** or **Print** the deck.
- Super-admins additionally see admin controls to **Upload PDF** or **Upload .pptx** and download the **Source .pptx**. Uploading a new file bumps the version (for example "v2") and stamps who updated it and when, so the latest deck is always served from the public link.

---

## 6. Setting up WhatsApp for a café

Every café starts in **demo mode**. In demo mode WhatsApp messages are fully personalized and recorded in the **History** tab, but **nothing is actually delivered** — so you can rehearse campaigns, triggers and nudges safely before going live. To send for real, connect a provider in **Marketing → Settings**.

### 6.1 The demo-mode baseline
- With no provider set (or no enabled sending), the café stays in demo mode.
- The mode badge at the top of the Marketing screen reads **"Demo mode — messages are logged, not sent."**
- Sent campaigns show a green confirmation noting the messages were *logged (demo)*, and message rows carry an amber "demo" status dot.

### 6.2 Choosing a provider
In **Marketing → Settings → Provider**, pick one of:

| Provider | What it is | Credentials you'll enter |
| --- | --- | --- |
| **Demo** | No real sending (default) | None |
| **Meta Cloud** | WhatsApp Cloud API from Meta | Phone number ID, Access token |
| **Twilio** | Twilio's WhatsApp API | Account SID, Auth token, From number |
| **Indian BSP** | A generic Indian Business Solution Provider (AiSensy / Interakt / Gupshup-style REST endpoint) | API endpoint URL, API key |

### 6.3 Going live (step by step)
1. Open **Marketing**, then the **Settings** tab.
2. Under **Sender**, set the **Business name** shown in messages, and turn on **Auto order updates** and/or **Loyalty nudges** if you want automated messaging.
3. Under **Provider**, choose **Meta Cloud**, **Twilio** or **Indian BSP** and enter the credentials for that provider.
4. Tick **Enable live sending for this café**.
5. Tap **Save settings**. A confirmation shows the new mode (for example "now in meta mode"). If credentials are missing or incomplete, the café simply stays in demo mode until they're valid.
6. Optionally tap **Run nudges now** to fire the automated reward-close and win-back reminders immediately.

Going live is per-café — each café connects its own WhatsApp account, and switching one café live never affects another.

### 6.4 What gets sent automatically once live
- **Order confirmations & ready alerts** (when *Auto order updates* is on) to customers who have opted in to WhatsApp.
- **Loyalty nudges** (when *Loyalty nudges* is on) to customers close to a reward or who have lapsed.

Note: customers consent to WhatsApp by default when they sign up; the system only messages opted-in customers, and only those who have shared a phone number receive real (non-demo) messages.

---

## 7. FAQs & troubleshooting

**My café's storefront shows no menu / "Store unavailable."**
- If you see "Store unavailable", the café has been **suspended** by the Shoku team — contact Shoku to reactivate it (super-admins can flip it back to Active under **Cafés**).
- If items are simply missing, check **Admin → Menu**: each item has a **Live** toggle; only live items show to customers. New cafés provisioned without the "Pre-load a starter menu" option start empty — add items, then toggle them Live.

**WhatsApp says "Demo mode."**
- This is expected until you connect a provider. Open **Marketing → Settings → Provider**, choose Meta Cloud / Twilio / Indian BSP, enter valid credentials, tick **Enable live sending**, and **Save**. If you saved but it's still demo, your credentials are incomplete (for example a missing token or From number) — re-check every field for that provider.

**A customer says they didn't get loyalty points.**
- Points are earned on the **subtotal** at the café's **earn rate** (points per ₹100). Small orders may earn 0 points after rounding down.
- The customer must be **signed in** when ordering — guest browsing doesn't accrue points.
- If they **redeemed a reward** on the same order, the reward's point cost is deducted, which can offset the points earned.
- Check the customer's balance under **Admin → Customers** (Points column) or have them open their **Account** tab.

**A customer didn't get a WhatsApp order confirmation.**
- Confirmations only send when **Auto order updates** is on in Marketing settings, the café is **live** (not demo), and the customer **opted in** and has a **phone number** on file. In demo mode the message is logged in History rather than delivered.

**A promo code won't apply at checkout.**
- Confirm the code exists and is **Active** under **Admin → Discounts** (codes can be disabled). Codes are case-insensitive but must match exactly.

**A reward isn't selectable at checkout.**
- The customer needs **enough points** (unaffordable rewards appear dimmed), and the reward must be **Active** under **Admin → Loyalty**.

**I changed my brand colours but the app still looks the same.**
- In **Admin → Branding**, you must tap **Publish changes** (it confirms "Published ✓"). The Settings page has a separate **Save changes** for store details and AI toggles.

**A table QR opens the menu but the order isn't marked dine-in.**
- The QR must be the one generated for that specific table (via **Show QR**), and the table must be **Active**. If a customer tapped **Leave table**, they've detached from it — they can re-scan.

**Which AI features can I turn off?**
- In **Admin → Settings → AI features** you can independently toggle the AI ordering assistant, food intelligence cards, smart upsell & pairings, and AI loyalty rewards.

**Does Shoku need an external AI service to work?**
- No. All AI features (assistant recommendations, marketing copy, platform insights) work out of the box using built-in logic, and automatically use a more advanced language model if the Shoku team has connected one.

---

## 8. Glossary

- **Admin console** — the café owner/staff dashboard at `/admin` (Overview, Orders, Menu, Tables, Customers, Feedback, Discounts, Loyalty, Marketing, Banners, Branding, Settings).
- **ARR** — Annual Recurring Revenue; the platform's MRR multiplied by 12.
- **At-risk café** — a tenant flagged by platform analytics (suspended, no orders since signup, or no orders in 21+ days).
- **Audit log** — the platform's record of key actions (café creation, campaign sends, suspensions, logins).
- **Banner** — a promotional image shown at the top of a café's customer menu.
- **BSP** — Business Solution Provider; an Indian WhatsApp messaging partner (for example AiSensy, Interakt, Gupshup).
- **Demo mode** — WhatsApp messaging that personalizes and logs messages without actually sending them; the default before a café connects a provider.
- **Earn rate** — points a customer earns per ₹100 of an order's subtotal.
- **Food intelligence** — Shoku's per-item origin, ingredients, allergens and nutrition shown in the "Know your cup" panel.
- **Fulfilment** — how an order is served: Pickup, Dine-in or Delivery.
- **Live (item)** — an item published and visible in the customer app.
- **Loyalty nudge** — an automated WhatsApp reminder to customers close to a reward or who have lapsed.
- **MRR** — Monthly Recurring Revenue; the sum of active cafés' plan subscriptions.
- **Owner / Staff** — café roles with access to the admin console.
- **Shoku AI** — the customer-facing AI ordering assistant.
- **Plan** — a café's subscription tier: Starter, Growth or Enterprise.
- **Points** — loyalty currency customers earn and spend on rewards.
- **Provider** — the WhatsApp service a café connects to send live messages (Meta Cloud, Twilio or Indian BSP).
- **Reward** — a redeemable perk costing points: a ₹ discount or a free item.
- **Segment** — a defined audience for marketing (All opted-in, Loyal regulars, Gold & above, Close to a reward, Lapsed, New customers).
- **Subdomain** — the café's unique web address prefix (for example `your-cafe` in `your-cafe.getshoku.com`).
- **Super-admin** — the Shoku platform team, who manage every café from the `/super` console.
- **Tenant** — one café on the platform, with its own storefront, data and branding.
- **Tier** — a named loyalty level (Member, Silver, Gold, Platinum) with a minimum-points threshold.
- **Trigger** — an automated order-related WhatsApp message (confirmation / ready alert).
- **White-label** — each café's app is branded as its own, not as Shoku.

---

*Powered by Shoku — the AI white-label ordering platform.*
