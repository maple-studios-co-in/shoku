import { headers } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";

// Subdomains that are never assignable to a café.
export const RESERVED = new Set([
  "www", "console", "admin", "api", "app", "mail", "assets", "static", "super",
]);

export const BASE_DOMAIN = process.env.BASE_DOMAIN || "shoku.maplestudios.co.in";
export const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || "cbtl";

// Extract a café slug from a host header. Returns null for apex / IP / localhost
// / unknown domains (caller then falls back to the default tenant).
export function slugFromHost(host) {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase();
  if (h === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return null;
  if (h === BASE_DOMAIN || h === `www.${BASE_DOMAIN}`) return null;
  if (h.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = h.slice(0, -(BASE_DOMAIN.length + 1)).split(".")[0];
    return RESERVED.has(sub) ? null : sub;
  }
  return null;
}

export const getTenantBySlug = cache(async (slug) =>
  slug ? prisma.tenant.findUnique({ where: { slug } }) : null
);

export const getDefaultTenant = cache(async () => {
  let t = await prisma.tenant.findUnique({ where: { slug: DEFAULT_TENANT_SLUG } });
  if (!t) t = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  return t;
});

// Resolve the tenant for the current request (storefront reads).
// Order: middleware-set header → host → default tenant.
export const getCurrentTenant = cache(async () => {
  const h = await headers(); // Next 15: headers() is async
  const slug = h.get("x-tenant-slug") || slugFromHost(h.get("host"));
  let t = null;
  if (slug && !RESERVED.has(slug)) t = await getTenantBySlug(slug);
  if (!t) t = await getDefaultTenant();
  return t;
});
