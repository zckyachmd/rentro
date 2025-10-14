#!/bin/sh
set -eu
umask 0002

APP_ROOT="/var/www/html"
SNAPSHOT_ROOT="/var/www/appimage"
LOG_PREFIX="[app-entrypoint]"

log() { echo "$LOG_PREFIX $*"; }
fail() { echo "$LOG_PREFIX ERROR: $*" >&2; exit 1; }

log "Booting..."

ensure_application_source() {
  if [ ! -f "$APP_ROOT/artisan" ]; then
    log "Synchronizing application snapshot to volume..."
    cp -a "$SNAPSHOT_ROOT/." "$APP_ROOT/"
  else
    log "Application source present. Checking image build id..."
    src_id="$(cat "$SNAPSHOT_ROOT/.image-build-id" 2>/dev/null || echo unknown)"
    dst_id="$(cat "$APP_ROOT/.image-build-id" 2>/dev/null || echo none)"
    if [ "$src_id" != "$dst_id" ]; then
      log "Image changed ($dst_id -> $src_id). Updating application code..."
      for path in app bootstrap config database resources routes public vendor artisan composer.json composer.lock; do
        if [ -e "$SNAPSHOT_ROOT/$path" ]; then
          cp -a "$SNAPSHOT_ROOT/$path" "$APP_ROOT/$path" || true
        fi
      done
      cp -a "$SNAPSHOT_ROOT/.image-build-id" "$APP_ROOT/.image-build-id" || true
    else
      log "Image build id unchanged ($dst_id). Ensuring new files are in place..."
      cp -an "$SNAPSHOT_ROOT/." "$APP_ROOT/" || true
    fi
  fi
}

ensure_runtime_paths() {
  log "Ensuring runtime paths and permissions..."
  mkdir -p \
    "$APP_ROOT/storage" \
    "$APP_ROOT/storage/framework/sessions" \
    "$APP_ROOT/storage/framework/views" \
    "$APP_ROOT/storage/framework/cache/data" \
    "$APP_ROOT/bootstrap/cache"
  chmod -R 775 "$APP_ROOT/storage" "$APP_ROOT/bootstrap" || true
  chown -R www-data:www-data "$APP_ROOT/storage" "$APP_ROOT/bootstrap" || true
}

require_application_key() {
  [ -n "${APP_KEY:-}" ] || fail "APP_KEY is not set. Refusing to start."
}

build_application_caches() {
  log "Building application caches (config/route/view)..."
  run_as_www "php artisan optimize" || true
}

run_migrations() {
  log "Running database migrations (idempotent)..."
  run_as_www "php artisan migrate --force --no-interaction" || true
}

run_core_seeder() {
  log "Seeding core data (idempotent)..."
  run_as_www "php artisan seed:core --force" || true
}

fix_runtime_ownership() {
  log "Fixing runtime ownership and permissions..."
  chown -R www-data:www-data "$APP_ROOT/storage" "$APP_ROOT/bootstrap" || true
  find "$APP_ROOT/storage" -type d -exec chmod 775 {} + 2>/dev/null || true
  find "$APP_ROOT/bootstrap" -type d -exec chmod 775 {} + 2>/dev/null || true
}

run_as_www() {
  cmd="$1"
  if command -v su >/dev/null 2>&1; then
    su -s /bin/sh -c "$cmd" www-data
  else
    sh -lc "$cmd"
  fi
}

ensure_application_source
ensure_runtime_paths
require_application_key
build_application_caches
run_migrations
run_core_seeder
fix_runtime_ownership

log "Starting php-fpm..."
exec php-fpm
