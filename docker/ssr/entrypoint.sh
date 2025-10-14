#!/usr/bin/env sh
set -eu

# SSR container runs with deps in /srv. The app code (including SSR bundle) is mounted at ${APP_ROOT} (default /app).
APP_ROOT="${APP_ROOT:-/app}"
PORT="${PORT:-13714}"

# Find SSR entry with a short wait to accommodate slow copies
find_ssr_entry() {
  for f in "$APP_ROOT/bootstrap/ssr/ssr.mjs" "$APP_ROOT/bootstrap/ssr/ssr.js" "$APP_ROOT/bootstrap/ssr/ssr.cjs"; do
    if [ -f "$f" ]; then
      echo "$f"
      return 0
    fi
  done
  return 1
}

entry=""
max_wait=${SSR_WAIT_SECONDS:-20}
elapsed=0
while [ "$elapsed" -le "$max_wait" ]; do
  entry="$(find_ssr_entry || true)"
  if [ -n "$entry" ]; then
    break
  fi
  if [ "$elapsed" -eq 0 ]; then
    echo "[ssr] Waiting for SSR bundle at ${APP_ROOT}/bootstrap/ssr/ssr.(mjs|js|cjs) ..."
  fi
  sleep 1
  elapsed=$((elapsed+1))
done

if [ -z "$entry" ]; then
  echo "[ssr] ERROR: SSR entry not found at ${APP_ROOT}/bootstrap/ssr/ssr.(mjs|js|cjs) after ${max_wait}s" >&2
  ls -la "$APP_ROOT/bootstrap/ssr" 2>/dev/null || true
  exit 1
fi

echo "[ssr] Starting ${entry} (PORT=${PORT})"
exec node --input-type=module -e "(async()=>{try{const p=new URL('file://${entry}').href;const mod=await import(p);const fn=mod && mod.default; if(typeof fn==='function'){const {default:createServer}=await import('@inertiajs/react/server'); createServer(fn);} }catch(e){console.error(e);process.exit(1)}})()"

