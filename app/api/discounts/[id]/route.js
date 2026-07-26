import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const existing = await prisma.discount.findFirst({ where: { id: (await params).id, tenantId: gate.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = {};
  if ("active" in b) data.active = !!b.active;
  if ("percent" in b) data.percent = Math.max(1, Math.min(90, Number(b.percent) || 0));
  const d = await prisma.discount.update({ where: { id: (await params).id }, data });
  return NextResponse.json(d);
}

export async function DELETE(_req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const existing = await prisma.discount.findFirst({ where: { id: (await params).id, tenantId: gate.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.discount.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
