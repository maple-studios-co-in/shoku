/* eslint-disable */
// Seed the multi-tenant Shoku database: a platform superadmin + two demo cafés.
//   npm run seed   (or `npm run setup` to push schema + seed)

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const DEFAULT_TIERS = [
  { name: "Member", min: 0 }, { name: "Silver", min: 300 }, { name: "Gold", min: 800 }, { name: "Platinum", min: 2000 },
];

const CATEGORIES = [
  { key: "ice-blended", label: "Ice Blended", sort: 1 },
  { key: "hot-coffee", label: "Hot Coffee", sort: 2 },
  { key: "tea", label: "Tea", sort: 3 },
  { key: "food", label: "Food", sort: 4 },
];

// catKey is the category key; id within tenant is "<slug>-<itemKey>"
const ITEMS = [
  { k: "original-ice-blended", name: "Original Ice Blended", catKey: "ice-blended", price: 385, img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700", desc: "The blended coffee drink that started it all — signature coffee, milk & ice.", veg: true, kcal: 320, caffeine: 95, protein: 6, sugar: 38, signature: true, rating: 4.8, reviews: 2140, origin: "100% Arabica from Coorg & Costa Rica.", ingredients: ["Espresso", "Whole milk", "Ice Blended powder", "Cane sugar", "Ice"], allergens: ["Milk"], tags: ["cold", "sweet", "signature", "treat"], sizes: [{ name: "Small", price: 345 }, { name: "Regular", price: 385 }, { name: "Large", price: 425 }], aiTip: "Ask for it 'lite' to cut ~30% sugar." },
  { k: "mocha-ice-blended", name: "Mocha Ice Blended", catKey: "ice-blended", price: 410, img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700", desc: "Rich chocolate meets signature coffee, topped with whipped cream.", veg: true, kcal: 380, caffeine: 105, protein: 7, sugar: 44, rating: 4.7, reviews: 1320, origin: "Arabica with cocoa from Idukki, Kerala.", ingredients: ["Espresso", "Whole milk", "Chocolate", "Whipped cream", "Ice"], allergens: ["Milk", "Soy"], tags: ["cold", "sweet", "treat"], sizes: [{ name: "Regular", price: 410 }, { name: "Large", price: 450 }], aiTip: "The most indulgent pick." },
  { k: "matcha-ice-blended", name: "Matcha Ice Blended", catKey: "ice-blended", price: 410, img: "https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?w=700", desc: "Ceremonial-grade matcha blended cold — earthy, gently sweet.", veg: true, kcal: 340, caffeine: 40, protein: 5, sugar: 30, rating: 4.7, reviews: 640, origin: "Matcha from Uji, Kyoto.", ingredients: ["Matcha", "Whole milk", "Cane sugar", "Ice"], allergens: ["Milk"], tags: ["cold", "refreshing", "low-caffeine"], sizes: [{ name: "Regular", price: 410 }], aiTip: "Lower caffeine, steady energy." },
  { k: "cafe-latte", name: "Café Latte", catKey: "hot-coffee", price: 295, img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=700", desc: "Double espresso with steamed milk and microfoam.", veg: true, kcal: 190, caffeine: 150, protein: 9, sugar: 14, rating: 4.8, reviews: 3100, origin: "Arabica from Chikmagalur.", ingredients: ["Double espresso", "Steamed milk"], allergens: ["Milk"], tags: ["hot", "high-protein"], sizes: [{ name: "Regular", price: 295 }, { name: "Large", price: 335 }], aiTip: "9g protein — your most filling hot coffee." },
  { k: "cappuccino", name: "Cappuccino", catKey: "hot-coffee", price: 275, img: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=700", desc: "Espresso, steamed milk and airy foam, dusted with cocoa.", veg: true, kcal: 150, caffeine: 150, protein: 8, sugar: 10, rating: 4.7, reviews: 2400, origin: "Arabica from Chikmagalur.", ingredients: ["Double espresso", "Steamed milk", "Foam"], allergens: ["Milk"], tags: ["hot", "high-protein"], sizes: [{ name: "Regular", price: 275 }], aiTip: "Balanced and under 150 kcal." },
  { k: "americano", name: "Americano", catKey: "hot-coffee", price: 245, img: "https://images.unsplash.com/photo-1551030173-122aabc4489c?w=700", desc: "Double espresso lengthened with hot water. Bold, black, zero sugar.", veg: true, kcal: 10, caffeine: 150, protein: 1, sugar: 0, rating: 4.6, reviews: 1180, origin: "Arabica from Chikmagalur.", ingredients: ["Double espresso", "Hot water"], allergens: [], tags: ["hot", "low-cal", "vegan"], sizes: [{ name: "Regular", price: 245 }], aiTip: "10 kcal and vegan — the lightest coffee." },
  { k: "iced-black-tea", name: "Iced Black Tea", catKey: "tea", price: 220, img: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=700", desc: "Single-estate Assam black tea over ice.", veg: true, kcal: 5, caffeine: 25, protein: 0, sugar: 0, rating: 4.5, reviews: 540, origin: "Single-estate Assam.", ingredients: ["Black tea", "Water", "Ice"], allergens: [], tags: ["cold", "refreshing", "low-cal", "low-caffeine", "vegan"], sizes: [{ name: "Regular", price: 220 }], aiTip: "5 kcal, vegan, most refreshing." },
  { k: "masala-chai", name: "Masala Chai Latte", catKey: "tea", price: 260, img: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=700", desc: "Spiced tea simmered with steamed milk, cardamom and ginger.", veg: true, kcal: 180, caffeine: 40, protein: 6, sugar: 22, rating: 4.7, reviews: 980, origin: "Assam CTC + house masala.", ingredients: ["Black tea", "Milk", "Cardamom", "Ginger"], allergens: ["Milk"], tags: ["hot", "sweet", "low-caffeine"], sizes: [{ name: "Regular", price: 260 }], aiTip: "Comforting and lower caffeine." },
  { k: "butter-croissant", name: "Butter Croissant", catKey: "food", price: 180, img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=700", desc: "Flaky, all-butter croissant baked fresh each morning.", veg: true, kcal: 290, caffeine: 0, protein: 6, sugar: 6, rating: 4.6, reviews: 720, origin: "Baked in-house daily.", ingredients: ["Wheat flour", "Butter", "Milk"], allergens: ["Gluten", "Milk"], tags: ["food", "treat"], sizes: [{ name: "One", price: 180 }], aiTip: "Classic pairing for any drink." },
  { k: "veg-sandwich", name: "Grilled Veg & Pesto Sandwich", catKey: "food", price: 320, img: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=700", desc: "Grilled vegetables, basil pesto and melted cheese on sourdough.", veg: true, kcal: 430, caffeine: 0, protein: 16, sugar: 6, rating: 4.4, reviews: 290, origin: "Made fresh to order.", ingredients: ["Sourdough", "Vegetables", "Pesto", "Mozzarella"], allergens: ["Gluten", "Milk", "Nuts"], tags: ["food", "high-protein"], sizes: [{ name: "One", price: 320 }], aiTip: "16g protein — the most filling." },
];

async function seedMenu(tenant, items) {
  for (const c of CATEGORIES) {
    const id = `${tenant.id}-${c.key}`;
    await prisma.category.upsert({
      where: { id },
      update: { label: c.label, sort: c.sort, key: c.key, tenantId: tenant.id },
      create: { id, tenantId: tenant.id, key: c.key, label: c.label, sort: c.sort },
    });
  }
  let sort = 0;
  for (const it of items) {
    const id = `${tenant.slug}-${it.k}`;
    const data = {
      tenantId: tenant.id, name: it.name, categoryId: `${tenant.id}-${it.catKey}`, price: it.price, img: it.img,
      desc: it.desc, veg: it.veg, kcal: it.kcal, caffeine: it.caffeine, protein: it.protein, sugar: it.sugar,
      signature: !!it.signature, rating: it.rating || 4.5, reviews: it.reviews || 0, origin: it.origin || "",
      ingredients: JSON.stringify(it.ingredients || []), allergens: JSON.stringify(it.allergens || []),
      tags: JSON.stringify(it.tags || []), sizes: JSON.stringify(it.sizes || [{ name: "Regular", price: it.price }]),
      aiTip: it.aiTip || "", sort: sort++,
    };
    await prisma.item.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
}

async function seedOrders(tenant, buyers) {
  const existing = await prisma.order.count({ where: { tenantId: tenant.id } });
  if (existing > 0) return 0;
  const items = await prisma.item.findMany({ where: { tenantId: tenant.id } });
  if (items.length === 0 || buyers.length === 0) return 0;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  let made = 0;
  for (let d = 0; d < 14; d++) {
    const perDay = 1 + Math.floor(Math.random() * 3);
    for (let n = 0; n < perDay; n++) {
      const chosen = [];
      const lc = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < lc; i++) {
        const it = pick(items);
        chosen.push({ itemId: it.id, name: it.name, size: "Regular", unit: it.price, qty: 1 + Math.floor(Math.random() * 2) });
      }
      const subtotal = chosen.reduce((s, l) => s + l.unit * l.qty, 0);
      const tax = Math.round(subtotal * 0.05), reward = Math.round(subtotal * 0.05);
      await prisma.order.create({
        data: {
          tenantId: tenant.id, userId: pick(buyers).id, subtotal, tax, reward, total: subtotal + tax - reward,
          fulfilment: pick(["pickup", "dinein", "delivery"]), status: d === 0 ? pick(["preparing", "ready", "completed"]) : "completed",
          createdAt: new Date(Date.now() - d * 86400000 - Math.floor(Math.random() * 80000000)),
          items: { create: chosen },
        },
      });
      made++;
    }
  }
  return made;
}

async function ensureUser({ email, name, role, tenantId, points = 0, phone = null }) {
  const found = await prisma.user.findFirst({ where: { email, tenantId: tenantId ?? null } });
  if (found) return found;
  // Never seed a known default password in production. Provide SEED_ADMIN_PASSWORD
  // (superadmin/owner) and/or SEED_PASSWORD; in dev these fall back to "password".
  const isPriv = role === "superadmin" || role === "owner";
  const raw =
    (isPriv ? process.env.SEED_ADMIN_PASSWORD : process.env.SEED_PASSWORD) ||
    process.env.SEED_PASSWORD ||
    (process.env.NODE_ENV === "production" ? null : "password");
  if (!raw) throw new Error(`Refusing to seed ${role} <${email}> with a default password in production — set SEED_ADMIN_PASSWORD.`);
  const password = await bcrypt.hash(raw, 10);
  return prisma.user.create({ data: { email, name, role, tenantId: tenantId ?? null, password, points, phone, waOptIn: true } });
}

async function main() {
  console.log("Seeding Shoku (multi-tenant)…");

  // Platform superadmin (global)
  await ensureUser({ email: "super@shoku.app", name: "Shoku Admin", role: "superadmin", tenantId: null, points: 0 });

  // ---- Tenant 1: CBTL (the default/primary café) ----
  const cbtl = await prisma.tenant.upsert({
    where: { slug: "cbtl" },
    update: {},
    create: { name: "The Coffee Bean & Tea Leaf", slug: "cbtl", storeName: "CBTL · Indiranagar", address: "100 Ft Rd, Indiranagar, Bengaluru", brandHex: "#7AB04A", darkHex: "#36511F", plan: "enterprise", tiers: JSON.stringify(DEFAULT_TIERS) },
  });
  await seedMenu(cbtl, ITEMS);
  const owner1 = await ensureUser({ email: "demo@shoku.app", name: "Maple Studios", role: "owner", tenantId: cbtl.id, points: 1240 });
  const c1 = [
    await ensureUser({ email: "aarav@example.com", name: "Aarav Sharma", role: "customer", tenantId: cbtl.id, points: 320, phone: "+919800000001" }),
    await ensureUser({ email: "diya@example.com", name: "Diya Patel", role: "customer", tenantId: cbtl.id, points: 540, phone: "+919800000002" }),
  ];
  if ((await prisma.banner.count({ where: { tenantId: cbtl.id } })) === 0) {
    await prisma.banner.createMany({
      data: [
        { tenantId: cbtl.id, title: "Monsoon Mocha is back ☕", subtitle: "Limited-time seasonal special", imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=1200&h=675&fit=crop", link: "/menu", sort: 0 },
        { tenantId: cbtl.id, title: "Buy 1 Get 1 · Weekdays 3–6pm", subtitle: "On all ice-blended drinks", imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1200&h=675&fit=crop", link: "/menu", sort: 1 },
      ],
    });
  }
  for (const code of [["WELCOME10", 10], ["SHOKU15", 15]]) {
    const existing = await prisma.discount.findFirst({ where: { code: code[0], tenantId: cbtl.id } });
    if (!existing) await prisma.discount.create({ data: { tenantId: cbtl.id, code: code[0], percent: code[1] } });
  }
  if ((await prisma.reward.count({ where: { tenantId: cbtl.id } })) === 0) {
    await prisma.reward.create({ data: { tenantId: cbtl.id, title: "₹75 off your order", type: "discount", cost: 200, amount: 75 } });
    await prisma.reward.create({ data: { tenantId: cbtl.id, title: "Free Café Latte", type: "freeItem", cost: 150, itemId: "cbtl-cafe-latte", itemName: "Café Latte" } });
  }
  const o1 = await seedOrders(cbtl, [owner1, ...c1]);
  if ((await prisma.feedback.count({ where: { tenantId: cbtl.id } })) === 0) {
    const fb = [
      ["Aarav Sharma", 5, "Loved the Original Ice Blended — perfectly balanced!"],
      ["Diya Patel", 5, "AI suggestion was spot on. Quick pickup too."],
      ["Aarav Sharma", 4, "Great app, super easy to reorder."],
      ["Diya Patel", 3, "Coffee was a touch cold today."],
      ["Aarav Sharma", 5, ""],
      ["Diya Patel", 4, "Loyalty points are a nice touch."],
    ];
    for (const [name, rating, comment] of fb) {
      await prisma.feedback.create({ data: { tenantId: cbtl.id, name, rating, comment: comment || null } });
    }
  }
  if ((await prisma.table.count({ where: { tenantId: cbtl.id } })) === 0) {
    for (let i = 1; i <= 6; i++) await prisma.table.create({ data: { tenantId: cbtl.id, label: `T${i}` } });
  }

  // ---- Tenant 2: Blue Tokai (a second demo café) ----
  const bt = await prisma.tenant.upsert({
    where: { slug: "bluetokai" },
    update: {},
    create: { name: "Blue Tokai Coffee", slug: "bluetokai", storeName: "Blue Tokai · Koramangala", address: "Koramangala, Bengaluru", brandHex: "#2F6FED", darkHex: "#16356b", plan: "growth", tiers: JSON.stringify(DEFAULT_TIERS) },
  });
  await seedMenu(bt, ITEMS.slice(3, 9));
  const owner2 = await ensureUser({ email: "owner@bluetokai.app", name: "Blue Tokai Owner", role: "owner", tenantId: bt.id, points: 0 });
  const c2 = [await ensureUser({ email: "kabir@example.com", name: "Kabir Rao", role: "customer", tenantId: bt.id, points: 90 })];
  if ((await prisma.reward.count({ where: { tenantId: bt.id } })) === 0) {
    await prisma.reward.create({ data: { tenantId: bt.id, title: "₹50 off", type: "discount", cost: 150, amount: 50 } });
  }
  if ((await prisma.table.count({ where: { tenantId: bt.id } })) === 0) {
    for (let i = 1; i <= 4; i++) await prisma.table.create({ data: { tenantId: bt.id, label: `T${i}` } });
  }
  const o2 = await seedOrders(bt, [owner2, ...c2]);

  console.log(`Done.`);
  console.log(`  Superadmin: super@shoku.app / password`);
  console.log(`  CBTL owner: demo@shoku.app / password  (+${o1} orders)`);
  console.log(`  Blue Tokai owner: owner@bluetokai.app / password  (+${o2} orders)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
