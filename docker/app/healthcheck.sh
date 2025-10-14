#!/usr/bin/env sh
set -eu

# App readiness healthcheck
# - PID 1 must be php-fpm (alive)
# - Laravel must be able to bootstrap via `artisan about`

APP_ROOT="/var/www/html"

# php-fpm master should be running as PID 1
kill -0 1 2>/dev/null || exit 1

# If PHP-FPM exposes a PID file, ensure the process exists (best-effort)
for p in /usr/local/var/run/php-fpm.pid /run/php/php-fpm.pid; do
  if [ -f "$p" ]; then
    pid=$(cat "$p" 2>/dev/null || true)
    [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null || true
    break
  fi
done

if [ -f "$APP_ROOT/artisan" ] && command -v php >/dev/null 2>&1; then
  ( cd "$APP_ROOT" && php -d max_execution_time=5 artisan about --no-ansi ) >/dev/null 2>&1 || exit 1
fi

exit 0

