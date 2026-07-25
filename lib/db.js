import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Item rows store array fields as JSON strings — parse them for the app.
export function parseItem(it) {
  if (!it) return null;
  const j = (s, d) => {
    try {
      return JSON.parse(s);
    } catch {
      return d;
    }
  };
  const { category, ...rest } = it;
  return {
    ...rest,
    category: it.categoryId,
    categoryKey: category?.key,
    categoryLabel: category?.label,
    ingredients: j(it.ingredients, []),
    allergens: j(it.allergens, []),
    tags: j(it.tags, []),
    sizes: j(it.sizes, []),
    diet: j(it.diet, []),
  };
}
