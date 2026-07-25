"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { ListItem, RailCard } from "@/components/ProductCard";
import { useCart } from "@/components/Providers";
import { DIET_FILTERS, DIET_META } from "@/lib/foodIntel";

export default function MenuPage() {
  const [cat, setCat] = useState("all");
  const [diet, setDiet] = useState(null); // dietary lens: null = everything
  const [q, setQ] = useState("");
  const [data, setData] = useState({ categories: [], items: [] });
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { table, setTable } = useCart();

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/banners")
      .then((r) => (r.ok ? r.json() : []))
      .then((b) => Array.isArray(b) && setBanners(b))
      .catch(() => {});
  }, []);

  // Table QR: ?table=<id> → associate this session with the table
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("table");
    if (!id) return;
    fetch(`/api/tables/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((t) => t && setTable({ id: t.id, label: t.label }))
      .catch(() => {});
  }, [setTable]);

  const { categories } = data;
  const items = (data.items || []).filter((i) => i.type !== "merch"); // merch lives in the Shop tab
  const chips = [{ id: "all", label: "All" }, ...categories];
  const dietMatch = (i) => !diet || (Array.isArray(i.diet) && i.diet.includes(diet));
  const picks = items.filter((i) => (i.signature || i.rating >= 4.7) && dietMatch(i)).slice(0, 6);
  const shownCats = cat === "all" ? categories : categories.filter((c) => c.id === cat);

  // Search: match against name, description, category, tags and ingredients.
  // Word-boundary matching so "tea" finds "Iced Black Tea" but not "sTEAmed milk".
  const norm = q.trim().toLowerCase();
  const searching = norm.length > 0;
  const qRegex = searching ? new RegExp("\\b" + norm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
  const matches = (i) =>
    !searching ||
    [i.name, i.desc, i.categoryLabel, ...(Array.isArray(i.tags) ? i.tags : []), ...(Array.isArray(i.ingredients) ? i.ingredients : [])]
      .filter(Boolean)
      .some((v) => qRegex.test(String(v)));
  const visibleCats = shownCats
    .map((c) => ({ ...c, list: items.filter((i) => i.category === c.id && matches(i) && dietMatch(i)) }))
    .filter((c) => c.list.length > 0);

  if (!loading && data.suspended) {
    return (
      <AppShell>
        <Header />
        <div className="grid min-h-[60vh] place-items-center px-8 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-canvas text-4xl">🚧</div>
            <h2 className="text-lg font-bold">Store unavailable</h2>
            <p className="mt-1 text-sm text-muted">{data.name || "This café"} isn't taking orders right now. Please check back soon.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header searchValue={q} onSearch={setQ} />

      {table && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-brand-tint px-3.5 py-2.5 text-[13px] font-semibold text-brand-dark">
          🍽️ Ordering for <b>{table.label}</b>
          <button onClick={() => setTable(null)} className="ml-auto text-[12px] font-bold opacity-70">Leave table</button>
        </div>
      )}

      {!searching && banners.length > 0 && (
        <div className="no-scrollbar mt-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {banners.map((b) => {
            const inner = (
              <div className="relative h-36 w-full overflow-hidden rounded-2xl">
                <img src={b.imageUrl} alt={b.title || "Offer"} className="h-full w-full object-cover" />
                {(b.title || b.subtitle) && (
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-3.5 text-white">
                    {b.title && <div className="text-[15px] font-bold leading-tight">{b.title}</div>}
                    {b.subtitle && <div className="text-[12px] opacity-90">{b.subtitle}</div>}
                  </div>
                )}
              </div>
            );
            return (
              <div key={b.id} className="w-[88%] shrink-0 snap-center first:ml-0">
                {b.link ? <Link href={b.link}>{inner}</Link> : inner}
              </div>
            );
          })}
        </div>
      )}

      {!searching && (
      <Link href="/ai" className="mx-4 mt-3.5 block">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-4 text-white">
          <div className="pointer-events-none absolute -right-2 -top-5 font-serif text-8xl opacity-15">食</div>
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">食 · Shoku AI</div>
          <h3 className="mt-1 font-serif text-[19px] font-semibold">Not sure what to order?</h3>
          <p className="mt-0.5 max-w-[230px] text-[12.5px] opacity-90">
            Tell me your mood, time of day or craving — I'll build your perfect cup.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-bold text-brand-dark">
            Ask Shoku AI →
          </span>
        </div>
      </Link>
      )}

      <div className="no-scrollbar mt-3.5 flex gap-2 overflow-x-auto px-4 pb-1.5">
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
              cat === c.id ? "border-brand bg-brand-tint text-brand-dark" : "border-transparent bg-canvas text-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto px-4 pb-1.5">
        {DIET_FILTERS.map((d) => (
          <button
            key={d}
            onClick={() => setDiet(diet === d ? null : d)}
            aria-pressed={diet === d}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
              diet === d ? "border-brand bg-brand text-white" : "border-line bg-white text-muted"
            }`}
          >
            {DIET_META[d].emoji} {DIET_META[d].label}
          </button>
        ))}
      </div>

      {diet && !loading && visibleCats.length === 0 && !searching && (
        <div className="px-8 py-12 text-center">
          <p className="text-sm font-bold">No {DIET_META[diet].label} items on this menu yet</p>
          <button onClick={() => setDiet(null)} className="mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">Show everything</button>
        </div>
      )}

      {loading && <div className="px-4 py-10 text-center text-sm text-muted">Loading menu…</div>}

      {!loading && !searching && cat === "all" && picks.length > 0 && (
        <>
          <div className="mb-2.5 mt-4 flex items-baseline justify-between px-4">
            <h3 className="serif text-lg font-semibold">Picked for you</h3>
            <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">AI</span>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
            {picks.map((item) => (
              <RailCard key={item.id} item={item} badge={item.signature ? "★ Signature" : null} />
            ))}
          </div>
        </>
      )}

      {!loading &&
        visibleCats.map((c) => (
          <div key={c.id}>
            <div className="mb-1 mt-5 px-4">
              <h3 className="serif text-lg font-semibold">{c.label}</h3>
            </div>
            <div className="px-4 pb-2">
              {c.list.map((item) => (
                <ListItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}

      {!loading && searching && visibleCats.length === 0 && (
        <div className="px-8 py-14 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-canvas text-3xl">🔍</div>
          <p className="text-sm font-bold">No matches for “{q.trim()}”</p>
          <p className="mt-1 text-xs text-muted">Try a drink name, ingredient or craving — e.g. “mocha”, “vegan”, “tea”.</p>
          <button onClick={() => setQ("")} className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
            Clear search
          </button>
        </div>
      )}

      <div className="h-28" />
    </AppShell>
  );
}
