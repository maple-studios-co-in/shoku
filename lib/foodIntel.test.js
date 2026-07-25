import { describe, it, expect } from "vitest";
import { classifyDiet, lighterSwap, caffeineToday, dayStartMs, pairSuggestions } from "./foodIntel.js";

const base = { veg: true, sugar: 20, protein: 2, kcal: 300, categoryLabel: "Hot Coffee" };

describe("classifyDiet", () => {
  it("tags eggless + jain for a veg item with safe ingredients", () => {
    const t = classifyDiet({ ...base, ingredients: ["espresso", "water"] });
    expect(t).toContain("eggless");
    expect(t).toContain("jain");
  });
  it("blocks jain when onion/garlic/root veg present", () => {
    const t = classifyDiet({ ...base, ingredients: ["potato", "spices"] });
    expect(t).not.toContain("jain");
  });
  it("vegan only when no dairy/egg/honey", () => {
    expect(classifyDiet({ ...base, ingredients: ["dairy milk", "espresso"] })).not.toContain("vegan");
    expect(classifyDiet({ ...base, ingredients: ["soy", "espresso"] })).toContain("vegan");
  });
  it("treats plant milks as vegan (not dairy)", () => {
    expect(classifyDiet({ ...base, ingredients: ["oat milk", "espresso"] })).toContain("vegan");
    expect(classifyDiet({ ...base, ingredients: ["almond milk", "matcha"] })).toContain("vegan");
  });
  it("never auto-tags for non-veg", () => {
    const t = classifyDiet({ ...base, veg: false, ingredients: ["chicken"] });
    expect(t).not.toContain("eggless");
    expect(t).not.toContain("jain");
  });
  it("diabetic-friendly needs low sugar and non-dessert category", () => {
    expect(classifyDiet({ ...base, sugar: 4, ingredients: ["espresso"] })).toContain("diabetic-friendly");
    expect(classifyDiet({ ...base, sugar: 4, categoryLabel: "Desserts", ingredients: ["flour"] })).not.toContain("diabetic-friendly");
  });
  it("preserves owner-set cultural tags, never infers them", () => {
    expect(classifyDiet({ ...base, diet: ["halal-safe"], ingredients: ["espresso"] })).toContain("halal-safe");
    expect(classifyDiet({ ...base, ingredients: ["espresso"] })).not.toContain("halal-safe");
  });
  it("preserves ANY unmanaged owner tag on re-run, not just cultural ones", () => {
    // a made-up custom tag survives; managed tags are recomputed
    const out = classifyDiet({ ...base, diet: ["chefs-special", "vegan"], ingredients: ["soy", "espresso"] });
    expect(out).toContain("chefs-special");
    expect(out).toContain("vegan"); // re-derived
  });
  it("does NOT tag vegan/eggless when hidden egg (mayonnaise) is present", () => {
    const t = classifyDiet({ ...base, ingredients: ["bread", "mayonnaise", "lettuce"] });
    expect(t).not.toContain("vegan");
    expect(t).not.toContain("eggless");
    expect(t).not.toContain("jain");
  });
  it("does NOT tag vegan when hidden animal (gelatin) is present", () => {
    const t = classifyDiet({ ...base, categoryLabel: "Desserts", sugar: 20, ingredients: ["cream", "gelatin", "sugar"] });
    expect(t).not.toContain("vegan");
  });
  it("does NOT tag vegan when whey/casein/lactose present", () => {
    expect(classifyDiet({ ...base, ingredients: ["protein", "whey", "water"] })).not.toContain("vegan");
    expect(classifyDiet({ ...base, ingredients: ["lactose", "water"] })).not.toContain("vegan");
  });
  it("honey excludes both vegan AND jain", () => {
    const t = classifyDiet({ ...base, ingredients: ["honey", "flour", "water"] });
    expect(t).not.toContain("vegan");
    expect(t).not.toContain("jain");
  });
  it("carmine/gelatin/etc are treated as meat (no inference tags)", () => {
    const t = classifyDiet({ ...base, categoryLabel: "Desserts", sugar: 20, ingredients: ["sugar", "carmine"] });
    expect(t).not.toContain("vegan");
    expect(t).not.toContain("jain");
  });
  it("claims NO inference tag without ingredient evidence (empty list)", () => {
    const t = classifyDiet({ ...base, ingredients: [] });
    expect(t).not.toContain("eggless");
    expect(t).not.toContain("vegan");
    expect(t).not.toContain("jain");
  });
});

describe("dayStartMs (timezone-aware day boundary)", () => {
  it("returns IST midnight as a UTC instant", () => {
    // 2026-07-16T02:00:00Z is 2026-07-16 07:30 IST → IST day start is 2026-07-15T18:30:00Z
    const noonUtc = Date.parse("2026-07-16T02:00:00Z");
    const start = dayStartMs(noonUtc, 330);
    expect(new Date(start).toISOString()).toBe("2026-07-15T18:30:00.000Z");
  });
  it("a 1am-IST order counts toward that IST day, not the UTC day", () => {
    // 2026-07-15T20:00:00Z = 2026-07-16 01:30 IST
    const nowUtc = Date.parse("2026-07-15T20:00:00Z");
    const start = dayStartMs(nowUtc, 330); // = 2026-07-15T18:30:00Z
    const orders = [{ createdAt: new Date("2026-07-15T19:30:00Z"), items: [{ itemId: "x", qty: 1 }] }]; // 01:00 IST
    expect(caffeineToday(orders, { x: { caffeine: 95 } }, start)).toBe(95);
  });
});

describe("lighterSwap", () => {
  const menu = [
    { id: "a", category: "c1", sugar: 30, kcal: 300 },
    { id: "b", category: "c1", sugar: 5, kcal: 120, live: true },
    { id: "c", category: "c2", sugar: 1, kcal: 50 },
  ];
  it("suggests a same-category item with ≤half the sugar", () => {
    expect(lighterSwap(menu[0], menu)?.id).toBe("b");
  });
  it("stays quiet for already-light items", () => {
    expect(lighterSwap(menu[1], menu)).toBeNull();
  });
});

describe("caffeineToday", () => {
  it("sums only orders on/after the day boundary", () => {
    const start = Date.parse("2026-07-16T00:00:00Z");
    const orders = [
      { createdAt: new Date("2026-07-16T04:00:00Z"), items: [{ itemId: "x", qty: 2 }] }, // today
      { createdAt: new Date("2026-07-15T10:00:00Z"), items: [{ itemId: "x", qty: 5 }] }, // yesterday
    ];
    expect(caffeineToday(orders, { x: { caffeine: 95 } }, start)).toBe(190);
  });
});

describe("pairSuggestions", () => {
  const items = [
    { id: "latte", categoryKey: "hot", categoryLabel: "Hot Coffee", name: "Latte", rating: 4.5, price: 300, live: true },
    { id: "croissant", categoryKey: "food", categoryLabel: "Food", name: "Croissant", rating: 4.6, price: 180, live: true },
    { id: "tee", categoryKey: "merch", name: "Tee", type: "merch", rating: 5, price: 500, live: true },
  ];
  it("suggests food for a drink-only cart, never merch or in-cart items", () => {
    const s = pairSuggestions([{ id: "latte" }], items);
    expect(s[0].id).toBe("croissant");
    expect(s.find((i) => i.id === "tee")).toBeUndefined();
    expect(s.find((i) => i.id === "latte")).toBeUndefined();
  });
  it("empty cart → no suggestions", () => {
    expect(pairSuggestions([], items)).toEqual([]);
  });
});
