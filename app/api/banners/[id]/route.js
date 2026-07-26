import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const existing = await prisma.banner.findFirst({ where: { id: (await params).id, tenantId: gate.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = {};
  if ("title" in b) data.title = b.title ? String(b.title).slice(0, 80) : null;
  if ("subtitle" in b) data.subtitle = b.subtitle ? String(b.subtitle).slice(0, 120) : null;
  if ("imageUrl" in b && b.imageUrl) data.imageUrl = String(b.imageUrl);
  if ("link" in b) data.link = b.link ? String(b.link).slice(0, 300) : null;
  if ("active" in b) data.active = !!b.active;
  if ("sort" in b) data.sort = Number(b.sort) || 0;

  const banner = await prisma.banner.update({ where: { id: (await params).id }, data });
  return NextResponse.json(banner);
}

export async function DELETE(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const existing = await prisma.banner.findFirst({ where: { id: (await params).id, tenantId: gate.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.banner.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
