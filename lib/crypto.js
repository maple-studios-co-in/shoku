import crypto from "crypto";

// Envelope encryption for secrets at rest (per-café AI API keys). AES-256-GCM
// with a key derived from KEY_ENCRYPTION_KEY. Stored keys are opaque
// "enc:v1:<iv>:<tag>:<ciphertext>" strings, so a leaked DB/backup exposes no keys.
//
// Migration-safe: without KEY_ENCRYPTION_KEY set (local dev), values pass through
// as plaintext; decryptSecret() returns legacy/plaintext values unchanged. Set
// KEY_ENCRYPTION_KEY in production BEFORE storing real café keys.

const RAW = process.env.KEY_ENCRYPTION_KEY || "";
const PREFIX = "enc:v1:";

function kek() {
  if (!RAW) return null;
  // Accept any passphrase; derive a stable 32-byte key. (Rotate by re-encrypting.)
  return crypto.createHash("sha256").update(RAW, "utf8").digest();
}

export function encryptionEnabled() {
  return !!RAW;
}

export function secretIsEncrypted(v) {
  return typeof v === "string" && v.startsWith(PREFIX);
}

// Encrypt a plaintext secret for storage. Empty/null passes through. Without a
// KEK configured, returns the plaintext (dev) — callers should warn in prod.
export function encryptSecret(plain) {
  if (plain === null || plain === undefined || plain === "") return plain;
  if (secretIsEncrypted(plain)) return plain; // already encrypted, don't double-wrap
  const k = kek();
  if (!k) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

// Decrypt a stored secret. Plaintext/legacy values (no prefix) return unchanged.
// An encrypted value with no/incorrect KEK returns null (fail closed — never leak).
export function decryptSecret(stored) {
  if (!secretIsEncrypted(stored)) return stored;
  const k = kek();
  if (!k) return null;
  try {
    const [, , ivB, tagB, ctB] = stored.split(":");
    const d = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(ivB, "base64"));
    d.setAuthTag(Buffer.from(tagB, "base64"));
    return Buffer.concat([d.update(Buffer.from(ctB, "base64")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
