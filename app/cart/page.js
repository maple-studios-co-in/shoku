"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useCart, useBrand } from "@/components/Providers";
import { formatINR } from "@/lib/menu";
import { pairSuggestions } from "@/lib/foodIntel";

function Stepper({ line }) {
  const { setQty } = useCart();
  return (
    <div className="flex items-center gap-3 rounded-lg bg-canvas px-2.5 py-1.5">
      <button onClick={() => setQty(line.key, line.qty - 1)} className="w-4 text-lg font-bold text-brand">−</button>
      <span className="min-w-3.5 text-center text-sm font-bold">{line.qty}</span>
      <button onClick={() => setQty(line.key, line.qty + 1)} className="w-4 text-lg font-bold text-brand">+</button>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { lines, subtotal, add, ready } = useCart();
  const { brand } = useBrand();
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.items && setMenuItems(d.items))
      .catch(() => {});
  }, []);

  // Pairing engine: complements what's actually in the bag (drink→bite, bite→drink).
  const suggestions = brand.aiUpsell === false ? [] : pairSuggestions(lines, menuItems, 3);

  if (ready && lines.length === 0) {
    return (
      <AppShell>
        <div className="grid min-h-[70vh] place-items-center px-8 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-brand-tint text-4xl">🛍️</div>
            <h2 className="text-lg font-bold">Your bag is empty</h2>
            <p className="mt-1 text-sm text-muted">Add something delicious from the menu.</p>
            <Link href="/menu" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white">Browse menu</Link>
            <Link href="/ai" className="mt-3 block text-sm font-semibold text-brand">or ask Shoku AI ✨</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const taxes = Math.round((subtotal * (brand.gstRate ?? 5)) / 100); // same rate the server charges
  const reward = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal + taxes - reward);

  return (
    <AppShell>
      <div className="pb-28">
        <h1 className="px-4 pb-1 pt-4 text-lg font-bold">Your bag</h1>

        {lines.map((l) => (
          <div key={l.key} className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <img src={l.img} alt={l.name} className="h-[60px] w-[60px] rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{l.name}</div>
              <div className="text-[11.5px] text-muted">{l.size}{l.milk ? ` · ${l.milk}` : ""}</div>
              <div className="mt-1 text-sm font-bold">{formatINR(l.unit * l.qty)}</div>
            </div>
            <Stepper line={l} />
          </div>
        ))}

        {suggestions.length > 0 && (
          <div className="mx-4 my-4 rounded-2xl border border-brand bg-brand-tint p-3.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark">✨ Shoku AI · goes well with your bag</div>
            {suggestions.map((s) => (
              <div key={s.id} className="mt-2 flex items-center gap-3">
                <img src={s.img} alt={s.name} className="h-11 w-11 rounded-xl object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold">{s.name}</div>
                  <div className="text-[11.5px] text-muted">{s.kcal} kcal · {formatINR(s.price)}</div>
                </div>
                <button onClick={() => add(s)} className="ml-auto shrink-0 rounded-lg border border-brand px-3.5 py-1.5 text-[12.5px] font-bold text-brand-dark">Add</button>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 pt-1">
          <Row label="Subtotal" value={formatINR(subtotal)} />
          <Row label="Taxes & charges" value={formatINR(taxes)} />
          <Row label="✨ AI loyalty reward (−5%)" value={`−${formatINR(reward)}`} green />
          <div className="mt-1.5 flex justify-between border-t border-dashed border-line pt-3 text-base font-extrabold">
            <span>Total</span><span>{formatINR(total)}</span>
          </div>
        </div>
      </div>

      {/* bottom-14 clears the sticky BottomNav (~56px) so the two bars stack instead of overlapping */}
      <div className="fixed inset-x-0 bottom-14 z-40 mx-auto flex max-w-[480px] items-center gap-3.5 border-t border-line bg-white px-4 py-3">
        <div className="text-xs text-muted">
          {lines.reduce((s, l) => s + l.qty, 0)} items<b className="block text-[17px] text-ink">{formatINR(total)}</b>
        </div>
        <button onClick={() => router.push("/checkout")} className="flex-1 rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white active:scale-[.98]">Checkout</button>
      </div>
    </AppShell>
  );
}

function Row({ label, value, green }) {
  return (
    <div className="flex justify-between py-1.5 text-[13.5px] text-ink/80">
      <span>{label}</span>
      <span className={green ? "font-semibold text-[#2e9e54]" : ""}>{value}</span>
    </div>
  );
}
