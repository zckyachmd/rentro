# syntax=docker/dockerfile:1.7

############################
# Composer deps (cached)
############################
FROM php:8.3-cli-bookworm AS composer_deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# install pcntl so platform check passes without ignores
RUN docker-php-ext-install pcntl
# install Composer (official installer)
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm composer-setup.php
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
# FE build (client CSR)
############################
FROM fe_deps AS fe_build
COPY package.json pnpm-lock.yaml vite.config.* ./
COPY resources ./resources
COPY public ./public
COPY tsconfig.json ./
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm run build

############################
# PHP base (Debian slim)
############################
FROM php:8.3-fpm-bookworm AS php_base
WORKDIR /var/www/html
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    git unzip libicu-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libzip-dev libpq-dev ca-certificates \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" pdo_pgsql intl gd zip opcache pcntl \
 && pecl install redis \
 && docker-php-ext-enable redis \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

############################
# APP RUNNER (PHP-FPM)
############################
FROM php_base AS app-runner
COPY --from=composer_deps /app /var/www/html
COPY . .
COPY --from=fe_build /app/public/build ./public/build
COPY docker/app/entrypoint.sh /usr/local/bin/app-entrypoint.sh
RUN chmod +x /usr/local/bin/app-entrypoint.sh
RUN rm -rf node_modules tests .git
# Keep a baked copy of the application to seed empty volumes at runtime
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
# Do not cache config/routes at build time; cache at runtime with proper env
ENTRYPOINT ["/usr/local/bin/app-entrypoint.sh"]
CMD ["php-fpm"]

############################
# SSR RUNNER (Node — long running)
############################
FROM node_base AS ssr-runner
WORKDIR /var/www/html
COPY --from=app-runner /var/www/html ./
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --no-frozen-lockfile --prefer-offline \
  && pnpm run build:ssr \
  && pnpm prune --prod
ENV NODE_ENV=production
# ENV NODE_OPTIONS="--max-old-space-size=256"
COPY docker/ssr/entrypoint.sh /usr/local/bin/ssr-entrypoint.sh
RUN chmod +x /usr/local/bin/ssr-entrypoint.sh
CMD ["/usr/local/bin/ssr-entrypoint.sh"]
