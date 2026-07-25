import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseTiers, tierFor } from "@/lib/loyalty";
import { caffeineToday, dayStartMs, CAFFEINE_DAILY_LIMIT } from "@/lib/foodIntel";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, tenantId: true, points: true, _count: { select: { orders: true } } },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let tier = null;
  if (user.tenantId) {
    const t = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { tiers: true } });
    tier = tierFor(user.points, parseTiers(t?.tiers));
  }

  // Caffeine ledger: sum today's paid orders (mg). "Today" = the diner's local
  // day (IST) so the meter resets at local midnight, not the server's.
  const start = dayStartMs(); // IST day start, as a UTC instant
  const todays = await prisma.order.findMany({
    where: { userId: user.id, paymentStatus: "paid", createdAt: { gte: new Date(start) } },
    include: { items: { select: { itemId: true, qty: true } } },
  });
  const ids = [...new Set(todays.flatMap((o) => o.items.map((l) => l.itemId)))];
  const caff = ids.length
    ? Object.fromEntries((await prisma.item.findMany({ where: { id: { in: ids } }, select: { id: true, caffeine: true } })).map((i) => [i.id, i]))
    : {};
  const caffeineMg = caffeineToday(todays, caff, start);

  return NextResponse.json({
    id: user.id, name: user.name, email: user.email, role: user.role,
    tenantId: user.tenantId, points: user.points, orders: user._count.orders, tier,
    caffeineMg, caffeineLimit: CAFFEINE_DAILY_LIMIT,
  });
}
