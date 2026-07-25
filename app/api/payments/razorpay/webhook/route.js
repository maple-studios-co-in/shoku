import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments";
import { markOrderPaid } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Razorpay → server confirmation (backup to client verify). Public endpoint,
// authenticated by the X-Razorpay-Signature HMAC over the raw body.
export async function POST(req) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let evt;
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const entity = evt?.payload?.payment?.entity;
  const rzpOrderId = entity?.order_id;
  const paymentId = entity?.id;

  if (evt?.event === "payment.captured" && rzpOrderId) {
    const order = await prisma.order.findFirst({ where: { razorpayOrderId: rzpOrderId } });
    if (order) await markOrderPaid(order.id, { razorpayPaymentId: paymentId }); // idempotent
  } else if (evt?.event === "payment.failed" && rzpOrderId) {
    // Mark failed exactly once (guards duplicate webhooks) and refund any
    // loyalty points that were reserved at order creation.
    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: rzpOrderId, paymentStatus: "pending" },
    });
    if (order) {
      const flipped = await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: "pending" },
        data: { paymentStatus: "failed" },
      });
      if (flipped.count === 1 && order.pointsRedeemed > 0) {
        await prisma.user.update({
          where: { id: order.userId },
          data: { points: { increment: order.pointsRedeemed } },
        });
      }
      if (flipped.count === 1) {
        // Return reserved merch stock (tracked items only).
        const lines = await prisma.orderItem.findMany({ where: { orderId: order.id }, include: { item: { select: { type: true, stockQty: true } } } });
        for (const l of lines) {
          if (l.item?.type === "merch" && l.item.stockQty !== null) {
            await prisma.item.update({ where: { id: l.itemId }, data: { stockQty: { increment: l.qty } } });
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
