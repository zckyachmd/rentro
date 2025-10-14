#!/usr/bin/env sh
set -eu

# Ensure runtime dirs exist and are owned by nginx user
mkdir -p /var/cache/nginx/client_temp \
         /var/cache/nginx/proxy_temp \
         /var/cache/nginx/fastcgi_temp \
         /var/cache/nginx/uwsgi_temp \
         /var/cache/nginx/scgi_temp \
         /var/run \
         /var/tmp \
         /var/log/nginx
chown -R nginx:nginx /var/cache/nginx /var/run /var/tmp /var/log/nginx 2>/dev/null || true

# Test configuration (if fails, container will crash early)
if nginx -t -e /dev/stderr >/dev/null 2>&1; then
  echo "[nginx] configuration OK"
else
  echo "[nginx] configuration test failed" >&2
  nginx -t -e /dev/stderr || true
  exit 1
fi

exec nginx -e /dev/stderr -g "daemon off;"
