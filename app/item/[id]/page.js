"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart, useBrand } from "@/components/Providers";
import { MILK_OPTIONS, formatINR } from "@/lib/menu";
import { lighterSwap } from "@/lib/foodIntel";
import { DietBadges } from "@/components/ProductCard";

function InfoRow({ icon, title, children, highlight }) {
  return (
    <div className={`flex gap-3 border-t border-line px-3.5 py-3 text-[13px] ${highlight ? "bg-brand-tint" : ""}`}>
      <span className="w-5 text-center text-base">{icon}</span>
      <div className="flex-1">
        <b className={`mb-0.5 block text-xs font-semibold ${highlight ? "text-brand-dark" : "text-muted"}`}>{title}</b>
        {children}
      </div>
    </div>
  );
}

function Pills({ items }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((p) => (
        <span key={p} className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink/80">
          {p}
        </span>
      ))}
    </div>
  );
}

export default function ItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const { add } = useCart();

  const { brand } = useBrand();
  const [item, setItem] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sizeName, setSizeName] = useState(null);
  const [milk, setMilk] = useState(MILK_OPTIONS[0]);

  useEffect(() => {
    fetch("/api/menu").then((r) => (r.ok ? r.json() : null)).then((d) => d?.items && setMenuItems(d.items)).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/menu/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setItem(d);
        if (d?.sizes?.length) setSizeName(d.sizes[Math.min(1, d.sizes.length - 1)].name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const total = useMemo(() => {
    if (!item) return 0;
    const size = item.sizes.find((s) => s.name === sizeName) || item.sizes[0];
    const milkPrice = item.category === "food" ? 0 : milk.price;
    return (size?.price ?? item.price) + milkPrice;
  }, [item, sizeName, milk]);

  if (loading) {
    return <div className="app-shell grid min-h-screen place-items-center text-sm text-muted">Loading…</div>;
  }

  if (!item) {
    return (
      <div className="app-shell grid min-h-screen place-items-center p-8 text-center">
        <div>
          <p className="text-muted">Item not found.</p>
          <Link href="/menu" className="mt-3 inline-block font-semibold text-brand">← Back to menu</Link>
        </div>
      </div>
    );
  }

  const isDrink = item.category !== "food";

  function handleAdd() {
    add(item, { size: sizeName, milk: isDrink ? milk.name : null, milkPrice: isDrink ? milk.price : 0 });
    router.push("/cart");
  }

  return (
    <div className="app-shell min-h-screen pb-28">
      <div className="relative h-72">
        <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
        <button onClick={() => router.back()} className="absolute left-3.5 top-3.5 grid h-10 w-10 place-items-center rounded-full bg-white text-lg shadow-card">←</button>
        <button className="absolute right-3.5 top-3.5 grid h-10 w-10 place-items-center rounded-full bg-white text-base shadow-card">♡</button>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-white px-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{item.name}</h1>
            <div className="mt-1 text-xs text-muted">
              ★ {item.rating} ({item.reviews?.toLocaleString("en-IN")}) · {item.signature ? "Signature · " : ""}{item.kcal} kcal
            </div>
          </div>
          <div className="whitespace-nowrap text-xl font-extrabold">{formatINR(item.price)}</div>
        </div>
        <p className="mt-3 text-[13.5px] text-ink/80">{item.desc}</p>
        <div className="mt-2"><DietBadges diet={item.diet} max={6} /></div>

        {(() => {
          const swap = lighterSwap(item, menuItems);
          return swap ? (
            <Link href={`/item/${swap.id}`} className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-canvas px-3.5 py-2.5">
              <span className="text-base">🍃</span>
              <span className="text-[12.5px]">
                <b className="text-brand-dark">Lighter swap:</b> {swap.name} has {Math.round((1 - (swap.sugar ?? 0) / Math.max(item.sugar, 1)) * 100)}% less sugar
              </span>
              <span className="ml-auto text-xs font-bold text-brand-dark">View →</span>
            </Link>
          ) : null;
        })()}

        <div className="mt-4 overflow-hidden rounded-2xl border border-line">
          <div className="flex items-center gap-2 bg-brand-tint px-3.5 py-3 text-[13px] font-bold text-brand-dark">
            ✨ Know your cup
            <span className="ml-auto rounded-md bg-brand px-1.5 py-1 text-[10px] font-extrabold tracking-wide text-white">SHOKU AI</span>
          </div>
          <InfoRow icon="🌍" title={isDrink ? "Bean / origin" : "Origin"}>{item.origin}</InfoRow>
          <InfoRow icon="🧾" title="Ingredients"><Pills items={item.ingredients} /></InfoRow>
          <InfoRow icon="⚠️" title="Allergens">
            <span className="text-[#b24a18]">{item.allergens.length ? item.allergens.join(" · ") : "No major allergens"}</span>
          </InfoRow>
          <InfoRow icon="🥗" title="Nutrition (regular)">
            <Pills items={[`${item.kcal} kcal`, `Protein ${item.protein}g`, `Sugar ${item.sugar}g`, `Caffeine ${item.caffeine}mg`]} />
          </InfoRow>
          {item.aiTip && (
            <InfoRow icon="💡" title="AI tip" highlight>{item.aiTip}</InfoRow>
          )}
          {brand.fssaiLicense && (
            <InfoRow icon="🛡️" title="Food safety">
              FSSAI Lic. {brand.fssaiLicense} · prepared fresh at {brand.storeName || brand.name}
            </InfoRow>
          )}
        </div>

        <h3 className="mb-2 mt-5 text-sm font-bold">Choose size</h3>
        <div className="flex gap-2.5">
          {item.sizes.map((s) => (
            <button key={s.name} onClick={() => setSizeName(s.name)}
              className={`flex-1 rounded-xl border-[1.5px] p-3 text-center text-[13px] font-semibold transition-colors ${
                sizeName === s.name ? "border-brand bg-brand-tint text-brand-dark" : "border-line"
              }`}>
              {s.name}
              <small className="mt-0.5 block text-[11px] font-semibold text-muted">{formatINR(s.price)}</small>
            </button>
          ))}
        </div>

        {isDrink && (
          <>
            <h3 className="mb-2 mt-5 text-sm font-bold">Choose milk</h3>
            <div className="flex flex-wrap gap-2.5">
              {MILK_OPTIONS.map((m) => (
                <button key={m.name} onClick={() => setMilk(m)}
                  className={`rounded-xl border-[1.5px] px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                    milk.name === m.name ? "border-brand bg-brand-tint text-brand-dark" : "border-line"
                  }`}>
                  {m.name}
                  {m.price > 0 && <small className="ml-1 text-[11px] text-muted">+{formatINR(m.price)}</small>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] items-center gap-3.5 border-t border-line bg-white px-4 py-3">
        <div className="text-xs text-muted">Total<b className="block text-[17px] text-ink">{formatINR(total)}</b></div>
        <button onClick={handleAdd} className="flex-1 rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white active:scale-[.98]">Add to bag</button>
      </div>
    </div>
  );
}
