import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrder } from "@/lib/orders";
import { getCurrentTenant } from "@/lib/tenant";
import { normalizePhone, findOrCreatePhoneUser } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, tenantId: session.user.tenantId ?? undefined },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json(orders);
}

// Direct checkout (mock-paid). The Razorpay flow lives under /api/payments/razorpay.
// Guest checkout: no session + body.guest.phone → the order (and its points) is
// held on a phone-keyed guest account, claimed automatically on first OTP login.
export async function POST(req) {
  let session = await getServerSession(authOptions);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!session?.user?.id) {
    const phone = normalizePhone(body?.guest?.phone);
    if (!phone) return NextResponse.json({ error: "Sign in, or order as a guest with your mobile number." }, { status: 401 });
    if (!rateLimit(`guestorder:${clientIp(req)}`, { limit: 6, windowMs: 600_000 }).ok) {
      return NextResponse.json({ error: "Too many orders — please slow down." }, { status: 429 });
    }
    const tenant = await getCurrentTenant();
    if (!tenant || tenant.status !== "active") return NextResponse.json({ error: "Store unavailable" }, { status: 403 });
    // If this phone already belongs to a CLAIMED account, refuse guest checkout —
    // otherwise anyone could attribute orders (and unsolicited loyalty points) to a
    // stranger's account just by typing their number. Make them sign in.
    const existing = await prisma.user.findUnique({
      where: { tenantId_phone: { tenantId: tenant.id, phone } },
      select: { guest: true, phoneVerified: true },
    });
    if (existing && (existing.phoneVerified || existing.guest === false)) {
      return NextResponse.json({ error: "This number already has an account — please sign in to order." }, { status: 409 });
    }
    // A guest is not an authenticated account holder — they cannot redeem loyalty
    // points (that would let anyone spend a stranger's balance by typing their
    // phone). Public promo codes are fine; they don't draw down a user's points.
    delete body.rewardId;
    const guestUser = await findOrCreatePhoneUser(tenant.id, phone, String(body?.guest?.name || "").trim().slice(0, 60) || null);
    session = { user: { id: guestUser.id, tenantId: tenant.id, role: "customer" } };
  }

  const result = await createOrder(session, body, { paymentStatus: "paid" });
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status || 400 });

  const { order } = result;
  return NextResponse.json({ id: order.id, total: order.total, status: order.status });
}
