import { describe, it, expect, beforeAll } from "vitest";

// Exercise WITH a KEK set. crypto.js reads the env at import time, so set it first
// and import dynamically.
describe("secret encryption at rest", () => {
  let encryptSecret, decryptSecret, secretIsEncrypted, encryptionEnabled;
  beforeAll(async () => {
    process.env.KEY_ENCRYPTION_KEY = "test-kek-please-rotate-in-prod";
    ({ encryptSecret, decryptSecret, secretIsEncrypted, encryptionEnabled } = await import("./crypto.js?withkek"));
  });

  it("round-trips a secret", () => {
    const plain = "sk-ant-abc123DEF456";
    const enc = encryptSecret(plain);
    expect(enc).not.toBe(plain);
    expect(secretIsEncrypted(enc)).toBe(true);
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("passes empty/null through untouched", () => {
    expect(encryptSecret("")).toBe("");
    expect(encryptSecret(null)).toBe(null);
    expect(decryptSecret(null)).toBe(null);
  });

  it("never double-wraps an already-encrypted value", () => {
    const once = encryptSecret("x");
    expect(encryptSecret(once)).toBe(once);
  });

  it("treats a plaintext/legacy stored value as-is (migration-safe)", () => {
    expect(decryptSecret("sk-legacy-plaintext")).toBe("sk-legacy-plaintext");
  });

  it("fails closed (null) on a tampered ciphertext", () => {
    const enc = encryptSecret("secret");
    const tampered = enc.slice(0, -4) + "AAAA";
    expect(decryptSecret(tampered)).toBe(null);
  });
});
