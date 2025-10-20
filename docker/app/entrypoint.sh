#!/bin/sh
# Hardened Laravel entrypoint (POSIX sh)
set -eu
umask 0002

APP_ROOT="/var/www/html"
SNAPSHOT_ROOT="/var/www/appimage"
LOG_PREFIX="[app-entrypoint]"

log() { echo "$LOG_PREFIX $*"; }
warn() { echo "$LOG_PREFIX WARN: $*" >&2; }
fail() { echo "$LOG_PREFIX ERROR: $*" >&2; exit 1; }

log "Booting..."

run_in_app() {
  cmd="$1"
  sh -lc "cd '$APP_ROOT' && $cmd"
}

# Ensure artisan exists and is readable/executable from the mounted volume.
ensure_artisan() {
  if [ ! -f "$APP_ROOT/artisan" ] || [ ! -r "$APP_ROOT/artisan" ]; then
    warn "artisan missing or unreadable on volume. Restoring from snapshot..."
    if [ -f "$SNAPSHOT_ROOT/artisan" ]; then
      cp -a "$SNAPSHOT_ROOT/artisan" "$APP_ROOT/artisan" 2>/dev/null || {
        rm -f "$APP_ROOT/artisan" 2>/dev/null || true
        cp -a "$SNAPSHOT_ROOT/artisan" "$APP_ROOT/artisan" || true
      }
    else
      fail "Snapshot missing artisan at $SNAPSHOT_ROOT/artisan"
    fi
  fi
  chmod 755 "$APP_ROOT/artisan" 2>/dev/null || true
}

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
      if [ ! -f "$APP_ROOT/vendor/autoload.php" ] && [ -d "$SNAPSHOT_ROOT/vendor" ]; then
        log "Vendor autoload missing. Restoring vendor from snapshot..."
        cp -a "$SNAPSHOT_ROOT/vendor" "$APP_ROOT/vendor" || true
      fi
      if [ ! -f "$APP_ROOT/public/index.php" ] && [ -d "$SNAPSHOT_ROOT/public" ]; then
        log "Public index missing. Restoring public from snapshot..."
        cp -a "$SNAPSHOT_ROOT/public" "$APP_ROOT/public" || true
      fi
    fi
  fi
}

ensure_runtime_paths() {
  log "Ensuring runtime paths and permissions..."
  mkdir -p \
    "$APP_ROOT/storage" \
    "$APP_ROOT/storage/logs" \
    "$APP_ROOT/storage/framework/sessions" \
    "$APP_ROOT/storage/framework/views" \
    "$APP_ROOT/storage/framework/cache/data" \
    "$APP_ROOT/storage/app/public" \
    "$APP_ROOT/bootstrap/cache"
  # Pre-create default log file to avoid Monolog UnexpectedValueException
  if [ ! -f "$APP_ROOT/storage/logs/laravel.log" ]; then
    : > "$APP_ROOT/storage/logs/laravel.log" || true
  fi
  chmod -R 775 "$APP_ROOT/storage" "$APP_ROOT/bootstrap" || true
  # Ensure new files inherit group perms
  find "$APP_ROOT/storage" -type d -exec chmod g+s {} + 2>/dev/null || true
  find "$APP_ROOT/bootstrap" -type d -exec chmod g+s {} + 2>/dev/null || true
  # public readability
  if [ -d "$APP_ROOT/public" ]; then chmod -R a+rX "$APP_ROOT/public" || true; fi
}

ensure_vendor() {
  if [ ! -f "$APP_ROOT/vendor/autoload.php" ]; then
    log "Vendor not found. Running composer install..."
    if command -v composer >/dev/null 2>&1; then
      composer install --no-dev --prefer-dist --no-progress --no-interaction -d "$APP_ROOT" || fail "Composer install failed"
    else
      fail "Composer binary not found in image"
    fi
  fi
}

ensure_core_permissions() {
  log "Ensuring core source permissions..."
  # Ensure the entire app tree is at least world-readable and directories are traversable
  if [ -d "$APP_ROOT" ]; then
    find "$APP_ROOT" -type d -exec chmod a+rx {} + 2>/dev/null || true
    find "$APP_ROOT" -type f -exec chmod a+r {} + 2>/dev/null || true
  fi
  # Composer files must be readable since framework reads them during bootstrap
  for f in "$APP_ROOT/composer.json" "$APP_ROOT/composer.lock" "$APP_ROOT/artisan" "$APP_ROOT/.image-build-id"; do
    [ -e "$f" ] || continue
    chmod a+r "$f" 2>/dev/null || true
  done
}

require_application_key() {
  if [ -z "${APP_KEY:-}" ]; then
    fail "APP_KEY is not set. Refusing to start."
  fi
}

warmup_caches() {
  log "Clearing stale caches (optimize:clear)"
  run_in_app "php artisan optimize:clear" || warn "optimize:clear non-fatal"
  log "Caching configuration/routes/views"
  run_in_app "php artisan config:cache"
  run_in_app "php artisan route:cache"
  run_in_app "php artisan view:cache" || warn "view:cache skipped"
}

to_bool() {
  # usage: to_bool "$VALUE" "$DEFAULT"
  v="${1:-}"
  d="${2:-1}"
  [ -n "$v" ] || v="$d"
  v_lc=$(printf '%s' "$v" | tr '[:upper:]' '[:lower:]')
  if [ "$v_lc" = "0" ] || [ "$v_lc" = "false" ] || [ "$v_lc" = "off" ]; then
    echo "0"
  else
    echo "1"
  fi
}

maybe_run_migrations() {
  want="$(to_bool "${AUTO_MIGRATE:-${RUN_MIGRATIONS:-}}" 1)"
  if [ "$want" = "1" ]; then
    log "Running database migrations (force)"
    run_in_app "php artisan migrate --force --no-interaction" || warn "migrate failed (non-fatal)"
  fi
}

maybe_run_seeders() {
  want="$(to_bool "${AUTO_SEED:-${RUN_SEEDERS:-}}" 1)"
  if [ "$want" = "1" ]; then
    log "Running database seeders (force)"
    run_in_app "php artisan db:seed --force --no-interaction" || warn "db:seed failed (non-fatal)"
  fi
}

fix_runtime_ownership() {
  log "Fixing runtime permissions..."
  find "$APP_ROOT/storage" -type d -exec chmod 775 {} + 2>/dev/null || true
  find "$APP_ROOT/bootstrap" -type d -exec chmod 775 {} + 2>/dev/null || true
}

# ---- Sequence ----
ensure_application_source
ensure_artisan
ensure_runtime_paths
ensure_vendor
ensure_core_permissions
require_application_key
warmup_caches
log "Ensuring storage symlink (public/storage)"
# Prefer baked symlink; avoid modifying public/ at runtime unless writable
if [ -L "$APP_ROOT/public/storage" ]; then
  :
elif [ -e "$APP_ROOT/public/storage" ]; then
  warn "public/storage exists and is not a symlink; skipping"
else
  if [ -w "$APP_ROOT/public" ]; then
    ln -snf "$APP_ROOT/storage/app/public" "$APP_ROOT/public/storage" 2>/dev/null || true
  else
    warn "public/ not writable; skipping symlink creation"
  fi
fi
maybe_run_migrations
maybe_run_seeders
fix_runtime_ownership

# Diagnostics (non-fatal)
( php -v 2>/dev/null | sed 's/^/[php] /' ) || true
( cd "$APP_ROOT" && php artisan --version 2>/dev/null | sed 's/^/[artisan] /' ) || true

if [ "$#" -gt 0 ]; then
  log "Starting custom command: $*"
  if [ "${1:-}" = "php" ] && [ "${2:-}" = "artisan" ]; then
    shift 2
    cd "$APP_ROOT"
    exec php artisan "$@"
  fi
  cd "$APP_ROOT"
  exec "$@"
fi

log "Starting php-fpm..."
exec php-fpm
