"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AppShell from "@/components/AppShell";
import { useCart } from "@/components/Providers";
import { BRAND, formatINR } from "@/lib/menu";
import { useBrand } from "@/components/Providers";

const FULFILMENT = [
  { id: "pickup", label: "🥡 Pickup" },
  { id: "dinein", label: "🍽️ Dine-in" },
  { id: "delivery", label: "🛵 Delivery" },
];
const PAYMENTS = [
  { id: "upi", label: "💳 UPI · GPay / PhonePe" },
  { id: "card", label: "🏦 Card ending 4218" },
  { id: "wallet", label: "💰 Shoku Wallet · ₹240" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { status } = useSession();
  const { lines, subtotal, clear, table, location } = useCart();
  const { brand } = useBrand();
  const [ful, setFul] = useState("pickup");
  const [pay, setPay] = useState("upi");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(null);
  const [promoMsg, setPromoMsg] = useState("");
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [redeem, setRedeem] = useState(null); // selected reward
  const [guestPhone, setGuestPhone] = useState(""); // guest checkout (no account)
  const [guestName, setGuestName] = useState("");

  const isGuest = status === "unauthenticated";

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me").then((r) => (r.ok ? r.json() : null)).then((d) => d && setPoints(d.points || 0)).catch(() => {});
    fetch("/api/rewards").then((r) => (r.ok ? r.json() : [])).then(setRewards).catch(() => {});
  }, [status]);

  const taxes = Math.round((subtotal * (brand.gstRate ?? 5)) / 100); // same rate the server charges
  const reward = Math.round(subtotal * 0.05);
  const discount = applied ? Math.round((subtotal * applied.percent) / 100) : 0;
  const loyaltyDiscount = redeem && redeem.type === "discount" ? Math.min(redeem.amount, subtotal) : 0;
  const total = Math.max(0, subtotal + taxes - reward - discount - loyaltyDiscount); // mirror server floor

  async function applyPromo() {
    const code = promo.trim();
    if (!code) return;
    setPromoMsg("");
    const res = await fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.valid) {
      setApplied({ code: data.code, percent: data.percent });
      setPromoMsg(`${data.code} applied — ${data.percent}% off!`);
    } else {
      setApplied(null);
      setPromoMsg("That code isn't valid.");
    }
  }

  function loadRazorpay() {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Couldn't load the payment SDK."));
      document.body.appendChild(s);
    });
  }

  // Direct (mock-paid) checkout — used when no payment gateway is configured.
  async function directCheckout(payload) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) return router.replace("/login?next=/checkout");
      throw new Error(data.error || "Could not place order");
    }
    clear();
    router.push(`/success?id=${encodeURIComponent(data.id)}`);
  }

  async function payWithRazorpay(rd) {
    await loadRazorpay();
    const rzp = new window.Razorpay({
      key: rd.keyId,
      order_id: rd.razorpayOrderId,
      amount: rd.amount,
      currency: rd.currency || "INR",
      name: "Shoku",
      description: "Order payment",
      theme: { color: "#3A6B4D" },
      handler: async (resp) => {
        try {
          const v = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
              orderId: rd.orderId,
            }),
          });
          const vd = await v.json();
          if (!v.ok) throw new Error(vd.error || "Payment verification failed");
          clear();
          router.push(`/success?id=${encodeURIComponent(rd.orderId)}`);
        } catch (e) {
          setError(e.message);
          setPlacing(false);
        }
      },
      modal: { ondismiss: () => setPlacing(false) },
    });
    rzp.open();
  }

  async function placeOrder() {
    if (!lines.length || placing) return;
    setPlacing(true);
    setError("");
    if (isGuest && !/\d{10}/.test(guestPhone.replace(/\D/g, ""))) {
      setError("Enter your 10-digit mobile number to order as a guest — your points get saved to it.");
      setPlacing(false);
      return;
    }
    const payload = {
      lines, fulfilment: ful, payment: pay, discountCode: applied?.code || null, rewardId: redeem?.id || null,
      tableId: table?.id || null, locationLabel: location?.label || null,
      ...(isGuest ? { guest: { phone: guestPhone, name: guestName } } : {}),
    };
    try {
      // Guests use direct checkout (pay at counter); the gateway needs an account.
      if (isGuest) return await directCheckout(payload);
      // Try the real gateway; if it isn't configured (503), use direct checkout.
      const rz = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (rz.status === 503) return await directCheckout(payload);
      const rd = await rz.json();
      if (!rz.ok) {
        if (rz.status === 401) return router.replace("/login?next=/checkout");
        throw new Error(rd.error || "Could not start payment");
      }
      await payWithRazorpay(rd);
    } catch (e) {
      setError(e.message);
      setPlacing(false);
    }
  }

  if (status === "loading") {
    return <AppShell nav={false}><div className="grid min-h-[60vh] place-items-center text-sm text-muted">Loading…</div></AppShell>;
  }

  return (
    <AppShell nav={false}>
      <div className="pb-28">
        <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
          <button onClick={() => router.push("/cart")} className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-lg">←</button>
          <h1 className="text-[17px] font-bold">Checkout</h1>
        </div>

        {table && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-brand-tint px-3.5 py-3 text-[13px] font-semibold text-brand-dark">
            🍽️ Dine-in · <b>{table.label}</b><span className="ml-auto text-[11px] font-medium opacity-70">served to your table</span>
          </div>
        )}

        {isGuest && (
          <Card title="Ordering as a guest">
            <div className="px-3.5 py-3">
              <p className="text-[12.5px] text-muted">
                No account needed — your points save to your number.{" "}
                <Link href="/login?next=/checkout" className="font-bold text-brand-dark">Sign in instead</Link>
              </p>
              <input type="tel" inputMode="numeric" autoComplete="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Mobile number *" className="mt-2.5 w-full rounded-xl border border-line px-3.5 py-3 text-[14px] outline-none focus:border-brand" />
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)}
                placeholder="Name (optional)" className="mt-2 w-full rounded-xl border border-line px-3.5 py-3 text-[14px] outline-none focus:border-brand" />
            </div>
          </Card>
        )}
        {!table && <Card title="How would you like it?"><Seg options={FULFILMENT} value={ful} onChange={setFul} /></Card>}

        <Card title={ful === "delivery" ? "Delivery" : "Pickup time"}>
          <Seg options={[{ id: "asap", label: "ASAP · 12 min" }, { id: "sched", label: "Schedule" }]} value="asap" onChange={() => {}} />
          <div className="flex items-center gap-2 border-t border-line px-3.5 py-3 text-[13.5px] font-semibold">
            📍 {brand.address || BRAND.address}<span className="ml-auto text-xs font-bold text-brand">Change</span>
          </div>
        </Card>

        <Card title="Payment">
          {PAYMENTS.map((p, i) => (
            <button key={p.id} onClick={() => setPay(p.id)}
              className={`flex w-full items-center gap-3 px-3.5 py-3 text-left text-[13.5px] font-semibold ${i ? "border-t border-line" : ""}`}>
              {p.label}
              <span className="ml-auto grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-brand">
                {pay === p.id && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </span>
            </button>
          ))}
        </Card>

        {rewards.length > 0 && (
          <Card title={`Redeem points · you have ${points}`}>
            <div className="flex flex-col gap-2 p-3.5">
              {rewards.map((rw) => {
                const afford = points >= rw.cost;
                const sel = redeem?.id === rw.id;
                return (
                  <button key={rw.id} disabled={!afford} onClick={() => setRedeem(sel ? null : rw)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-[13px] ${sel ? "border-brand bg-brand-tint" : "border-line"} ${afford ? "" : "opacity-45"}`}>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand-dark">🎁</span>
                    <div className="flex-1">
                      <div className="font-semibold">{rw.title}</div>
                      <div className="text-[11.5px] text-muted">{rw.type === "discount" ? `${formatINR(rw.amount)} off` : `Free ${rw.itemName}`} · {rw.cost} pts</div>
                    </div>
                    {sel && <span className="text-[12px] font-bold text-brand-dark">Selected</span>}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <Card title="Promo code">
          <div className="flex gap-2 p-3.5">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              className="flex-1 rounded-xl border border-line px-3.5 py-2.5 text-[13px] uppercase outline-none focus:border-brand"
            />
            <button onClick={applyPromo} className="rounded-xl bg-brand-tint px-4 text-[13px] font-bold text-brand-dark">Apply</button>
          </div>
          {promoMsg && (
            <div className={`px-3.5 pb-3 text-[12px] font-semibold ${applied ? "text-[#2e9e54]" : "text-[#b24a18]"}`}>{promoMsg}</div>
          )}
        </Card>

        <div className="px-4 pt-2">
          <Row label="Subtotal" value={formatINR(subtotal)} />
          <Row label="Taxes & charges" value={formatINR(taxes)} />
          <Row label="✨ AI loyalty reward" value={`−${formatINR(reward)}`} green />
          {discount > 0 && <Row label={`Promo ${applied.code} (−${applied.percent}%)`} value={`−${formatINR(discount)}`} green />}
          {redeem && <Row label={`🎁 ${redeem.title} (−${redeem.cost} pts)`} value={redeem.type === "discount" ? `−${formatINR(loyaltyDiscount)}` : "Free item added"} green />}
          <div className="mt-1.5 flex justify-between border-t border-dashed border-line pt-3 text-base font-extrabold">
            <span>Total</span><span>{formatINR(total)}</span>
          </div>
          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</div>}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] items-center gap-3.5 border-t border-line bg-white px-4 py-3">
        <div className="text-xs text-muted">Pay<b className="block text-[17px] text-ink">{formatINR(total)}</b></div>
        <button onClick={placeOrder} disabled={!lines.length || placing}
          className="flex-1 rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white active:scale-[.98] disabled:opacity-40">
          {placing ? "Placing order…" : "Place order"}
        </button>
      </div>
    </AppShell>
  );
}

function Card({ title, children }) {
  return (
    <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-line">
      <div className="border-b border-line px-3.5 py-3 text-[13px] font-bold">{title}</div>
      {children}
    </div>
  );
}
function Seg({ options, value, onChange }) {
  return (
    <div className="flex gap-2 p-3.5">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border-[1.5px] px-1.5 py-3 text-center text-[12.5px] font-semibold transition-colors ${
            value === o.id ? "border-brand bg-brand-tint text-brand-dark" : "border-line text-muted"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
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
