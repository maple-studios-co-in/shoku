import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma, parseItem } from "@/lib/db";
import { classifyDiet } from "@/lib/foodIntel";

export const dynamic = "force-dynamic";

async function owned(id, tenantId) {
  return prisma.item.findFirst({ where: { id, tenantId } });
}

export async function PATCH(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  if (!(await owned(params.id, gate.tenantId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = {};
  if ("live" in body) data.live = !!body.live;
  if ("price" in body) data.price = Math.max(0, Number(body.price) || 0);

  const item = await prisma.item.update({ where: { id: params.id }, data, include: { category: true } });
  return NextResponse.json(parseItem(item));
}

export async function PUT(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  if (!(await owned(params.id, gate.tenantId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const price = Math.max(0, Number(b.price) || 0);
  const sizes = Array.isArray(b.sizes) && b.sizes.length ? b.sizes : [{ name: "Regular", price }];

  const item = await prisma.item.update({
    where: { id: params.id },
    data: {
      name: b.name,
      categoryId: b.categoryId,
      price,
      img: b.img,
      desc: b.desc || "",
      veg: b.veg !== false,
      kcal: Number(b.kcal) || 0,
      caffeine: Number(b.caffeine) || 0,
      protein: Number(b.protein) || 0,
      sugar: Number(b.sugar) || 0,
      signature: !!b.signature,
      origin: b.origin || "",
      ingredients: JSON.stringify(b.ingredients || []),
      allergens: JSON.stringify(b.allergens || []),
      tags: JSON.stringify(b.tags || []),
      sizes: JSON.stringify(sizes),
      aiTip: b.aiTip || "",
      diet: JSON.stringify(classifyDiet({
        ingredients: Array.isArray(b.ingredients) ? b.ingredients : [],
        veg: b.veg !== false, sugar: Number(b.sugar) || 0, protein: Number(b.protein) || 0,
        categoryLabel: b.categoryLabel || "", diet: Array.isArray(b.diet) ? b.diet : [],
      })),
      type: b.type === "merch" ? "merch" : "food",
      stockQty: b.type === "merch" && Number.isFinite(Number(b.stockQty)) ? Math.max(0, Math.round(Number(b.stockQty))) : null,
      live: b.live !== false,
    },
    include: { category: true },
  });
  return NextResponse.json(parseItem(item));
}

export async function DELETE(_req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  if (!(await owned(params.id, gate.tenantId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const refs = await prisma.orderItem.count({ where: { itemId: params.id } });
  if (refs > 0) {
    return NextResponse.json(
      { error: "This item appears in past orders. Toggle it off (hide) instead of deleting." },
      { status: 409 }
    );
  }
  await prisma.item.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
