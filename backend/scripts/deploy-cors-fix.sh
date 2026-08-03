#!/usr/bin/env bash
# Deploy backend CORS fix to live VPS. Usage:
#   KEY=/path/to/private_key ./backend/scripts/deploy-cors-fix.sh
set -euo pipefail
HOST="${DEPLOY_HOST:-root@168.144.185.66}"
REMOTE="${DEPLOY_PATH:-/opt/shree-backend}"
KEY="${KEY:?Set KEY to your SSH private key path}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "→ Backup app.js on server"
ssh -i "$KEY" "$HOST" "cp $REMOTE/src/app.js $REMOTE/src/app.js.bak-\$(date +%Y%m%d-%H%M%S)"

echo "→ Upload app.js + server.js"
tr -d '\r' < "$ROOT/backend/src/app.js" | ssh -i "$KEY" "$HOST" "cat > $REMOTE/src/app.js"
tr -d '\r' < "$ROOT/backend/server.js" | ssh -i "$KEY" "$HOST" "cat > $REMOTE/server.js"

echo "→ Syntax check + restart"
ssh -i "$KEY" "$HOST" "node -c $REMOTE/src/app.js && node -c $REMOTE/server.js && pm2 restart shree-backend --update-env"

echo "→ Health"
curl -s "http://168.144.185.66:4000/api/health"
echo
echo "→ CORS probe (should NOT be 403)"
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS "http://168.144.185.66:4000/api/panchang" \
  -H "Origin: https://tiny-fudge-8b01c1.netlify.app" \
  -H "Access-Control-Request-Method: POST"
