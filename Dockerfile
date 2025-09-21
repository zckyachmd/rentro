# ------------------------------------------------------------------------------
# Laravel 12 – Optimized PHP-FPM image (Debian Bookworm Slim, PHP 8.4)
# - Extensions: pdo_pgsql, intl, bcmath, sockets, pcntl, zip, redis
# - OPcache tuned for production
# - PHP-FPM pool tuned & overridable via ENV
# - Non-root www-data user
# - Composer stage for vendor caching
# - Build args: TZ_DEFAULT (build-time), TZ (stage arg), APP_ENV (prod), INSTALL_XDEBUG (dev)
#   Usage examples:
#   - Production: docker build --target app --build-arg APP_ENV=production --build-arg TZ=Asia/Jakarta -t rentro-app:prod .
#   - Development: docker build --target app-dev --build-arg INSTALL_XDEBUG=true --build-arg TZ=Asia/Jakarta -t rentro-app:dev .
# ------------------------------------------------------------------------------

ARG TZ_DEFAULT=Asia/Jakarta
ARG PHP_TAG=8.4-fpm-bookworm

# =========================
# Stage 1: Base PHP runtime
# =========================
FROM php:${PHP_TAG} AS base
ARG TZ=${TZ_DEFAULT}

# System dependencies
RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      git curl unzip zip tzdata ca-certificates locales \
      libpq-dev libicu-dev libzip-dev \
    ; \
    rm -rf /var/lib/apt/lists/*

# PHP extensions (pdo_pgsql, intl, bcmath, sockets, opcache, pcntl, zip) + redis from PECL
RUN set -eux; \
    docker-php-ext-configure intl; \
    docker-php-ext-install -j"$(nproc)" pdo_pgsql intl bcmath sockets opcache pcntl zip; \
    pecl install redis; \
    docker-php-ext-enable redis

# Timezone & locale (Asia/Jakarta by default)
ENV TZ=${TZ} \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8
RUN set -eux; \
    echo "$TZ" > /etc/timezone; \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime; \
    sed -i 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen; \
    locale-gen

WORKDIR /var/www/html

# Hardened & tuned PHP (production defaults)
RUN set -eux; \
    { \
      echo 'expose_php=0'; \
      echo 'memory_limit=512M'; \
      echo 'max_execution_time=60'; \
      echo 'upload_max_filesize=32M'; \
      echo 'post_max_size=32M'; \
      echo 'realpath_cache_size=4096k'; \
      echo 'realpath_cache_ttl=600'; \
    } > /usr/local/etc/php/conf.d/zz-production.ini; \
    { \
      echo 'opcache.enable=1'; \
      echo 'opcache.enable_cli=1'; \
      echo 'opcache.jit=0'; \
      echo 'opcache.memory_consumption=256'; \
      echo 'opcache.interned_strings_buffer=32'; \
      echo 'opcache.max_accelerated_files=20000'; \
      echo 'opcache.validate_timestamps=0'; \
      echo 'opcache.save_comments=1'; \
      echo 'opcache.fast_shutdown=1'; \
      echo 'opcache.preload_user=www-data'; \
    } > /usr/local/etc/php/conf.d/zz-opcache.ini

# PHP-FPM tuning (overridable via ENV)
ENV FPM_PM=dynamic \
    FPM_MAX_CHILDREN=20 \
    FPM_START_SERVERS=4 \
    FPM_MIN_SPARE_SERVERS=4 \
    FPM_MAX_SPARE_SERVERS=8 \
    FPM_MAX_REQUESTS=500 \
    FPM_REQUEST_TERMINATE_TIMEOUT=60s
RUN set -eux; \
    { \
      echo '[www]'; \
      echo 'pm = ${FPM_PM}'; \
      echo 'pm.max_children = ${FPM_MAX_CHILDREN}'; \
      echo 'pm.start_servers = ${FPM_START_SERVERS}'; \
      echo 'pm.min_spare_servers = ${FPM_MIN_SPARE_SERVERS}'; \
      echo 'pm.max_spare_servers = ${FPM_MAX_SPARE_SERVERS}'; \
      echo 'pm.max_requests = ${FPM_MAX_REQUESTS}'; \
      echo 'request_terminate_timeout = ${FPM_REQUEST_TERMINATE_TIMEOUT}'; \
      echo 'catch_workers_output = yes'; \
      echo 'clear_env = no'; \
      echo 'decorate_workers_output = no'; \
      echo 'access.format = "%R - %u [%t] \\"%m %r\\" %s %f %{mili}dms %{kilo}Mkb"'; \
      echo 'pm.status_path = /fpm-status'; \
      echo 'ping.path = /fpm-ping'; \
      echo 'ping.response = pong'; \
    } > /usr/local/etc/php-fpm.d/zz-www-tuning.conf

# Use non-root user and ensure permissions
RUN set -eux; \
    usermod -u 1000 www-data; \
    groupmod -g 1000 www-data; \
    mkdir -p storage bootstrap/cache; \
    chown -R www-data:www-data /var/www/html

EXPOSE 9000

# =========================
# Stage 2: Composer vendor (production)
# =========================
FROM base AS vendor
WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN --mount=type=cache,target=/tmp/composer/cache composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader --no-scripts

# =========================
# Stage 2b: Composer vendor (development)
# =========================
FROM base AS vendor_dev
WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN --mount=type=cache,target=/tmp/composer/cache composer install --prefer-dist --no-interaction --no-progress --no-scripts

# =========================
# Stage 2c: Frontend assets builder (production)
# =========================
FROM node:20-alpine AS assets
WORKDIR /app
ENV CI=true COREPACK_ENABLE_DOWNLOAD_PROMPT=1

# Install JS deps (auto-detect pnpm/yarn/npm)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN set -eux; \
    corepack enable; \
    if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile --config.confirmModulesPurge=false; \
    elif [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci --prefer-offline --no-audit --fund=false; \
    else \
      npm install --prefer-offline --no-audit --fund=false; \
    fi

# Copy source and build
COPY . .
RUN npm run build

# =========================
# Stage 3: Final application (production)
# =========================
FROM base AS app

WORKDIR /var/www/html

# Copy app source & vendor
COPY --chown=www-data:www-data . .
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build

# Ensure writable dirs
RUN set -eux; \
    mkdir -p storage/logs bootstrap/cache; \
    chown -R www-data:www-data storage bootstrap

ARG APP_ENV=production
RUN if [ "$APP_ENV" = "production" ]; then \
      php artisan config:cache && \
      php artisan route:cache && \
      php artisan view:cache; \
    else \
      echo "Skip artisan caches for APP_ENV=$APP_ENV"; \
    fi

# Healthcheck (simple)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD php -v || exit 1

USER www-data
CMD ["php-fpm", "-F"]

# =========================
# Stage 4: Final application (development)
# =========================
FROM base AS app-dev

# Optional Xdebug toggle for local dev
ARG INSTALL_XDEBUG=false
RUN if [ "$INSTALL_XDEBUG" = "true" ]; then \
      pecl install xdebug && docker-php-ext-enable xdebug && \
      echo "zend_extension=$(php -i | awk -F, '/^Additional .ini/{print $NF}' | xargs dirname)/xdebug.so" > /usr/local/etc/php/conf.d/zz-xdebug.ini && \
      echo "xdebug.mode=develop,debug" >> /usr/local/etc/php/conf.d/zz-xdebug.ini && \
      echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/zz-xdebug.ini; \
    else \
      echo "Xdebug not installed"; \
    fi

WORKDIR /var/www/html

# Copy app source & dev vendor
COPY --chown=www-data:www-data . .
COPY --from=vendor_dev --chown=www-data:www-data /app/vendor ./vendor

# Ensure writable dirs
RUN set -eux; \
    mkdir -p storage/logs bootstrap/cache; \
    chown -R www-data:www-data storage bootstrap

# No artisan cache in dev
ENV APP_ENV=local

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD php -v || exit 1

USER www-data
CMD ["php-fpm", "-F"]

# =========================
# Stage 5: Nginx static (production web)
# - ships only public/ with built assets
# - creates /public/storage symlink targeting shared storage volume
# =========================
FROM nginx:alpine AS web
WORKDIR /var/www/html

# Nginx config
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built public dir (includes build/manifest.json)
COPY --from=assets /app/public /var/www/html/public

# Ensure public/storage symlink points to /var/www/html/storage/app/public
# The storage directory will be provided via a named volume in docker-compose.prod.yml
RUN ln -sf /var/www/html/storage/app/public /var/www/html/public/storage || true

EXPOSE 80
