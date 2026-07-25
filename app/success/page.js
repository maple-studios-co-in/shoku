"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { BRAND } from "@/lib/menu";
import { useBrand } from "@/components/Providers";

function FeedbackCard({ orderId }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    if (!rating) return;
    await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment, orderId }),
    }).catch(() => {});
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-line bg-white p-4 text-[13px]">
        <div className="text-[15px] font-bold text-brand-dark">Thanks for the feedback! 💚</div>
        <div className="mt-1 text-muted">It helps us serve you better.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-line bg-white p-4">
      <div className="text-[14px] font-bold">How was your experience?</div>
      <div className="mt-2 flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}
            className="text-2xl leading-none" style={{ color: (hover || rating) >= n ? "#e8a33d" : "#d9e4cc" }} aria-label={`${n} star`}>★</button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Tell us more (optional)"
            className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand" />
          <button onClick={submit} className="mt-2 w-full rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white">Submit feedback</button>
        </>
      )}
    </div>
  );
}

// Share-to-earn: paste a post link → café approves → points. One per day.
function ShareCard({ orderId }) {
  const { brand } = useBrand();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [state, setState] = useState("idle"); // idle | busy | done | error
  const [msg, setMsg] = useState("");

  if (brand.shareEnabled === false) return null;

  async function submit() {
    setState("busy"); setMsg("");
    try {
      const res = await fetch("/api/social-posts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, orderId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not submit");
      setState("done");
    } catch (e) { setState("error"); setMsg(e.message); }
  }

  if (state === "done") {
    return (
      <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-line bg-white p-4 text-[13px]">
        <div className="text-[15px] font-bold text-brand-dark">Sent for review! 📸</div>
        <div className="mt-1 text-muted">Once the café approves, {brand.sharePoints ?? 50} points land in your account.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-brand bg-brand-tint p-4 text-left">
      <div className="text-[14px] font-bold text-brand-dark">📸 Snap it, share it, earn {brand.sharePoints ?? 50} pts</div>
      <p className="mt-1 text-[12px] text-ink/70">Post your order on Instagram or Snapchat, then paste the link — the café will approve it.</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white">I posted it →</button>
      ) : (
        <>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/p/…"
            inputMode="url" className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand" />
          {msg && <div className="mt-1.5 text-[12px] font-semibold text-[#a3452d]">{msg}</div>}
          <button onClick={submit} disabled={state === "busy" || !url.trim()}
            className="mt-2 w-full rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white disabled:opacity-50">
            {state === "busy" ? "Submitting…" : "Submit for review"}
          </button>
        </>
      )}
    </div>
  );
}

function SuccessInner() {
  const params = useSearchParams();
  const { brand } = useBrand();
  const id = params.get("id");
  const shortId = id ? id.slice(-6).toUpperCase() : "—";
  return (
    <div className="px-7 py-16 text-center">
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-brand-tint text-4xl text-brand-dark">✓</div>
      <h1 className="text-2xl font-bold tracking-tight">Order placed!</h1>
      <p className="mt-2 text-[13.5px] text-muted">Thanks! Your {brand.name || BRAND.name} order is being prepared.</p>
      <div className="mx-auto mt-6 max-w-xs rounded-2xl bg-canvas p-4 text-[13px]">
        <div className="text-[15px] font-bold">☕ Ready in ~12 min</div>
        <div className="mt-1 text-muted">Pickup · {brand.address || BRAND.address}</div>
        <div className="mt-1 text-muted">Order #PS-{shortId}</div>
      </div>
      <ShareCard orderId={id} />
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href="/menu" className="inline-block rounded-xl bg-brand px-7 py-3.5 text-[15px] font-bold text-white">Back to menu</Link>
        <Link href="/account" className="text-sm font-semibold text-brand">View your orders →</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <AppShell nav={false}>
      <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-sm text-muted">Loading…</div>}>
        <SuccessInner />
      </Suspense>
    </AppShell>
  );
}
