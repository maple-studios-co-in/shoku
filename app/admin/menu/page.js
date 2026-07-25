"use client";

import { useEffect, useState } from "react";
import { SectionCard, formatINR } from "@/components/AdminUI";

const BLANK = {
  name: "", categoryId: "ice-blended", price: 0, img: "", desc: "",
  kcal: 0, caffeine: 0, protein: 0, sugar: 0, veg: true, signature: false,
  origin: "", ingredients: "", allergens: "", tags: "", aiTip: "", sizes: null,
  type: "food", stockQty: "", diet: "",
};

function toForm(it) {
  return {
    ...it,
    ingredients: (it.ingredients || []).join(", "),
    allergens: (it.allergens || []).join(", "),
    tags: (it.tags || []).join(", "),
    diet: (it.diet || []).join(", "),
    type: it.type || "food",
    stockQty: it.stockQty ?? "",
  };
}
function fromForm(f) {
  const split = (s) => String(s).split(",").map((x) => x.trim()).filter(Boolean);
  return {
    ...f,
    price: Number(f.price) || 0,
    kcal: Number(f.kcal) || 0,
    caffeine: Number(f.caffeine) || 0,
    protein: Number(f.protein) || 0,
    sugar: Number(f.sugar) || 0,
    ingredients: split(f.ingredients),
    allergens: split(f.allergens),
    tags: split(f.tags),
    diet: split(f.diet),
    type: f.type === "merch" ? "merch" : "food",
    stockQty: f.type === "merch" && f.stockQty !== "" ? Number(f.stockQty) : null,
  };
}

export default function AdminMenuPage() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null); // form object or null
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function load() {
    fetch("/api/menu?all=1").then((r) => r.json()).then((d) => { setItems(d.items || []); setCats(d.categories || []); });
  }
  useEffect(() => { load(); }, []);

  const catLabel = (id) => cats.find((c) => c.id === id)?.label || id;

  async function toggleLive(it) {
    setItems((arr) => arr.map((x) => (x.id === it.id ? { ...x, live: !x.live } : x)));
    await fetch(`/api/items/${it.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ live: !it.live }) });
  }

  async function remove(it) {
    if (!confirm(`Delete "${it.name}"? This can't be undone.`)) return;
    const res = await fetch(`/api/items/${it.id}`, { method: "DELETE" });
    if (res.ok) setItems((arr) => arr.filter((x) => x.id !== it.id));
    else {
      const d = await res.json();
      alert(d.error || "Could not delete.");
    }
  }

  async function save() {
    setErr("");
    if (!editing.name) { setErr("Name is required."); return; }
    setSaving(true);
    const payload = fromForm(editing);
    const isEdit = !!editing.id;
    const res = await fetch(isEdit ? `/api/items/${editing.id}` : "/api/items", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error || "Save failed."); return; }
    setEditing(null);
    load();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
          <p className="text-sm text-muted">{items.length} items · add, edit and publish.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImporting(true)} className="rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink">⬆ Import CSV</button>
          <button onClick={() => setEditing({ ...BLANK, categoryId: cats[0]?.id || "ice-blended" })} className="rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold text-white">+ Add item</button>
        </div>
      </header>

      {importing && <ImportModal onClose={() => setImporting(false)} onDone={load} />}

      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Live</th>
                <th className="px-5 py-3">Edit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={it.img} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-semibold">{it.name}{it.signature && <span className="ml-1.5 rounded bg-brand-tint px-1.5 py-0.5 text-[9px] font-bold text-brand-dark">★</span>}</div>
                        <div className="text-[11px] text-muted">{it.kcal} kcal · {it.caffeine}mg</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{catLabel(it.category)}</td>
                  <td className="px-5 py-3 font-bold">{formatINR(it.price)}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleLive(it)} className={`relative h-6 w-10 rounded-full ${it.live ? "bg-brand" : "bg-gray-300"}`}>
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${it.live ? "right-1" : "left-1"}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(toForm(it))} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-bold">Edit</button>
                      <button onClick={() => remove(it)} className="rounded-lg px-2 py-1.5 text-[12px] font-bold text-red-500">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onClick={() => setEditing(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing.id ? "Edit item" : "New item"}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <F label="Name" full><input className={inp} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></F>
              <F label="Category">
                <select className={inp} value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </F>
              <F label="Price (₹)"><input type="number" className={inp} value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></F>
              <F label="Image URL" full><input className={inp} value={editing.img} onChange={(e) => setEditing({ ...editing, img: e.target.value })} placeholder="https://…" /></F>
              <F label="Description" full><textarea className={inp} rows={2} value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} /></F>
              <F label="Calories"><input type="number" className={inp} value={editing.kcal} onChange={(e) => setEditing({ ...editing, kcal: e.target.value })} /></F>
              <F label="Caffeine (mg)"><input type="number" className={inp} value={editing.caffeine} onChange={(e) => setEditing({ ...editing, caffeine: e.target.value })} /></F>
              <F label="Protein (g)"><input type="number" className={inp} value={editing.protein} onChange={(e) => setEditing({ ...editing, protein: e.target.value })} /></F>
              <F label="Sugar (g)"><input type="number" className={inp} value={editing.sugar} onChange={(e) => setEditing({ ...editing, sugar: e.target.value })} /></F>
              <F label="Origin" full><input className={inp} value={editing.origin} onChange={(e) => setEditing({ ...editing, origin: e.target.value })} /></F>
              <F label="Ingredients (comma-separated)" full><input className={inp} value={editing.ingredients} onChange={(e) => setEditing({ ...editing, ingredients: e.target.value })} /></F>
              <F label="Allergens (comma-separated)" full><input className={inp} value={editing.allergens} onChange={(e) => setEditing({ ...editing, allergens: e.target.value })} /></F>
              <F label="Tags (comma-separated)" full><input className={inp} value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} placeholder="cold, sweet, vegan…" /></F>
              <F label="AI tip" full><input className={inp} value={editing.aiTip} onChange={(e) => setEditing({ ...editing, aiTip: e.target.value })} /></F>
              <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={editing.veg} onChange={(e) => setEditing({ ...editing, veg: e.target.checked })} /> Vegetarian</label>
              <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={editing.signature} onChange={(e) => setEditing({ ...editing, signature: e.target.checked })} /> Signature item</label>
              <F label="Type">
                <select className={inp} value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option value="food">Food / drink</option><option value="merch">Merch (Shop tab)</option>
                </select>
              </F>
              {editing.type === "merch" && (
                <F label="Stock qty (blank = untracked)">
                  <input className={inp} type="number" min="0" value={editing.stockQty} onChange={(e) => setEditing({ ...editing, stockQty: e.target.value })} />
                </F>
              )}
              {editing.type !== "merch" && (
                <F label="Diet tags (auto-detected; add vrat / halal-safe manually)" full>
                  <input className={inp} value={editing.diet} onChange={(e) => setEditing({ ...editing, diet: e.target.value })} placeholder="jain, vegan, halal-safe" />
                </F>
              )}
            </div>
            {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{err}</div>}
            <div className="mt-5 flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand py-3 text-[14px] font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save item"}</button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-line px-5 py-3 text-[14px] font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none focus:border-brand";
function F({ label, children, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-[12px] font-semibold text-ink/70">{label}</label>
      {children}
    </div>
  );
}

// Minimal RFC-4180-ish CSV parser (handles quotes, commas, newlines in quotes).
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", q = false;
  const s = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const TEMPLATE = "name,category,price,desc,veg,kcal,caffeine,tags,signature\nCafé Latte,Hot Coffee,295,Silky espresso with steamed milk,y,120,150,bestseller|classic,y\nMasala Chai,Tea,180,Spiced Indian tea,y,90,40,,\nButter Croissant,Food,180,Flaky all-butter pastry,y,280,0,,";

function ImportModal({ onClose, onDone }) {
  const [rows, setRows] = useState(null); // parsed objects
  const [genImages, setGenImages] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  function ingest(text) {
    setErr(""); setResult(null);
    const grid = parseCSV(text);
    if (grid.length < 2) { setErr("Need a header row + at least one item."); return; }
    const head = grid[0].map((h) => h.trim().toLowerCase());
    const need = ["name", "price"];
    if (!need.every((n) => head.includes(n))) { setErr(`CSV must include columns: ${need.join(", ")} (plus optional category, desc, veg, kcal, caffeine, tags, signature).`); return; }
    const objs = grid.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
    setRows(objs);
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => ingest(String(rd.result));
    rd.readAsText(f);
  }

  async function submit() {
    if (!rows?.length) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/items/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: rows, generateImages: genImages }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Import failed");
      setResult(d);
      onDone?.();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center gap-3">
          <h2 className="text-lg font-bold">Import menu from CSV</h2>
          <button onClick={onClose} className="ml-auto text-muted">✕</button>
        </div>
        <p className="mb-4 text-[13px] text-muted">Upload a spreadsheet (or paste rows). We match each item to a food photo automatically — no need to add images yourself.</p>

        {!result && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-white">
                Choose CSV file<input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
              </label>
              <button onClick={() => { const b = new Blob([TEMPLATE], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "shoku-menu-template.csv"; a.click(); }}
                className="rounded-xl border border-line px-4 py-2 text-[13px] font-bold">Download template</button>
            </div>
            <textarea placeholder="…or paste CSV rows here, then Tab out" rows={5}
              className="w-full rounded-xl border border-line p-3 font-mono text-[12px] outline-none focus:border-brand"
              onBlur={(e) => e.target.value.trim() && ingest(e.target.value)} />

            {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600">{err}</div>}

            {rows && (
              <div className="mt-4">
                <div className="mb-2 text-[13px] font-bold">{rows.length} items ready</div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-line">
                  <table className="w-full text-[12.5px]">
                    <thead className="sticky top-0 bg-canvas text-left text-[11px] uppercase text-muted">
                      <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Price</th></tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="border-t border-line"><td className="px-3 py-1.5">{r.name}</td><td className="px-3 py-1.5">{r.category || "Menu"}</td><td className="px-3 py-1.5">₹{r.price}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <label className="mt-3 flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={genImages} onChange={(e) => setGenImages(e.target.checked)} />
                  Generate AI images (uses your café's AI plan; falls back to stock photos if unavailable — slower)
                </label>
                <button onClick={submit} disabled={busy} className="mt-3 w-full rounded-xl bg-brand-dark py-3 text-[14px] font-bold text-white disabled:opacity-50">
                  {busy ? "Importing…" : `Import ${rows.length} items`}
                </button>
              </div>
            )}
          </>
        )}

        {result && (
          <div className="text-[14px]">
            <div className="mb-2 rounded-xl bg-brand-tint px-4 py-3 font-semibold text-brand-dark">
              ✓ {result.created} added, {result.updated} updated
              {result.aiImages > 0 && ` · ${result.aiImages} AI images`}
            </div>
            {!result.aiAvailable && genImages && <p className="mb-2 text-[12.5px] text-muted">AI images weren't available on this plan — used curated photos instead.</p>}
            {result.errors?.length > 0 && (
              <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
                {result.errors.slice(0, 6).map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <button onClick={onClose} className="mt-1 w-full rounded-xl bg-brand py-3 text-[14px] font-bold text-white">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
