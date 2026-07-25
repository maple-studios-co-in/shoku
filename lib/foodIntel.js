// Food intelligence — pure, rule-based helpers (no LLM required, LLM can refine).
// Classification is conservative: we only auto-tag what ingredients can prove.
// Culturally sensitive tags (halal-safe, vrat) are OWNER-SET only, never inferred.

const has = (ings, words) => {
  const hay = ings.map((s) => String(s).toLowerCase());
  return words.some((w) => hay.some((h) => h.includes(w)));
};

// Plant milks are vegan but contain the substring "milk" — strip them before the
// dairy check so an oat/almond-milk drink isn't misread as dairy (a false NEGATIVE
// for vegan, i.e. safe, but it needlessly hides the badge on common café drinks).
const PLANT_MILK = ["oat milk", "almond milk", "soy milk", "soya milk", "coconut milk",
  "cashew milk", "rice milk", "macadamia milk", "plant milk", "plant-based milk"];
const stripPlantMilk = (ings) =>
  ings.map((i) => { let s = String(i).toLowerCase(); for (const pm of PLANT_MILK) s = s.split(pm).join(" "); return s; });

// Word lists err on the side of NOT tagging — a false "vegan/jain" badge is worse
// than a missing one, because diners filter on these for religious/dietary reasons.
// Hidden animal derivatives are included: mayonnaise/aioli (egg), whey/casein/
// gelatin (dairy/animal), fish sauce/anchovy/lard (meat).
const EGG = ["egg", "mayonnaise", "mayo", "aioli", "meringue", "albumen"];
const DAIRY = ["milk", "butter", "cheese", "cream", "ghee", "paneer", "curd", "yogurt", "yoghurt",
  "mawa", "khoya", "whey", "casein", "lactose", "custard", "kheer", "condensed", "malai", "buttermilk"];
const MEAT = ["chicken", "mutton", "fish", "prawn", "meat", "bacon", "ham", "pepperoni", "gelatin", "gelatine",
  "fish sauce", "anchovy", "lard", "suet", "oyster", "shrimp", "beef", "pork", "sausage", "keema", "rennet",
  "carmine", "cochineal", "isinglass", "shellac"];
const HONEY = ["honey"];
const ALLIUM_ROOT = ["onion", "garlic", "potato", "carrot", "beetroot", "radish", "ginger",
  "leek", "shallot", "spring onion", "scallion"]; // jain-excluded
const SWEET_CATS = ["dessert", "bake", "cake", "pastry", "sweet"];

// Tags the classifier OWNS (derived from ingredients/numbers). Anything else in an
// item's diet array (halal-safe, vrat, custom owner tags) is preserved on re-run.
export const MANAGED_DIET_TAGS = ["eggless", "vegan", "jain", "diabetic-friendly", "low-sugar", "high-protein"];

// Auto-derivable tags from ingredients + numbers. Returns a sorted string array.
export function classifyDiet(item) {
  const ings = Array.isArray(item.ingredients) ? item.ingredients : [];
  // Preserve every tag the classifier does not manage (owner-set / cultural / custom).
  const tags = new Set(Array.isArray(item.diet) ? item.diet.filter((t) => !MANAGED_DIET_TAGS.includes(t)) : []);

  const nonMilk = stripPlantMilk(ings); // for the dairy test only — plant milks removed
  const meaty = !item.veg || has(ings, MEAT);
  if (!meaty) {
    // All inference tags require ingredient evidence — never claim eggless/vegan/jain
    // for an item with no ingredients listed (it might contain the excluded thing).
    if (!has(ings, EGG) && ings.length > 0) tags.add("eggless");
    if (!has(ings, EGG) && !has(nonMilk, DAIRY) && !has(ings, HONEY) && ings.length > 0) tags.add("vegan");
    // Strict Jains avoid honey too — the vegan branch already guards it; mirror it here.
    if (!has(ings, ALLIUM_ROOT) && !has(ings, EGG) && !has(ings, HONEY) && ings.length > 0) tags.add("jain");
  }
  // Diabetic-friendly: measurably low sugar and not a dessert-family item.
  const cat = String(item.categoryLabel || item.categoryKey || "").toLowerCase();
  if ((item.sugar ?? 99) <= 8 && !SWEET_CATS.some((w) => cat.includes(w))) tags.add("diabetic-friendly");
  if ((item.sugar ?? 99) <= 5) tags.add("low-sugar");
  if ((item.protein ?? 0) >= 15) tags.add("high-protein");
  return [...tags].sort();
}

export const DIET_META = {
  jain: { label: "Jain", emoji: "🙏" },
  vegan: { label: "Vegan", emoji: "🌱" },
  eggless: { label: "Eggless", emoji: "🥚" },
  vrat: { label: "Vrat-safe", emoji: "🪔" },
  "halal-safe": { label: "Halal", emoji: "☪️" },
  "diabetic-friendly": { label: "Diabetic-friendly", emoji: "💚" },
  "low-sugar": { label: "Low sugar", emoji: "🍃" },
  "high-protein": { label: "High protein", emoji: "💪" },
};

// Filter chips shown on the menu (order = display order).
export const DIET_FILTERS = ["jain", "vegan", "eggless", "vrat", "halal-safe", "diabetic-friendly", "low-sugar", "high-protein"];

// A gentler alternative in the same category: meaningfully less sugar (and not
// more calories), best match first. Used on the item page.
export function lighterSwap(item, items) {
  if ((item.sugar ?? 0) < 12) return null; // already light — no nag
  return (
    items
      .filter((i) => i.id !== item.id && i.category === item.category && i.live !== false)
      .filter((i) => (i.sugar ?? 99) <= (item.sugar ?? 0) * 0.5 && (i.kcal ?? 99) <= (item.kcal ?? 0) * 1.1)
      .sort((a, b) => (a.sugar ?? 0) - (b.sugar ?? 0))[0] || null
  );
}

// Start-of-day for a given IANA offset (default IST +5:30), returned as a UTC
// epoch-ms instant. Server timezone is irrelevant — "today" is the diner's day.
export function dayStartMs(nowMs = Date.now(), offsetMinutes = 330) {
  const off = offsetMinutes * 60_000;
  const localMidnight = Math.floor((nowMs + off) / 86_400_000) * 86_400_000;
  return localMidnight - off; // UTC instant of local midnight
}

// Total caffeine (mg) a diner has ordered since `startMs` (default: IST today),
// from their paid orders. orders: [{ createdAt, items:[{itemId, qty}] }].
export function caffeineToday(orders, itemsById, startMs = dayStartMs()) {
  let mg = 0;
  for (const o of orders) {
    if (new Date(o.createdAt).getTime() < startMs) continue;
    for (const l of o.items || []) mg += (itemsById[l.itemId]?.caffeine ?? 0) * (l.qty || 1);
  }
  return mg;
}

// 400mg is the widely-cited adult daily guideline — used for the meter only,
// never as medical advice.
export const CAFFEINE_DAILY_LIMIT = 400;

// Cart pairing: what goes well with what's already in the bag. Rule-based:
// drinks pair with food and vice versa; prefer signature/high-rated, cheap
// add-ons first; never suggest something already in the cart.
export function pairSuggestions(cartLines, items, limit = 3) {
  const inCart = new Set(cartLines.map((l) => l.id));
  const cartItems = cartLines.map((l) => items.find((i) => i.id === l.id)).filter(Boolean);
  if (!cartItems.length) return [];
  const foodish = (i) => /food|bake|snack|dessert|sandwich|croissant|toast|cookie|cake/.test(`${i.categoryKey} ${i.categoryLabel} ${i.name}`.toLowerCase());
  const cartHasFood = cartItems.some(foodish);
  const cartHasDrink = cartItems.some((i) => !foodish(i));
  return items
    .filter((i) => !inCart.has(i.id) && i.live !== false && i.type !== "merch")
    .map((i) => {
      let score = (i.rating ?? 0) + (i.signature ? 1.5 : 0);
      if (cartHasDrink && !cartHasFood && foodish(i)) score += 2;      // drink alone → pitch a bite
      if (cartHasFood && !cartHasDrink && !foodish(i)) score += 2;     // food alone → pitch a drink
      if (i.price <= 250) score += 0.5;                                // easy yes
      return { item: i, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}
