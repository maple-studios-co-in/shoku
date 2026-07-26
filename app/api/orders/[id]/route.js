import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED = ["preparing", "ready", "completed", "cancelled"];

export async function PATCH(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!ALLOWED.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const res = await prisma.order.updateMany({
    where: { id: (await params).id, tenantId: gate.tenantId },
    data: { status: body.status },
  });
  if (res.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: (await params).id, status: body.status });
}
