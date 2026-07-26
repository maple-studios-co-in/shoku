#!/usr/bin/env bash
#
# Fires the loyalty-nudge engine (reward-close + win-back WhatsApp messages).
# The endpoint is auth-gated by CRON_SECRET; this wrapper is meant for the crontab.
#
# One-time setup on the VPS:
#   1. Set CRON_SECRET in .env (any long random string), redeploy.
#   2. Install the crontab entry (runs daily at 11:00; adjust as you like):
#        crontab -e
#        0 11 * * *  CRON_SECRET=<same-secret> /var/www/pista/scripts/nudges-cron.sh >> /var/log/shoku-nudges.log 2>&1
#
set -euo pipefail
SITE="${SITE_URL:-https://getshoku.com}"
: "${CRON_SECRET:?set CRON_SECRET to match the app .env}"

echo "[$(date -u +%FT%TZ)] running nudges…"
curl -fsS -m 60 -X POST "$SITE/api/cron/nudges" \
  -H "x-cron-key: $CRON_SECRET" \
  && echo "  ✓ done" \
  || { echo "  ✗ nudge run failed"; exit 1; }
