#!/usr/bin/env sh
set -eu

# Prefer HTTP GET /healthz (served directly by nginx)
if command -v wget >/dev/null 2>&1; then
  code=$(wget -qSO- http://127.0.0.1/healthz 2>&1 >/dev/null | awk '/^  HTTP\//{print $2}' | tail -n1 || true)
elif command -v curl >/dev/null 2>&1; then
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/healthz || true)
else
  code=""
fi

if [ "$code" != "200" ]; then
  # Fallback to root path; must be 200
  if command -v curl >/dev/null 2>&1; then
    code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ || true)
  elif command -v wget >/dev/null 2>&1; then
    code=$(wget -qSO- http://127.0.0.1/ 2>&1 >/dev/null | awk '/^  HTTP\//{print $2}' | tail -n1 || true)
  else
    # Last-resort: config test + master PID liveness
    nginx -t >/dev/null 2>&1 || exit 1
    kill -0 1 2>/dev/null || exit 1
    exit 0
  fi
fi

[ "$code" = "200" ] || exit 1
exit 0
