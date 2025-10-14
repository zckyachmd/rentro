#!/usr/bin/env sh
set -eu

APP_ROOT="${APP_ROOT:-/app}"
PORT="${PORT:-13714}"

# Process must be alive
kill -0 1 2>/dev/null || exit 1

# SSR bundle must exist
if [ ! -f "$APP_ROOT/bootstrap/ssr/ssr.mjs" ] \
   && [ ! -f "$APP_ROOT/bootstrap/ssr/ssr.js" ] \
   && [ ! -f "$APP_ROOT/bootstrap/ssr/ssr.cjs" ]; then
  exit 1
fi

# HTTP probe to SSR server
if command -v node >/dev/null 2>&1 && [ -f "/usr/local/bin/ssr-healthcheck.js" ]; then
  node /usr/local/bin/ssr-healthcheck.js --port "$PORT" --timeout 1000 >/dev/null 2>&1 || exit 1
fi

exit 0

