"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useBrand } from "@/components/Providers";

const NAV = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/pos", label: "POS Billing", icon: "💵" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/menu", label: "Menu", icon: "☕" },
  { href: "/admin/tables", label: "Tables", icon: "🍽️" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/feedback", label: "Feedback", icon: "⭐" },
  { href: "/admin/discounts", label: "Discounts", icon: "🏷️" },
  { href: "/admin/loyalty", label: "Loyalty", icon: "🎁" },
  { href: "/admin/marketing", label: "Marketing", icon: "📲" },
  { href: "/admin/shares", label: "Share posts", icon: "📸" },
  { href: "/admin/banners", label: "Banners", icon: "🖼️" },
  { href: "/admin/branding", label: "Branding", icon: "🎨" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  { href: "/guide", label: "Guide", icon: "📖" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const { brand } = useBrand();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/admin");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <div className="grid min-h-screen place-items-center bg-canvas text-sm text-muted">Loading…</div>;
  }

  if (!["owner", "staff", "admin"].includes(session?.user?.role)) {
    const isSuperadmin = session?.user?.role === "superadmin";
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-8 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-50 text-3xl">🔒</div>
          <h1 className="text-lg font-bold">Staff only</h1>
          <p className="mt-1 text-sm text-muted">
            {isSuperadmin
              ? `This area is for ${brand.name} staff. You're signed in as the platform superadmin.`
              : `This area is for ${brand.name} staff. You're signed in as a customer.`}
          </p>
          {isSuperadmin && (
            <p className="mt-4 text-sm font-semibold">
              Own this business?{" "}
              <Link href="/super" className="font-bold text-brand-dark underline">Login here →</Link>
            </p>
          )}
          <Link href="/menu" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white">Back to app</Link>
        </div>
      </div>
    );
  }

  const active = (href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-canvas md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-sm font-extrabold text-white">{brand.name?.[0] || "P"}</div>
          <div>
            <div className="text-sm font-bold leading-tight">{brand.name}</div>
            <div className="text-[11px] text-muted">Admin console</div>
          </div>
        </div>
        <nav className="flex-1 p-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-colors ${
                active(n.href) ? "bg-brand-tint text-brand-dark" : "text-muted hover:bg-canvas"
              }`}>
              <span className="text-base">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <Link href="/menu" className="mb-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold text-muted hover:bg-canvas">🛍️ View store</Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold text-muted hover:bg-canvas">↩︎ Sign out</button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="sticky top-0 z-30 border-b border-line bg-white md:hidden">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-xs font-extrabold text-white">{brand.name?.[0] || "P"}</div>
          <div className="text-sm font-bold">{brand.name} Admin</div>
          <Link href="/menu" className="ml-auto text-xs font-semibold text-brand">View store</Link>
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${
                active(n.href) ? "bg-brand-tint text-brand-dark" : "bg-canvas text-muted"
              }`}>
              {n.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
    </div>
  );
}
