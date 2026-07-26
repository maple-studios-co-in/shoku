/* eslint-disable */
// One-time: encrypt any plaintext per-café AI keys already in the DB.
// Run AFTER setting KEY_ENCRYPTION_KEY (same value the app will use):
//   KEY_ENCRYPTION_KEY=<secret> DATABASE_URL=<pg> node scripts/encrypt-ai-keys.js
// Idempotent — already-encrypted keys (enc:v1:…) are skipped.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  if (!process.env.KEY_ENCRYPTION_KEY) { console.error("Set KEY_ENCRYPTION_KEY first."); process.exit(1); }
  const { encryptSecret, secretIsEncrypted } = await import("../lib/crypto.js");
  const rows = await prisma.tenant.findMany({ where: { aiApiKey: { not: null } }, select: { id: true, slug: true, aiApiKey: true } });
  let n = 0;
  for (const t of rows) {
    if (secretIsEncrypted(t.aiApiKey)) continue;
    await prisma.tenant.update({ where: { id: t.id }, data: { aiApiKey: encryptSecret(t.aiApiKey) } });
    n++; console.log(`  encrypted key for ${t.slug}`);
  }
  console.log(`✓ encrypted ${n} plaintext key(s); ${rows.length - n} already encrypted`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
