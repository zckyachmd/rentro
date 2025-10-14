# syntax=docker/dockerfile:1.7

############################
# Composer deps (cached)
############################
FROM php:8.3-cli-bookworm AS composer_deps
WORKDIR /app
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends git unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# install pcntl so platform check passes without ignores
RUN docker-php-ext-install pcntl
# install Composer (official installer)
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm composer-setup.php
ENV COMPOSER_ALLOW_SUPERUSER=1
COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/root/.composer/cache \
    composer install --no-dev --prefer-dist --no-progress --no-interaction --no-scripts

############################
# Node deps via pnpm (cached)
############################
FROM node:20-bookworm-slim AS node_base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM node_base AS fe_deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --no-frozen-lockfile --prefer-offline

############################
# FE build (client + SSR bundle)
############################
FROM fe_deps AS fe_build
COPY package.json pnpm-lock.yaml vite.config.* ./
COPY resources ./resources
COPY public ./public
COPY bootstrap ./bootstrap
COPY tsconfig.json ./
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm run build && pnpm run build:ssr \
    && (test -f bootstrap/ssr/ssr.mjs || test -f bootstrap/ssr/ssr.js)

############################
# PHP base (Debian slim)
############################
FROM php:8.3-fpm-bookworm AS php_base
WORKDIR /var/www/html
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
 apt-get update \
 && apt-get install -y --no-install-recommends \
    git unzip libicu-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libzip-dev libpq-dev ca-certificates \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" pdo_pgsql intl gd zip opcache pcntl \
 && pecl install redis \
 && docker-php-ext-enable redis \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

############################
# APP (PHP-FPM runtime)
############################
FROM php_base AS app
WORKDIR /var/www/html
COPY --from=composer_deps --chown=www-data:www-data /app /var/www/html
COPY --from=composer_deps /usr/local/bin/composer /usr/local/bin/composer
COPY --chown=www-data:www-data . .
COPY --from=fe_build /app/public/build ./public/build
COPY --from=fe_build /app/bootstrap/ssr ./bootstrap/ssr

# Copy runtime scripts
COPY docker/app/entrypoint.sh /usr/local/bin/app-entrypoint.sh
COPY docker/app/healthcheck.sh /usr/local/bin/app-healthcheck.sh
RUN chmod 755 /usr/local/bin/app-entrypoint.sh \
    && chmod 755 /usr/local/bin/app-healthcheck.sh

# Bake the public/storage symlink to avoid needing write access at runtime
RUN ln -snf /var/www/html/storage/app/public /var/www/html/public/storage

# Remove dev-only bits and keep a baked snapshot for seeding shared volumes
RUN rm -rf node_modules tests .git || true
RUN mkdir -p /var/www/appimage \
  && cp -a /var/www/html/. /var/www/appimage/
RUN date -u +%Y%m%d%H%M%S > /var/www/appimage/.image-build-id \
  && cp -a /var/www/appimage/.image-build-id /var/www/html/.image-build-id

# Ensure runtime directories exist and are writable by PHP user
RUN mkdir -p storage \
  storage/framework/sessions \
  storage/framework/views \
  storage/framework/cache/data \
  bootstrap/cache \
  && chown -R www-data:www-data storage bootstrap/cache \
  && chmod -R 775 storage bootstrap/cache

# Ensure application tree is world-readable/traversable (for non-root runtimes)
RUN find /var/www/html -type d -exec chmod a+rx {} + \
  && find /var/www/html -type f -exec chmod a+r {} +

RUN { \
  echo "opcache.enable=1"; \
  echo "opcache.enable_cli=1"; \
  echo "opcache.validate_timestamps=0"; \
  echo "opcache.memory_consumption=256"; \
  echo "opcache.interned_strings_buffer=16"; \
  echo "opcache.max_accelerated_files=20000"; \
  echo "opcache.jit=1255"; \
} > /usr/local/etc/php/conf.d/opcache.ini

ENV APP_ENV=production

# Create non-root user with UID 1000 and switch PHP-FPM pool to it
RUN groupadd -g 1000 app && useradd -u 1000 -g 1000 -ms /bin/sh app \
    && mkdir -p /usr/local/etc/php-fpm.d \
    && { \
      echo "[www]"; \
      echo "user = app"; \
      echo "group = app"; \
      echo "listen = 9000"; \
      echo "pm = dynamic"; \
      echo "pm.max_children = 20"; \
      echo "pm.start_servers = 2"; \
      echo "pm.min_spare_servers = 2"; \
      echo "pm.max_spare_servers = 6"; \
      echo "clear_env = no"; \
    } > /usr/local/etc/php-fpm.d/zz-appuser.conf

# Ensure runtime directories are owned by non-root user
RUN chown -R app:app storage bootstrap || true

USER 1000:1000

ENTRYPOINT ["/usr/local/bin/app-entrypoint.sh"]
CMD ["php-fpm"]
