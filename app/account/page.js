"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { useBrand } from "@/components/Providers";
import { formatINR } from "@/lib/menu";

export default function AccountPage() {
  const { brand } = useBrand();
  const { data: session, status } = useSession();
  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]);
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me").then((r) => (r.ok ? r.json() : null)).then(setMe).catch(() => {});
    fetch("/api/orders").then((r) => (r.ok ? r.json() : [])).then(setOrders).catch(() => {});
    fetch("/api/rewards").then((r) => (r.ok ? r.json() : [])).then(setRewards).catch(() => {});
  }, [status]);

  if (status === "unauthenticated") {
    return (
      <AppShell>
        <Header showSearch={false} />
        <div className="grid min-h-[60vh] place-items-center px-8 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-brand-tint text-4xl">👤</div>
            <h2 className="text-lg font-bold">Sign in to {brand.name}</h2>
            <p className="mt-1 text-sm text-muted">Track orders, earn points and unlock rewards.</p>
            <Link href="/login?next=/account" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white">Sign in</Link>
            <Link href="/register?next=/account" className="mt-3 block text-sm font-semibold text-brand">Create an account</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const name = me?.name || session?.user?.name || "there";

  return (
    <AppShell>
      <Header showSearch={false} />
      <div className="px-4 pb-8">
        <div className="mt-3 flex items-center gap-3.5 rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-tint text-2xl">🙂</div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold">{name}</div>
            <div className="truncate text-xs text-muted">{me?.email || session?.user?.email}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Points" value={me ? me.points.toLocaleString("en-IN") : "—"} />
          <Stat label="Orders" value={me ? me.orders : "—"} />
          <Stat label="Tier" value={me?.tier?.name || "—"} />
        </div>
        {me?.tier?.next && (
          <p className="mt-2 text-center text-[12px] text-muted">
            {me.tier.next.toGo} more points to <b className="text-brand-dark">{me.tier.next.name}</b>
          </p>
        )}

        {me != null && me.caffeineMg > 0 && (
          <div className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold">☕ Today's caffeine</h3>
              <span className="text-[12px] font-bold text-brand-dark">{me.caffeineMg} mg</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((me.caffeineMg / me.caffeineLimit) * 100))}%`,
                  background: me.caffeineMg > me.caffeineLimit ? "#C2643C" : "#3A6B4D",
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              {me.caffeineMg > me.caffeineLimit
                ? "Above the 400mg daily guideline — maybe a decaf next? 🍃"
                : `${me.caffeineLimit - me.caffeineMg} mg left of the 400mg daily guideline`}
            </p>
          </div>
        )}

        {rewards.length > 0 && (
          <>
            <h3 className="mb-2 mt-6 text-sm font-bold">Rewards you can unlock</h3>
            <div className="overflow-hidden rounded-2xl border border-line">
              {rewards.map((r) => {
                const afford = (me?.points || 0) >= r.cost;
                return (
                  <div key={r.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-tint text-brand-dark">🎁</span>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-semibold">{r.title}</div>
                      <div className="text-[11.5px] text-muted">{r.type === "discount" ? `₹${r.amount} off` : `Free ${r.itemName}`} · {r.cost} pts</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${afford ? "bg-brand-tint text-brand-dark" : "bg-gray-100 text-gray-500"}`}>
                      {afford ? "Redeem at checkout" : `${r.cost - (me?.points || 0)} pts to go`}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h3 className="mb-2 mt-6 text-sm font-bold">Recent orders</h3>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">
            No orders yet. <Link href="/menu" className="font-semibold text-brand">Browse the menu →</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            {orders.map((o) => (
              <div key={o.id} className="border-b border-line px-4 py-3 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="text-[13.5px] font-semibold">Order #PS-{o.id.slice(-6).toUpperCase()}</div>
                  <div className="text-sm font-bold">{formatINR(o.total)}</div>
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted">
                  {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                  {o.items?.reduce((s, it) => s + it.qty, 0)} items · {o.fulfilment} ·{" "}
                  <span className="font-semibold capitalize text-brand-dark">{o.status}</span>
                </div>
                <div className="mt-1 truncate text-[12px] text-ink/70">
                  {o.items?.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}

        {["owner", "staff", "admin"].includes(session?.user?.role) && (
          <Link href="/admin" className="mt-4 flex items-center gap-3 rounded-2xl border border-brand bg-brand-tint px-4 py-3.5 text-[13.5px] font-bold text-brand-dark">
            🛠️ Admin dashboard<span className="ml-auto text-xs font-semibold opacity-70">orders, menu, branding →</span>
          </Link>
        )}
        {session?.user?.role === "superadmin" && (
          <Link href="/super" className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-dark bg-brand-dark px-4 py-3.5 text-[13.5px] font-bold text-white">
            🌐 Shoku platform console<span className="ml-auto text-xs font-semibold opacity-70">manage cafés →</span>
          </Link>
        )}

        <button onClick={() => signOut({ callbackUrl: "/" })} className="mt-3 w-full rounded-2xl border border-line px-4 py-3 text-[13.5px] font-semibold text-muted">
          Sign out
        </button>

        <p className="mt-6 text-center text-[11px] text-muted">Powered by Shoku · the AI white-label ordering platform</p>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3 text-center">
      <div className="text-xl font-extrabold text-brand-dark">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
