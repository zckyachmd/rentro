#!/usr/bin/env sh
set -eu

cd /var/www/html

if [ -n "${SSR_ENTRY:-}" ]; then
  if [ -f "$SSR_ENTRY" ]; then
    echo "[ssr] Using SSR_ENTRY=${SSR_ENTRY}"
    exec node "$SSR_ENTRY"
  else
    echo "[ssr] SSR_ENTRY not found: ${SSR_ENTRY}. Falling back to auto-detect..." >&2
  fi
fi

if [ -f "bootstrap/ssr/ssr.mjs" ]; then
  echo "[ssr] Starting bootstrap/ssr/ssr.mjs"
  exec node bootstrap/ssr/ssr.mjs
elif [ -f "bootstrap/ssr/ssr.js" ]; then
  echo "[ssr] Starting bootstrap/ssr/ssr.js"
  exec node bootstrap/ssr/ssr.js
elif [ -f "build-ssr/ssr.mjs" ]; then
  echo "[ssr] Starting build-ssr/ssr.mjs"
  exec node build-ssr/ssr.mjs
elif [ -f "build-ssr/ssr.js" ]; then
  echo "[ssr] Starting build-ssr/ssr.js"
  exec node build-ssr/ssr.js
else
  echo "[ssr] ERROR: SSR entry not found. Checked bootstrap/ssr/ssr.{mjs,js} and build-ssr/ssr.{mjs,js}" >&2
  ls -la build-ssr 2>/dev/null || true
  ls -la bootstrap/ssr 2>/dev/null || true
  exit 1
fi
