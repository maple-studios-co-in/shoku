"use client";

import { useEffect, useState } from "react";

// Share-to-earn approval queue: diners submit post links; approving awards points.
export default function SharesPage() {
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(null); // post id being decided
  const [err, setErr] = useState("");

  function load() {
    fetch("/api/admin/social-posts").then((r) => (r.ok ? r.json() : [])).then(setPosts).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function decide(id, action) {
    setBusy(id); setErr("");
    const res = await fetch("/api/admin/social-posts", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || "Failed"); }
    load();
  }

  const pending = posts.filter((p) => p.status === "pending");
  const decided = posts.filter((p) => p.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h1 className="text-2xl font-bold tracking-tight">Share posts</h1>
      <p className="mt-1 text-sm text-muted">
        Diners who posted their order on social media. Approve to award their points — check the link actually shows your café.
      </p>
      {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{err}</div>}

      <h3 className="mb-2 mt-6 text-sm font-bold">Waiting for review {pending.length > 0 && `(${pending.length})`}</h3>
      {pending.length === 0 && <p className="text-[13px] text-muted">Nothing pending — nudge your regulars to share! 📸</p>}
      <div className="grid gap-3">
        {pending.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <b>{p.user?.name || p.user?.email}</b>
              {p.user?.phone && <span className="text-muted">· {p.user.phone}</span>}
              <span className="ml-auto text-[11px] text-muted">{new Date(p.createdAt).toLocaleString("en-IN")}</span>
            </div>
            <a href={p.url} target="_blank" rel="noreferrer" className="mt-1.5 block truncate text-[13px] font-semibold text-brand-dark underline">{p.url}</a>
            {p.note && <p className="mt-1 text-[12.5px] text-muted">{p.note}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => decide(p.id, "approve")} disabled={busy === p.id}
                className="rounded-lg bg-brand px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50">✓ Approve &amp; award</button>
              <button onClick={() => decide(p.id, "reject")} disabled={busy === p.id}
                className="rounded-lg border border-line px-4 py-2 text-[12.5px] font-bold text-red-500 disabled:opacity-50">Reject</button>
            </div>
          </div>
        ))}
      </div>

      {decided.length > 0 && (
        <>
          <h3 className="mb-2 mt-8 text-sm font-bold">Decided</h3>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {decided.map((p) => (
              <div key={p.id} className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[12.5px] last:border-0">
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${p.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
                  {p.status}
                </span>
                <span className="truncate">{p.user?.name || p.user?.email}</span>
                <a href={p.url} target="_blank" rel="noreferrer" className="max-w-[180px] truncate text-muted underline">{p.url}</a>
                <span className="ml-auto whitespace-nowrap font-bold text-brand-dark">{p.status === "approved" ? `+${p.points} pts` : "—"}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
