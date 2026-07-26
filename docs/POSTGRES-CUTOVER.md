# Postgres cutover runbook (P0)

Shoku's Prisma schema is now `provider = "postgresql"`. The app is **verified working
end-to-end on Postgres** (schema push, seed, reads, writes, OTP, POS, admin analytics,
cross-tenant super stats). This is the one-time production cutover from the old SQLite file.

> **Context:** at cutover time there are **no paying customers**, so the demo/test data in
> `dev.db` is not precious. You can either **copy it** (below) or just **seed fresh** — pick one.

---

## 0. Provision a managed Postgres

Use a managed provider so you get backups + PITR for free (a P0 requirement):
**Neon** (generous free tier, serverless — recommended to start), **Supabase**, or **RDS**.
Create a database `shoku` and grab the connection string:

```
postgresql://USER:PASSWORD@HOST:5432/shoku?sslmode=require
```

## 1. Point the app at Postgres

On the VPS, set it in `.env` (replace the old `DATABASE_URL="file:./dev.db"`):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/shoku?sslmode=require"
```

## 2. Create the schema

```bash
npx prisma generate
npx prisma db push        # creates all 16 tables on Postgres
```

## 3a. Option A — fresh start (simplest, recommended pre-launch)

```bash
node prisma/seed.js               # superadmin + 2 demo cafés + menu/orders
node scripts/classify-diet.js     # dietary tags
# then recreate your real accounts (aditya@ / abhimanyu@) + café settings + live keys
```

## 3b. Option B — copy the existing SQLite data

If the VPS `dev.db` holds real config you want to keep (accounts, café settings, orders):

```bash
# keep a copy of the old SQLite file accessible, then:
SQLITE_PATH=./prisma/dev.db \
  DATABASE_URL="postgresql://…/shoku?sslmode=require" \
  node scripts/migrate-sqlite-to-postgres.js
```

The script copies all 16 tables **in FK order**, coercing SQLite's `0/1` booleans and
date strings to real Postgres types (verified: a full copy of 1,591 rows round-tripped
with exact counts and correct booleans/dates/JSON). It's idempotent (`skipDuplicates`),
so a re-run only fills gaps.

## 4. Verify before flipping traffic

```bash
npm run build && pm2 restart pista --update-env
curl -s https://getshoku.com/api/health          # 200
```
Then smoke-test: load a storefront, sign in (email + phone-OTP), place an order, open
`/admin/analytics` and `/super`. Spot-check row counts against the old DB if you copied.

## 5. After cutover

- **Back up** is now the provider's job (enable PITR / daily snapshots). Retire the old
  `scripts/backup-r2.sh` SQLite dump, or repoint it at `pg_dump`.
- **Connection pooling:** on serverless Postgres (Neon) use the **pooled** connection string
  for the app; keep a direct URL only for migrations. On a single PM2 node the default pool
  is fine.
- **Delete** the old `dev.db` from the server once you've confirmed everything works.

## Rollback

The schema change is a single line (`provider`). To revert: set `provider = "sqlite"`, restore
`DATABASE_URL="file:./dev.db"`, `prisma generate`, rebuild. The old `dev.db` is untouched by
this process, so rollback is instant as long as you haven't deleted it.

## Local dev after this change

Developers now need a local Postgres (not a bare file):

```bash
# quickest: Docker
docker run -d --name shoku-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
# .env → DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shoku"
npm run setup    # db push + seed
```
(Or a Homebrew `postgresql@17` cluster — see the team wiki.)
