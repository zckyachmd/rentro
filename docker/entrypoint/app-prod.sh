#!/usr/bin/env sh
set -eu

cd /var/www/html

# Ensure writable dirs (in case image is used without init scripts)
mkdir -p \
  storage/logs \
  storage/framework/cache \
  storage/framework/sessions \
  storage/framework/views \
  bootstrap/cache || true
# Fix ownership (requires root). Image sets www-data uid/gid to 1000.
if command -v chown >/dev/null 2>&1; then
  chown -R www-data:www-data storage bootstrap 2>/dev/null || true
fi

if [ "${APP_ENV:-production}" = "production" ]; then
  echo "[entrypoint] production mode: optimizing caches"
  rm -f bootstrap/cache/*.php 2>/dev/null || true
  if ! php -v >/dev/null 2>&1; then
    echo "[entrypoint] warn: php cli not available in PATH"
  fi
  php artisan config:cache || echo "[entrypoint] warn: config:cache failed"
  php artisan route:cache || echo "[entrypoint] warn: route:cache failed"
  php artisan view:cache || echo "[entrypoint] warn: view:cache failed"
  if [ ! -L public/storage ]; then
    php artisan storage:link || echo "[entrypoint] warn: storage:link failed"
  fi
fi

# Run PHP-FPM (master as root; workers run as www-data per pool config)
exec /usr/local/sbin/php-fpm -F
