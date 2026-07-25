import { prisma } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { resolveUnitPrice } from "@/lib/menu";

// Shared order creation. Used by both the direct (mock-paid) checkout and the
// Razorpay flow, so totals are computed in exactly one place — no charge drift.
//
// opts.paymentStatus: "paid" (default, immediate) or "pending" (awaiting gateway).
// Points + WhatsApp confirmation fire only once the order is actually paid:
// inline here when paymentStatus === "paid", otherwise on markOrderPaid().
export async function createOrder(session, body, opts = {}) {
  const paymentStatus = opts.paymentStatus || "paid";
  const razorpayOrderId = opts.razorpayOrderId || null;

  const tenantId = session.user.tenantId;
  if (!tenantId) return { error: "No tenant", status: 400 };
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.status !== "active")
    return { error: "This store is currently unavailable.", status: 403 };

  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (lines.length === 0) return { error: "Cart is empty", status: 400 };

  // Validate items belong to THIS tenant; recompute totals server-side.
  const ids = [...new Set(lines.map((l) => l.id))];
  const dbItems = await prisma.item.findMany({ where: { id: { in: ids }, tenantId } });
  const byId = Object.fromEntries(dbItems.map((i) => [i.id, i]));

  const clean = [];
  const reservedStock = []; // [{itemId, qty}] — rolled back if the order can't be created
  for (const l of lines) {
    const it = byId[l.id];
    if (!it) continue;
    const qty = Math.max(1, Math.min(50, Number(l.qty) || 1));
    // Merch with tracked stock: reserve atomically so two buyers can't oversell.
    if (it.type === "merch" && it.stockQty !== null) {
      const took = await prisma.item.updateMany({
        where: { id: it.id, tenantId, stockQty: { gte: qty } },
        data: { stockQty: { decrement: qty } },
      });
      if (took.count === 0) {
        for (const r of reservedStock) await prisma.item.update({ where: { id: r.itemId }, data: { stockQty: { increment: r.qty } } });
        return { error: `"${it.name}" just sold out.`, status: 409 };
      }
      reservedStock.push({ itemId: it.id, qty });
    }
    // Price comes from the catalog, never from the client (size + milk resolved server-side).
    const { size, milk, unit } = resolveUnitPrice(it, l.size, l.milk);
    clean.push({ itemId: it.id, name: it.name, size, milk, unit, qty });
  }
  if (clean.length === 0) return { error: "No valid items", status: 400 };

  const subtotal = clean.reduce((s, l) => s + l.unit * l.qty, 0);
  const tax = Math.round((subtotal * (tenant.gstRate ?? 5)) / 100);
  const reward = Math.round(subtotal * 0.05);

  let discount = 0;
  let discountCode = null;
  if (body.discountCode) {
    const code = String(body.discountCode).toUpperCase().replace(/\s+/g, "");
    const promo = await prisma.discount.findFirst({ where: { code, tenantId, active: true } });
    if (promo) {
      discount = Math.round((subtotal * promo.percent) / 100);
      discountCode = promo.code;
    }
  }

  // The buyer defaults to the signed-in user; POS passes the matched customer
  // (opts.buyerId) so loyalty credits the right person, or skips it for walk-ins.
  const buyerId = opts.buyerId || session.user.id;
  const dbUser = await prisma.user.findUnique({ where: { id: buyerId } });
  let loyaltyDiscount = 0;
  let pointsRedeemed = 0;
  let rewardTitle = null;
  if (body.rewardId) {
    const rw = await prisma.reward.findFirst({ where: { id: body.rewardId, tenantId, active: true } });
    if (rw) {
      // Atomically reserve the points (conditional decrement) so two concurrent
      // orders can't both redeem the same balance and drive it negative.
      const reserved = await prisma.user.updateMany({
        where: { id: buyerId, points: { gte: rw.cost } },
        data: { points: { decrement: rw.cost } },
      });
      if (reserved.count === 1) {
        pointsRedeemed = rw.cost;
        rewardTitle = rw.title;
        if (rw.type === "discount") {
          loyaltyDiscount = Math.min(rw.amount, subtotal);
        } else if (rw.type === "freeItem" && rw.itemId) {
          const freeItem = await prisma.item.findFirst({ where: { id: rw.itemId, tenantId } });
          if (freeItem) clean.push({ itemId: freeItem.id, name: `${freeItem.name} (reward)`, size: "Regular", milk: null, unit: 0, qty: 1 });
        }
      }
    }
  }

  // Discounts can legitimately exceed subtotal+tax when stacked — never charge below zero.
  const total = Math.max(0, subtotal + tax - reward - discount - loyaltyDiscount);

  let tableId = null, tableLabel = null;
  if (body.tableId) {
    const table = await prisma.table.findFirst({ where: { id: body.tableId, tenantId, active: true } });
    if (table) { tableId = table.id; tableLabel = table.label; }
  }
  const fulfilment = tableId ? "dinein" : (body.fulfilment || "pickup");

  const order = await prisma.order.create({
    data: {
      tenantId,
      userId: buyerId,
      subtotal, tax, reward, discount, discountCode, loyaltyDiscount, pointsRedeemed, rewardTitle, total,
      fulfilment,
      tableId, tableLabel,
      payment: body.payment || "upi",
      paymentStatus,
      razorpayOrderId,
      locationLabel: typeof body.locationLabel === "string" ? body.locationLabel.slice(0, 60) : null,
      ...(opts.extraData || {}), // POS fields: source, paymentMethod, invoiceNo, cgst, sgst, staffId
      items: { create: clean },
    },
  });

  if (paymentStatus === "paid") {
    await settlePaid(order, tenant, dbUser, { skipLoyalty: !!opts.skipLoyalty });
  }

  return { order };
}

// Idempotently mark an order paid: award loyalty points and send the WhatsApp
// confirmation exactly once, on the transition into "paid".
export async function markOrderPaid(orderId, { razorpayPaymentId } = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found", status: 404 };
  if (order.paymentStatus === "paid") return { order, alreadyPaid: true };

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "paid", ...(razorpayPaymentId ? { razorpayPaymentId } : {}) },
  });
  const tenant = order.tenantId ? await prisma.tenant.findUnique({ where: { id: order.tenantId } }) : null;
  const dbUser = await prisma.user.findUnique({ where: { id: order.userId } });
  if (tenant) await settlePaid(updated, tenant, dbUser);
  return { order: updated };
}

// Loyalty points + WhatsApp confirmation. Called once, when an order is paid.
// opts.skipLoyalty: POS walk-ins (no customer identified) earn nothing.
// NOTE: redeemed points are already reserved (decremented) at order creation,
// so settling only awards the earn side.
async function settlePaid(order, tenant, dbUser, opts = {}) {
  const earnRate = tenant.loyaltyEarnRate ?? 10;
  const pointsEarned = opts.skipLoyalty ? 0 : Math.floor((order.subtotal * earnRate) / 100);
  if (!opts.skipLoyalty && pointsEarned > 0) {
    await prisma.user.update({
      where: { id: order.userId },
      data: { points: { increment: pointsEarned } },
    });
  }

  try {
    if (!opts.skipLoyalty && tenant.waTriggers && dbUser?.waOptIn) {
      const brand = tenant.storeName || tenant.name;
      const fName = (dbUser.name || "there").split(" ")[0];
      const where = order.tableLabel ? `Table ${order.tableLabel}` : order.fulfilment === "dinein" ? "Dine-in" : "Pickup";
      const ref = order.id.slice(-5).toUpperCase();
      const msg = `Hi ${fName}, thanks for your order at ${brand}! 🧾 Order #${ref} · ₹${order.total} · ${where}. We'll ping you when it's ready. You earned ${pointsEarned} points 💚`;
      await sendWhatsApp({ tenant, to: dbUser.phone, body: msg, kind: "trigger", userId: dbUser.id, toName: dbUser.name });
    }
  } catch {
    /* never block an order on messaging */
  }
}
