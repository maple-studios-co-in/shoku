import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const existing = await prisma.reward.findFirst({ where: { id: (await params).id, tenantId: gate.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = {};
  if ("active" in b) data.active = !!b.active;
  if ("cost" in b) data.cost = Math.max(1, Number(b.cost) || 0);
  if ("amount" in b) data.amount = Math.max(0, Number(b.amount) || 0);
  const reward = await prisma.reward.update({ where: { id: (await params).id }, data });
  return NextResponse.json(reward);
}

export async function DELETE(_req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const existing = await prisma.reward.findFirst({ where: { id: (await params).id, tenantId: gate.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.reward.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
