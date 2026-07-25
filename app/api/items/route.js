import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma, parseItem } from "@/lib/db";
import { classifyDiet } from "@/lib/foodIntel";

export const dynamic = "force-dynamic";

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

export async function POST(req) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!b.name || !b.categoryId) return NextResponse.json({ error: "Name and category are required." }, { status: 400 });

  // Category must belong to this tenant.
  const cat = await prisma.category.findFirst({ where: { id: b.categoryId, tenantId: gate.tenantId } });
  if (!cat) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

  let id = `${gate.tenantId.slice(-4)}-${slugify(b.name)}`;
  if (await prisma.item.findUnique({ where: { id } })) id = `${id}-${Date.now().toString().slice(-4)}`;

  const price = Math.max(0, Number(b.price) || 0);
  const sizes = Array.isArray(b.sizes) && b.sizes.length ? b.sizes : [{ name: "Regular", price }];

  const item = await prisma.item.create({
    data: {
      id,
      tenantId: gate.tenantId,
      name: b.name,
      categoryId: b.categoryId,
      price,
      img: b.img || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700",
      desc: b.desc || "",
      veg: b.veg !== false,
      kcal: Number(b.kcal) || 0,
      caffeine: Number(b.caffeine) || 0,
      protein: Number(b.protein) || 0,
      sugar: Number(b.sugar) || 0,
      signature: !!b.signature,
      rating: Number(b.rating) || 4.5,
      reviews: Number(b.reviews) || 0,
      origin: b.origin || "",
      ingredients: JSON.stringify(b.ingredients || []),
      allergens: JSON.stringify(b.allergens || []),
      tags: JSON.stringify(b.tags || []),
      sizes: JSON.stringify(sizes),
      aiTip: b.aiTip || "",
      // Auto-derive dietary tags (mayo→not vegan, plant milk→vegan, etc.) while
      // preserving any owner/cultural tags (halal-safe, vrat, custom) they typed.
      diet: JSON.stringify(classifyDiet({
        ingredients: Array.isArray(b.ingredients) ? b.ingredients : [],
        veg: b.veg !== false, sugar: Number(b.sugar) || 0, protein: Number(b.protein) || 0,
        categoryLabel: cat.label, diet: Array.isArray(b.diet) ? b.diet : [],
      })),
      type: b.type === "merch" ? "merch" : "food",
      stockQty: b.type === "merch" && Number.isFinite(Number(b.stockQty)) ? Math.max(0, Math.round(Number(b.stockQty))) : null,
      live: b.live !== false,
    },
    include: { category: true },
  });
  return NextResponse.json(parseItem(item));
}
