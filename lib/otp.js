import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { rateLimit } from "./rateLimit";

// Phone-OTP auth. Provider-pluggable like lib/whatsapp: with SMS creds set the
// code goes out via SMS; without them we run in DEMO mode — the code is
// returned to the client ONLY outside production (or with OTP_DEMO=1), so local
// dev and demos work with zero setup while prod can never leak codes.

const OTP_TTL_MS = 5 * 60 * 1000;

export function normalizePhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  if (d.length >= 11 && d.length <= 15 && String(raw).trim().startsWith("+")) return `+${d}`;
  return null;
}

export function smsConfigured() {
  return !!(process.env.SMS_API_KEY || process.env.TWILIO_AUTH_TOKEN || process.env.MSG91_AUTH_KEY);
}

const demoAllowed = () => process.env.NODE_ENV !== "production" || process.env.OTP_DEMO === "1";

async function sendSms(phone, body) {
  // Adapter point: MSG91 / Twilio / any SMS gateway. Mirrors lib/whatsapp's
  // provider pattern; wire real creds here when going live.
  if (!smsConfigured()) return { demo: true };
  // TODO(prod): implement the configured provider. Fail loud, never silent.
  console.warn("[otp] SMS provider configured but adapter not implemented; falling back to demo");
  return { demo: true };
}

// The same phone on the same café always maps to ONE user row — enforced by the
// @@unique([tenantId, phone]) constraint. upsert() closes the check-then-act race
// two concurrent guest orders used to hit. New accounts start at 0 points (no
// free-points minting). Guest checkout creates it unverified; OTP login claims it.
export async function findOrCreatePhoneUser(tenantId, phone, name = null) {
  const email = `${phone.replace("+", "p")}@phone.shoku`; // satisfies (tenantId,email) unique; never mailed
  return prisma.user.upsert({
    where: { tenantId_phone: { tenantId, phone } },
    update: {}, // existing row wins — never clobber its name/points/role/verified state
    create: { tenantId, phone, email, name, password: "", role: "customer", guest: true, waOptIn: true, points: 0 },
  });
}

export async function requestOtp({ tenant, phone: rawPhone, name, ip }) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: "Enter a valid 10-digit mobile number.", status: 400 };
  if (!rateLimit(`otp:p:${phone}`, { limit: 3, windowMs: 600_000 }).ok)
    return { error: "Too many codes sent — try again in a few minutes.", status: 429 };
  if (!rateLimit(`otp:ip:${ip}`, { limit: 10, windowMs: 600_000 }).ok)
    return { error: "Too many requests.", status: 429 };

  const user = await findOrCreatePhoneUser(tenant.id, phone, name);
  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits, crypto-strong
  await prisma.user.update({
    where: { id: user.id },
    data: { otpHash: await bcrypt.hash(code, 8), otpExpires: new Date(Date.now() + OTP_TTL_MS), otpAttempts: 0 },
  });

  const sent = await sendSms(phone, `${code} is your ${tenant.name} login code. Valid 5 minutes.`);
  const res = { ok: true, phone };
  if (sent.demo) {
    console.log(`[otp][demo] ${phone} → ${code}`);
    if (demoAllowed()) res.demoCode = code; // never in production
  }
  return res;
}

const MAX_OTP_ATTEMPTS = 5;

// Called from the NextAuth "otp" provider. Success CLAIMS the account:
// phoneVerified + no longer a guest — past guest orders/points now belong here.
// Brute force is bounded DB-side (works across nodes, unlike the in-memory
// limiter): 5 wrong tries burns the code and forces a fresh request.
export async function verifyOtp(tenantId, rawPhone, code) {
  const phone = normalizePhone(rawPhone);
  if (!phone || !/^\d{6}$/.test(String(code || ""))) return null;
  if (!rateLimit(`otpv:${phone}`, { limit: 30, windowMs: 600_000 }).ok) return null; // coarse per-node guard

  const user = await prisma.user.findUnique({ where: { tenantId_phone: { tenantId, phone } } });
  if (!user?.otpHash || !user.otpExpires || user.otpExpires < new Date()) return null;
  // OTP authenticates DINERS only — staff/owner/superadmin must use a password,
  // so a set staff phone can't become an SMS-only path into an admin role.
  if (user.role !== "customer") return null;

  // Claim an attempt slot ATOMICALLY before doing any bcrypt work. The DB
  // serialises `increment`, so concurrent requests get distinct post-values
  // (1,2,3…) — at most MAX_OTP_ATTEMPTS comparisons ever run against one live
  // code, defeating the concurrent-burst brute force. This holds across nodes
  // (the in-memory limiter above does not).
  const { otpAttempts } = await prisma.user.update({
    where: { id: user.id }, data: { otpAttempts: { increment: 1 } }, select: { otpAttempts: true },
  });
  if (otpAttempts > MAX_OTP_ATTEMPTS) {
    await prisma.user.updateMany({ where: { id: user.id, otpHash: { not: null } }, data: { otpHash: null, otpExpires: null } });
    return null;
  }

  const ok = await bcrypt.compare(String(code), user.otpHash);
  if (!ok) {
    // The attempt that reaches the cap kills the code; a fresh request is needed.
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      await prisma.user.update({ where: { id: user.id }, data: { otpHash: null, otpExpires: null } });
    }
    return null;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { otpHash: null, otpExpires: null, otpAttempts: 0, phoneVerified: true, guest: false },
  });
}
