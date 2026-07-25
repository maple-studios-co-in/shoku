"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./Providers";

const TABS = [
  { href: "/menu", label: "Menu", icon: "🏠" },
  { href: "/ai", label: "Shoku AI", icon: "✨" },
  { href: "/shop", label: "Shop", icon: "🛒" },
  { href: "/cart", label: "Bag", icon: "🛍️" },
  { href: "/account", label: "Account", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="sticky bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white/90 backdrop-blur-md">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
              active ? "text-brand" : "text-muted"
            }`}
          >
            {active && <span className="absolute inset-x-6 top-0 h-[2px] rounded-full bg-brand" />}
            <span className={`text-lg leading-none transition-transform ${active ? "scale-110" : ""}`}>{t.icon}</span>
            {t.label}
            {t.href === "/cart" && count > 0 && (
              <span className="absolute right-[22%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
