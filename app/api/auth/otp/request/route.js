import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { requestOtp } from "@/lib/otp";
import { clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Step 1 of phone login: send (or demo-issue) a 6-digit code.
export async function POST(req) {
  const tenant = await getCurrentTenant();
  if (!tenant || tenant.status !== "active") {
    return NextResponse.json({ error: "This store is unavailable right now." }, { status: 403 });
  }
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const out = await requestOtp({
    tenant,
    phone: b.phone,
    name: String(b.name || "").trim().slice(0, 60) || null,
    ip: clientIp(req),
  });
  if (out.error) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json(out);
}
