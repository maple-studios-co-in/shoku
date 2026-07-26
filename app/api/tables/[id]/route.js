import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// Public: storefront resolves a table's label for the "ordering for Table X" banner.
export async function GET(_req, { params }) {
  const tenant = await getCurrentTenant();
  const table = await prisma.table.findFirst({ where: { id: (await params).id, tenantId: tenant?.id, active: true } });
  if (!table) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: table.id, label: table.label });
}

export async function PATCH(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const existing = await prisma.table.findFirst({ where: { id: (await params).id, tenantId: gate.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = {};
  if ("active" in b) data.active = !!b.active;
  if ("label" in b) data.label = String(b.label).trim().slice(0, 30);
  const table = await prisma.table.update({ where: { id: (await params).id }, data });
  return NextResponse.json(table);
}

export async function DELETE(_req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const existing = await prisma.table.findFirst({ where: { id: (await params).id, tenantId: gate.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const refs = await prisma.order.count({ where: { tableId: (await params).id } });
  if (refs > 0) {
    // keep order history intact — deactivate instead of hard delete
    await prisma.table.update({ where: { id: (await params).id }, data: { active: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }
  await prisma.table.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
