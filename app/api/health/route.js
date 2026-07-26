import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isPaymentsConfigured } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Liveness + DB readiness probe for load balancers / uptime monitors. Also
// surfaces prod-config state so a misconfigured deploy is visible at a glance.
export async function GET() {
  const started = Date.now();
  const prod = process.env.NODE_ENV === "production";
  const payments = isPaymentsConfigured() ? "live" : (prod && process.env.ALLOW_MOCK_CHECKOUT === "1" ? "mock-allowed" : prod ? "pay-at-counter" : "dev");
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up", payments, ms: Date.now() - started });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down", payments }, { status: 503 });
  }
}
