ARG BASE_REGISTRY=mirror.gcr.io/library
FROM ${BASE_REGISTRY}/node:20-alpine AS runtime
WORKDIR /srv
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install only runtime deps (no dev), used by SSR server
COPY package.json pnpm-lock.yaml ./
# Install only production deps, skip optional native binaries to keep image small
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --prod --no-optional --no-frozen-lockfile --prefer-offline

# Scripts
COPY docker/ssr/entrypoint.sh /usr/local/bin/ssr-entrypoint.sh
COPY docker/ssr/healthcheck.sh /usr/local/bin/ssr-healthcheck.sh
COPY docker/ssr/ssr-healthcheck.js /usr/local/bin/ssr-healthcheck.js
RUN chmod 755 /usr/local/bin/ssr-entrypoint.sh /usr/local/bin/ssr-healthcheck.sh \
    && chmod 644 /usr/local/bin/ssr-healthcheck.js

USER node
EXPOSE 13714
ENV PORT=13714
ENV APP_ROOT=/srv/app
ENTRYPOINT ["/usr/local/bin/ssr-entrypoint.sh"]
CMD ["/usr/local/bin/ssr-entrypoint.sh"]
