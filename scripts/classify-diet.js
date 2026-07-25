// Backfill dietary tags for all items (rule-based, conservative).
// Idempotent — safe to re-run; owner-set cultural tags (halal-safe, vrat) survive.
//   node scripts/classify-diet.js [tenantSlug]
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mirror of lib/foodIntel.classifyDiet (kept dependency-free for plain node).
const has = (ings, words) => words.some((w) => ings.some((h) => h.includes(w)));
const EGG = ["egg", "mayonnaise", "mayo", "aioli", "meringue", "albumen"];
const DAIRY = ["milk", "butter", "cheese", "cream", "ghee", "paneer", "curd", "yogurt", "yoghurt",
  "mawa", "khoya", "whey", "casein", "lactose", "custard", "kheer", "condensed", "malai", "buttermilk"];
const MEAT = ["chicken", "mutton", "fish", "prawn", "meat", "bacon", "ham", "pepperoni", "gelatin", "gelatine",
  "fish sauce", "anchovy", "lard", "suet", "oyster", "shrimp", "beef", "pork", "sausage", "keema", "rennet",
  "carmine", "cochineal", "isinglass", "shellac"];
const HONEY = ["honey"];
const ALLIUM_ROOT = ["onion", "garlic", "potato", "carrot", "beetroot", "radish", "ginger", "leek", "shallot", "spring onion", "scallion"];
const SWEET = ["dessert", "bake", "cake", "pastry", "sweet"];
const MANAGED = ["eggless", "vegan", "jain", "diabetic-friendly", "low-sugar", "high-protein"];
const PLANT_MILK = ["oat milk", "almond milk", "soy milk", "soya milk", "coconut milk", "cashew milk", "rice milk", "macadamia milk", "plant milk", "plant-based milk"];
const stripPlantMilk = (ings) => ings.map((i) => { let s = String(i).toLowerCase(); for (const pm of PLANT_MILK) s = s.split(pm).join(" "); return s; });

function classify(item, catLabel) {
  let ings = [];
  try { ings = JSON.parse(item.ingredients || "[]").map((s) => String(s).toLowerCase()); } catch {}
  let prev = [];
  try { prev = JSON.parse(item.diet || "[]"); } catch {}
  const tags = new Set(prev.filter((t) => !MANAGED.includes(t))); // preserve owner/cultural/custom tags
  const nonMilk = stripPlantMilk(ings);
  const meaty = !item.veg || has(ings, MEAT);
  if (!meaty) {
    if (!has(ings, EGG) && ings.length > 0) tags.add("eggless");
    if (!has(ings, EGG) && !has(nonMilk, DAIRY) && !has(ings, HONEY) && ings.length > 0) tags.add("vegan");
    if (!has(ings, ALLIUM_ROOT) && !has(ings, EGG) && !has(ings, HONEY) && ings.length > 0) tags.add("jain");
  }
  const cat = String(catLabel || "").toLowerCase();
  if ((item.sugar ?? 99) <= 8 && !SWEET.some((w) => cat.includes(w))) tags.add("diabetic-friendly");
  if ((item.sugar ?? 99) <= 5) tags.add("low-sugar");
  if ((item.protein ?? 0) >= 15) tags.add("high-protein");
  return [...tags].sort();
}

(async () => {
  const slug = process.argv[2];
  const where = slug ? { tenant: { slug } } : {};
  const items = await prisma.item.findMany({ where, include: { category: true } });
  let changed = 0;
  for (const it of items) {
    const tags = classify(it, it.category?.label);
    const next = JSON.stringify(tags);
    if (next !== it.diet) { await prisma.item.update({ where: { id: it.id }, data: { diet: next } }); changed++; }
  }
  console.log(`✓ classified ${items.length} items, updated ${changed}${slug ? ` ('${slug}')` : ""}`);
  process.exit(0);
})();
