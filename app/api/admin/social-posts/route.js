import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Café-side share-reward queue.
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const posts = await prisma.socialPost.findMany({
    where: { tenantId: gate.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
  return NextResponse.json(posts);
}

// Approve / reject. Approval flips status atomically (guards double-award from
// two staff tabs) and only then credits the points.
export async function PATCH(req) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const { id, action } = b;
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id and action (approve|reject) required" }, { status: 400 });
  }

  const post = await prisma.socialPost.findFirst({ where: { id, tenantId: gate.tenantId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tenant = await prisma.tenant.findUnique({ where: { id: gate.tenantId }, select: { sharePoints: true } });
  const points = action === "approve" ? (tenant?.sharePoints ?? 50) : 0;

  const flipped = await prisma.socialPost.updateMany({
    where: { id, tenantId: gate.tenantId, status: "pending" },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      points,
      decidedAt: new Date(),
      decidedBy: gate.session.user.email,
    },
  });
  if (flipped.count === 0) return NextResponse.json({ error: "Already decided" }, { status: 409 });

  if (action === "approve" && points > 0) {
    await prisma.user.update({ where: { id: post.userId }, data: { points: { increment: points } } });
  }
  await logAudit({ session: gate.session, action: `share.${action}`, target: post.userId, meta: { url: post.url, points } });
  return NextResponse.json({ ok: true, status: action === "approve" ? "approved" : "rejected", points });
}
