"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const inp = "mt-1.5 w-full rounded-xl border border-line px-3.5 py-3 text-[15px] font-normal outline-none focus:border-brand";
const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1";

// Phone-OTP-first login (diners), with email+password for staff/legacy accounts.
function PhoneTab({ next }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("phone"); // phone | code
  const [demoCode, setDemoCode] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not send the code.");
      setDemoCode(d.demoCode || null);
      setStage("code");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function verify(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("otp", { redirect: false, phone, code });
    setLoading(false);
    if (res?.error) setError("That code didn't match — check it or resend.");
    else router.push(next);
  }

  if (stage === "phone") {
    return (
      <form onSubmit={sendCode} className="flex flex-col gap-3.5">
        <label className="text-sm font-semibold">
          Mobile number
          <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210" required className={inp} />
        </label>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</div>}
        <button disabled={loading} className="mt-1 rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white active:scale-[.98] disabled:opacity-50">
          {loading ? "Sending…" : "Send login code"}
        </button>
        <p className="text-center text-[12px] text-muted">Your points and orders follow this number — online and at the counter.</p>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-3.5">
      <div className="text-[13px] text-muted">
        Code sent to <b className="text-ink">{phone}</b>{" "}
        <button type="button" onClick={() => { setStage("phone"); setCode(""); }} className="font-bold text-brand-dark">change</button>
      </div>
      {demoCode && (
        <div className="rounded-lg bg-brand-tint px-3 py-2 text-[12.5px] font-semibold text-brand-dark">
          Demo mode (no SMS gateway): your code is <b className="tracking-widest">{demoCode}</b>
        </div>
      )}
      <label className="text-sm font-semibold">
        6-digit code
        <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required
          className={`${inp} text-center text-xl tracking-[0.4em]`} />
      </label>
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</div>}
      <button disabled={loading || code.length !== 6}
        className="mt-1 rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white active:scale-[.98] disabled:opacity-50">
        {loading ? "Verifying…" : "Verify & sign in"}
      </button>
      <button type="button" onClick={sendCode} disabled={loading} className="text-center text-[13px] font-bold text-brand-dark disabled:opacity-50">
        Resend code
      </button>
    </form>
  );
}

function EmailTab({ next }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error) setError("Invalid email or password.");
    else router.push(next);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <label className="text-sm font-semibold">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp} />
      </label>
      <label className="text-sm font-semibold">
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inp} />
      </label>
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</div>}
      <button disabled={loading} className="mt-1 rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white active:scale-[.98] disabled:opacity-50">
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        New here? <Link href="/register" className="font-bold text-brand-dark">Create an account</Link>
      </p>
    </form>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/menu";
  const [tab, setTab] = useState("phone");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5 text-xl font-semibold">
        <img src="/shoku-mark.svg" alt="" className="h-9 w-9" /> <span className="font-serif">shoku</span>
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to order and track your rewards.</p>

      <div className="mt-6 flex gap-1 rounded-xl bg-canvas p-1">
        {[["phone", "📱 Phone"], ["email", "✉️ Email"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition-colors ${tab === id ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">{tab === "phone" ? <PhoneTab next={next} /> : <EmailTab next={next} />}</div>

      {GOOGLE && (
        <>
          <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <button onClick={() => signIn("google", { callbackUrl: next })}
            className="rounded-xl border border-line py-3 text-[14px] font-bold active:scale-[.98]">
            Continue with Google
          </button>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
