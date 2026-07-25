import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Share-to-earn: a signed-in diner submits a social post link for review.
// Café staff approve in /admin/shares → points awarded there (atomically).
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to earn share rewards." }, { status: 401 });
  if (!rateLimit(`share:${clientIp(req)}`, { limit: 10, windowMs: 3_600_000 }).ok) {
    return NextResponse.json({ error: "Too many submissions — try later." }, { status: 429 });
  }

  const tenant = await getCurrentTenant();
  if (!tenant || tenant.shareEnabled === false) {
    return NextResponse.json({ error: "Share rewards aren't enabled here." }, { status: 400 });
  }

  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const url = String(b.url || "").trim().slice(0, 500);
  const note = String(b.note || "").trim().slice(0, 280);
  let host = "";
  try { host = new URL(url).hostname; } catch {}
  if (!/^https:\/\//.test(url) || !host.includes(".")) {
    return NextResponse.json({ error: "Paste the full https:// link to your post." }, { status: 400 });
  }

  // One submission per rolling 24h per diner — keeps it special, matches the copy.
  const dayAgo = new Date(Date.now() - 86_400_000);
  const recent = await prisma.socialPost.count({
    where: { tenantId: tenant.id, userId: session.user.id, createdAt: { gte: dayAgo } },
  });
  if (recent > 0) return NextResponse.json({ error: "You've already shared in the last 24 hours — check back later! ✨" }, { status: 429 });

  // Only attach an orderId the diner actually owns at this café (prevents attaching
  // someone else's / another tenant's order to a share submission).
  let orderId = null;
  if (b.orderId) {
    const owned = await prisma.order.findFirst({
      where: { id: String(b.orderId), tenantId: tenant.id, userId: session.user.id },
      select: { id: true },
    });
    orderId = owned?.id || null;
  }

  const post = await prisma.socialPost.create({
    data: { tenantId: tenant.id, userId: session.user.id, orderId, url, note },
  });
  return NextResponse.json({ ok: true, id: post.id, points: tenant.sharePoints ?? 50 });
}

// The diner's own submissions (for the account page status list).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const posts = await prisma.socialPost.findMany({
    where: { userId: session.user.id, tenantId: session.user.tenantId ?? undefined },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, url: true, status: true, points: true, createdAt: true },
  });
  return NextResponse.json(posts);
}
