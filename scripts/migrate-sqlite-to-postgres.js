/* eslint-disable */
// One-time data copy from the legacy SQLite DB into the (now Postgres) database.
// The schema must already be on Postgres (`prisma db push`). Run AFTER pointing
// DATABASE_URL at Postgres:
//
//   SQLITE_PATH=./prisma/dev.db DATABASE_URL="postgresql://…" \
//     node scripts/migrate-sqlite-to-postgres.js
//
// Uses the `sqlite3` CLI (-json) to read the old file and the Prisma client to
// write, coercing SQLite's 0/1 booleans and ISO/epoch dates to real types.
// Idempotent per row (skipDuplicates) so it's safe to re-run.
const { execFileSync } = require("child_process");
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

const SQLITE = process.env.SQLITE_PATH || "./prisma/dev.db";

// Parent-before-child so foreign keys resolve.
const ORDER = ["Tenant", "Category", "User", "Item", "Discount", "Reward", "Table",
  "Feedback", "Banner", "Campaign", "Message", "AuditLog", "PitchDeck", "SocialPost",
  "Order", "OrderItem"];

// field name -> kind, per model, from the Prisma schema (source of truth for types).
function fieldTypes(modelName) {
  const m = Prisma.dmmf.datamodel.models.find((x) => x.name === modelName);
  const t = {};
  for (const f of m.fields) if (f.kind === "scalar") t[f.name] = f.type;
  return t;
}

function readTable(name) {
  const out = execFileSync("sqlite3", ["-json", SQLITE, `SELECT * FROM "${name}";`], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return out.trim() ? JSON.parse(out) : [];
}

function coerce(row, types) {
  const o = {};
  for (const [k, v] of Object.entries(row)) {
    const kind = types[k];
    if (v === null || kind === undefined) { o[k] = v; continue; }
    if (kind === "Boolean") o[k] = v === 1 || v === "1" || v === true;
    else if (kind === "DateTime") o[k] = typeof v === "number" ? new Date(v) : new Date(String(v));
    else if (kind === "Int") o[k] = Number(v);
    else if (kind === "Float") o[k] = Number(v);
    else o[k] = v; // String / Json-as-String stay as-is
  }
  return o;
}

(async () => {
  console.log(`Copying ${SQLITE} → Postgres…`);
  let total = 0;
  for (const model of ORDER) {
    const types = fieldTypes(model);
    let rows;
    try { rows = readTable(model); } catch (e) { console.error(`  ! read ${model} failed:`, e.message); continue; }
    if (!rows.length) { console.log(`  ${model}: 0`); continue; }
    const data = rows.map((r) => coerce(r, types));
    const delegate = prisma[model[0].toLowerCase() + model.slice(1)];
    const res = await delegate.createMany({ data, skipDuplicates: true });
    total += res.count;
    console.log(`  ${model}: ${res.count}/${rows.length}${res.count < rows.length ? " (rest already present)" : ""}`);
  }
  console.log(`✓ copied ${total} rows. Spot-check counts, then flip traffic.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
