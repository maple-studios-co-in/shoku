import { NextResponse } from "next/server";
import { prisma, parseItem } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const tenant = await getCurrentTenant();
  const item = await prisma.item.findFirst({
    where: { id: (await params).id, tenantId: tenant?.id },
    include: { category: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(parseItem(item));
}
