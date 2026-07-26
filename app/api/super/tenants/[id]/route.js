import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const gate = await requireSuperadmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const allowed = ["name", "status", "plan", "brandHex", "darkHex", "font", "storeName", "address", "posEnabled"];
  const data = {};
  for (const k of allowed) if (k in b) data[k] = b[k];
  // AI overrides: empty string clears (falls back to plan default / env).
  if ("aiApiKey" in b) data.aiApiKey = encryptSecret(String(b.aiApiKey || "").trim() || null);
  if ("aiModel" in b) data.aiModel = String(b.aiModel || "").trim() || null;
  if ("aiBaseUrl" in b) data.aiBaseUrl = String(b.aiBaseUrl || "").trim() || null;

  const tenant = await prisma.tenant.update({ where: { id: params.id }, data });

  // Key material never goes in the audit log — only whether one is set.
  if (["aiApiKey", "aiModel", "aiBaseUrl"].some((k) => k in b)) {
    await logAudit({
      session: gate.session,
      action: "tenant.ai_config",
      target: tenant.slug,
      meta: { model: tenant.aiModel, baseUrl: tenant.aiBaseUrl, keySet: !!tenant.aiApiKey },
    });
  }

  return NextResponse.json({ id: tenant.id, status: tenant.status, plan: tenant.plan, posEnabled: tenant.posEnabled });
}
