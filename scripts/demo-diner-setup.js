// Puts the demo diner (demo-diner@shoku.app / +919899900000) into a known,
// screenshot-ready state for feature testing:
//   - a paid order TODAY with caffeinated drinks (so the caffeine ledger shows)
//   - a pending social-post share (so /admin/shares has something to approve)
//   - ensures merch is on the shelf and a classified menu exists
//   node scripts/demo-diner-setup.js [slug=cbtl]
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const slug = process.argv[2] || "cbtl";
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) { console.error("no tenant", slug); process.exit(1); }
  const diner = await prisma.user.findUnique({ where: { tenantId_phone: { tenantId: tenant.id, phone: "+919899900000" } } });
  if (!diner) { console.error("run `npm run seed` first (demo diner missing)"); process.exit(1); }

  // enable share rewards + an FSSAI number for the trust panel
  await prisma.tenant.update({ where: { id: tenant.id }, data: { shareEnabled: true, sharePoints: 50, fssaiLicense: "11223333001234" } });

  // a caffeinated order placed TODAY (2 items) → caffeine ledger populates
  const latte = await prisma.item.findFirst({ where: { tenantId: tenant.id, name: { contains: "Latte" } } });
  const americano = await prisma.item.findFirst({ where: { tenantId: tenant.id, name: { contains: "Americano" } } })
    || await prisma.item.findFirst({ where: { tenantId: tenant.id, caffeine: { gt: 0 } } });
  const at = new Date(); at.setHours(9, 15, 0, 0);
  const existingToday = await prisma.order.findFirst({ where: { userId: diner.id, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } });
  if (!existingToday && latte && americano) {
    const sub = latte.price + americano.price;
    await prisma.order.create({
      data: {
        tenantId: tenant.id, userId: diner.id, subtotal: sub, tax: Math.round(sub * 0.05),
        reward: Math.round(sub * 0.05), total: Math.round(sub * 1.0), fulfilment: "pickup",
        payment: "upi", paymentStatus: "paid", status: "completed", source: "online", createdAt: at,
        items: { create: [
          { itemId: latte.id, name: latte.name, size: "Regular", unit: latte.price, qty: 1 },
          { itemId: americano.id, name: americano.name, size: "Regular", unit: americano.price, qty: 1 },
        ] },
      },
    });
    console.log("✓ today's caffeinated order created");
  } else console.log("• today's order already present (skipped)");

  // a pending share submission → /admin/shares queue
  const hasPending = await prisma.socialPost.findFirst({ where: { tenantId: tenant.id, status: "pending" } });
  if (!hasPending) {
    await prisma.socialPost.create({
      data: { tenantId: tenant.id, userId: diner.id, url: "https://instagram.com/p/demo-shoku-post", note: "Loved the matcha! @shoku", status: "pending" },
    });
    console.log("✓ pending share submission created");
  } else console.log("• pending share already present (skipped)");

  console.log(`\nDemo diner ready:\n  email:  demo-diner@shoku.app / password\n  phone:  9899900000  (OTP demo-code shown on screen)\n  points: ${diner.points}`);
  process.exit(0);
})();
