// Optional LLM bridge. When OPENAI_API_KEY (or an OpenAI-compatible LLM_API_KEY)
// is set, callers get real model output; otherwise this returns null and callers
// fall back to the built-in heuristics — so every AI feature works with zero
// external dependencies, and upgrades automatically the moment a key is present.
//
// Provider-aware: configs pointing at Anthropic (Claude) go through the official
// @anthropic-ai/sdk; everything else (OpenAI, Groq, any OpenAI-compatible host)
// goes through the /chat/completions shape. Per-tenant configs are set by the
// superadmin in /super/cafes and always win over the platform env defaults.
import Anthropic from "@anthropic-ai/sdk";
import { decryptSecret } from "./crypto";

const KEY = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "";
const BASE = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

export function llmEnabled() {
  return !!KEY;
}

// Per-plan default models (env-overridable); a tenant's own key/model/baseUrl
// (superadmin-set) always wins. This is how POS/AI features scale by plan.
const PLAN_MODELS = {
  starter: process.env.LLM_MODEL_STARTER || MODEL,
  growth: process.env.LLM_MODEL_GROWTH || MODEL,
  enterprise: process.env.LLM_MODEL_ENTERPRISE || MODEL,
};

export function getTenantLLMConfig(tenant) {
  return {
    // Stored café keys are encrypted at rest; decrypt on use (plaintext/legacy
    // values pass through). Falls back to the platform env key.
    key: decryptSecret(tenant?.aiApiKey) || KEY,
    base: tenant?.aiBaseUrl || BASE,
    model: tenant?.aiModel || PLAN_MODELS[tenant?.plan] || MODEL,
    imageModel: process.env.LLM_IMAGE_MODEL || "gpt-image-1",
  };
}

// A config talks to Anthropic natively when it points at the Anthropic API or
// carries an Anthropic-format key; everything else is OpenAI-compatible.
export function providerFor(cfg) {
  if ((cfg.base || "").includes("anthropic.com") || (cfg.key || "").startsWith("sk-ant-")) return "anthropic";
  return "openai-compatible";
}

async function anthropicComplete(cfg, system, user, { json, max }) {
  const client = new Anthropic({ apiKey: cfg.key, timeout: 60_000, maxRetries: 1 });
  const params = {
    model: cfg.model,
    max_tokens: Math.max(max, 256),
    system: json ? `${system}\n\nRespond with a single valid JSON object and nothing else.` : system,
    messages: [{ role: "user", content: user }],
  };
  // Fable's safety classifiers can decline benign requests; the server-side
  // fallback re-serves those on Opus inside the same call.
  const msg = cfg.model.startsWith("claude-fable")
    ? await client.beta.messages.create({
        ...params,
        betas: ["server-side-fallback-2026-06-01"],
        fallbacks: [{ model: "claude-opus-4-8" }],
      })
    : await client.messages.create(params);
  if (msg.stop_reason === "refusal") return { ok: false, error: "model declined the request (refusal)" };
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) return { ok: false, error: "empty response" };
  return { ok: true, text };
}

async function openaiCompatComplete(cfg, system, user, { json, max, temperature }) {
  const res = await fetch(`${cfg.base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens: max,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, error: "empty response" };
  return { ok: true, text };
}

async function rawComplete(cfg, system, user, opts) {
  try {
    return providerFor(cfg) === "anthropic"
      ? await anthropicComplete(cfg, system, user, opts)
      : await openaiCompatComplete(cfg, system, user, opts);
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

// Models sometimes wrap JSON in markdown fences — strip before parsing.
function parseJsonText(text) {
  return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
}

// Returns a string (or parsed object when json:true), or null on any failure.
export async function llmComplete(system, user, { json = false, max = 600, temperature = 0.7, tenant = null } = {}) {
  const cfg = getTenantLLMConfig(tenant);
  if (!cfg.key) return null;
  const out = await rawComplete(cfg, system, user, { json, max, temperature });
  if (!out.ok) {
    console.error("[llm] request failed:", cfg.model, "—", out.error);
    return null;
  }
  if (!json) return out.text;
  try {
    return parseJsonText(out.text);
  } catch {
    console.error("[llm] model returned invalid JSON");
    return null;
  }
}

// Superadmin "Test connection": runs a tiny completion against an explicit
// config and reports the failure reason instead of swallowing it.
export async function testLLM({ key, base, model } = {}) {
  const cfg = { key: key || KEY, base: base || BASE, model: model || MODEL };
  const provider = providerFor(cfg);
  if (!cfg.key) return { ok: false, provider, model: cfg.model, error: "No API key — none supplied and no platform key configured" };
  const out = await rawComplete(cfg, "You are a connection test.", "Reply with exactly: OK", {
    json: false,
    max: 20,
    temperature: 0,
  });
  return out.ok
    ? { ok: true, provider, model: cfg.model, reply: out.text.slice(0, 40) }
    : { ok: false, provider, model: cfg.model, error: out.error };
}
