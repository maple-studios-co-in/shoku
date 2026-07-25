import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

function toBrand(t) {
  if (!t) return null;
  return {
    name: t.name,
    brandHex: t.brandHex,
    darkHex: t.darkHex,
    font: t.font,
    subdomain: t.slug,
    aiAssistant: t.aiAssistant,
    aiCards: t.aiCards,
    aiUpsell: t.aiUpsell,
    aiLoyalty: t.aiLoyalty,
    storeName: t.storeName,
    address: t.address,
    locations: safeLocations(t.locations),
    gstRate: t.gstRate ?? 5, // checkout must display the same rate the server charges
    fssaiLicense: t.fssaiLicense || null, // storefront trust panel
    shareEnabled: t.shareEnabled ?? true,
    sharePoints: t.sharePoints ?? 50,
  };
}

function safeLocations(s) {
  try {
    const a = JSON.parse(s || "[]");
    return Array.isArray(a) ? a.filter((l) => l && l.label).slice(0, 20) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const tenant = await getCurrentTenant();
  return NextResponse.json(toBrand(tenant) || {});
}

export async function PUT(req) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const allowed = ["name", "brandHex", "darkHex", "font", "aiAssistant", "aiCards", "aiUpsell", "aiLoyalty", "storeName", "address"];
  const data = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  // Locations: array of {id,label,address} → stored as JSON
  if (Array.isArray(body.locations)) {
    data.locations = JSON.stringify(
      body.locations
        .filter((l) => l && String(l.label || "").trim())
        .slice(0, 20)
        .map((l, i) => ({
          id: String(l.id || `loc-${i}`).slice(0, 40),
          label: String(l.label).trim().slice(0, 60),
          address: String(l.address || "").trim().slice(0, 160),
        }))
    );
  }

  const tenant = await prisma.tenant.update({ where: { id: gate.tenantId }, data });
  return NextResponse.json(toBrand(tenant));
}
