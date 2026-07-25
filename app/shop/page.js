"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { useCart, useBrand } from "@/components/Providers";
import { formatINR } from "@/lib/menu";

// Café merch shelf — mugs, beans, tees. Pickup at the counter with your order.
function MerchCard({ item }) {
  const { add, dec, qtyOf } = useCart();
  const qty = qtyOf(item.id);
  const out = item.stockQty !== null && item.stockQty <= 0;
  const low = item.stockQty !== null && item.stockQty > 0 && item.stockQty <= 5;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative">
        <img src={item.img} alt={item.name} className={`h-36 w-full object-cover ${out ? "opacity-40 grayscale" : ""}`} />
        {low && <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">Only {item.stockQty} left</span>}
        {out && <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-white">Sold out</span>}
      </div>
      <div className="p-3">
        <div className="truncate text-[13.5px] font-semibold">{item.name}</div>
        {item.desc && <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted">{item.desc}</p>}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold">{formatINR(item.price)}</span>
          {out ? (
            <span className="text-[11px] font-bold text-muted">—</span>
          ) : qty > 0 ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-brand bg-brand-tint px-2 py-1">
              <button onClick={() => dec(item)} className="w-4 text-base font-bold leading-none text-brand-dark" aria-label="Remove one">−</button>
              <span className="min-w-3.5 text-center text-[13px] font-bold text-brand-dark">{qty}</span>
              <button onClick={() => add(item)} disabled={item.stockQty !== null && qty >= item.stockQty}
                className="w-4 text-base font-bold leading-none text-brand-dark disabled:opacity-40" aria-label="Add one">+</button>
            </div>
          ) : (
            <button onClick={() => add(item)} className="rounded-lg border border-brand bg-brand-tint px-3.5 py-1.5 text-[11.5px] font-bold text-brand-dark active:scale-95">ADD +</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { brand } = useBrand();
  const [items, setItems] = useState(null);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems((d?.items || []).filter((i) => i.type === "merch")))
      .catch(() => setItems([]));
  }, []);

  return (
    <AppShell>
      <Header showSearch={false} />
      <div className="px-4 pb-28">
        <h1 className="pt-4 text-lg font-bold">Shop {brand.name}</h1>
        <p className="mt-0.5 text-[12.5px] text-muted">Beans, mugs and merch — pay here, pick up at the counter. 🛍️</p>

        {items === null && <div className="py-12 text-center text-sm text-muted">Loading…</div>}

        {items?.length === 0 && (
          <div className="py-14 text-center">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-canvas text-3xl">🛍️</div>
            <p className="text-sm font-bold">No merch on the shelf yet</p>
            <p className="mt-1 text-xs text-muted">Check back soon — beans, mugs and more are coming.</p>
            <Link href="/menu" className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">Browse the menu</Link>
          </div>
        )}

        {items?.length > 0 && (
          <div className="mt-3.5 grid grid-cols-2 gap-3">
            {items.map((i) => <MerchCard key={i.id} item={i} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
