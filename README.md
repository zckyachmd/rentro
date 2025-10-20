# Rentro 🏠
The all-in-one rental property platform for landlords & property managers — easy, fast, and fun!

---

## 📚 Table of Contents

1. [🚀 Overview](#-overview)
2. [✨ Features](#-features)
3. [🛠️ Tech Stack](#-tech-stack)
4. [🏗️ Architecture](#-architecture)
5. [🐳 Containers (MVP)](#-containers-mvp)
6. [⚙️ Environment Variables](#-environment-variables)
6. [📄 License](#-license)

---

## 🚀 Overview

Rentro is a robust platform designed to simplify rental property management by centralizing tenant, contract, payment, and asset workflows. Tailored for property managers and landlords, it enhances operational efficiency through automation, real-time insights, and an intuitive web interface.

---

## ✨ Features

- Streamlined tenant and lease management with automated notifications
- Real-time payment and invoice tracking with status updates
- Comprehensive asset inventory and proactive maintenance scheduling
- Event-driven alerts for payments, contract milestones, and renewals
- Data-driven occupancy, financial, and property performance reporting

---

## 🛠️ Tech Stack

- Backend: `Laravel` `PHP 8.4`
- Frontend: `React`, `shadcn/ui`, `Inertia.js` `Vite`
- Database: `PostgreSQL 17`
- Cache & Queue: `Redis 7` `Laravel Horizon`
- Web Server: `Nginx`
- Containerization: `Docker` `Docker Compose`

---

## 🏗️ Architecture

Rentro employs a modular, service-oriented architecture leveraging Laravel’s MVC framework and Inertia.js to deliver a seamless SPA experience. The backend handles business logic, data persistence, and asynchronous processing, while the frontend offers reactive UI components optimized for performance.

---

## 🐳 Containers (MVP)

Services
- `web`: Nginx serving `public/` and proxying to PHP-FPM.
- `app`: PHP-FPM 8.3 (Laravel app). Entrypoint enforces PostgreSQL and requires `APP_KEY`.
- `db`: PostgreSQL 16 with healthcheck.
- `redis`: Redis 7 with healthcheck (provisioned; not required by default app config).
- `ssr`: Node service rendering Inertia SSR bundle for SEO‑friendly HTML.

Quickstart
1) Copy env and set `APP_KEY` (required):
   ```bash
   cp .env.example .env
   # Generate a secure key (writes to .env)
   docker compose run --rm app php artisan key:generate --force
   ```

2) Build and start (Compose loads variables from `.env` into containers automatically via `env_file`):
   ```bash
   docker compose up -d --build
   ```

3) Migrate DB (run once or per deploy as needed):
   ```bash
   docker compose exec app php artisan migrate --force
   ```

4) Seed core data (idempotent, runs in all envs via DatabaseSeeder):
   ```bash
   docker compose exec app php artisan db:seed --force
   ```

Notes
- Default DB is PostgreSQL at service `db`. The app entrypoint will refuse to start if `DB_CONNECTION` is not `pgsql`.
- The app builds config/route/view caches on boot for performance.
- Container services receive environment variables from your project `.env` (no need to mount `.env` as a volume).
- Health ordering: `db`/`redis` → `app` (healthy) → `web`.
- HTTP port: Nginx maps to host `8888` by default. To customize, set `APP_PORT` at compose runtime or edit the compose mapping. The app itself reads `APP_URL` (including its port) for URL generation.

- SSR container is optional via Compose profile:
  - Run with SSR: `docker compose --profile ssr up -d`
  - Default `up` without profile will skip the SSR container.
- Workers (Horizon/Scheduler) are optional via profile and off by default:
  - Run with workers: `docker compose --profile workers up -d`
  - Default `up` will not start these services.

Docker Hub outages/rate limits
- Base images are pulled via Google's public mirror by default (`mirror.gcr.io/library/*`) to avoid Docker Hub anonymous token issues (e.g., 503/500).
- To force Docker Hub, pass build arg or env: `BASE_REGISTRY=docker.io/library`.
- SSR behavior: The app auto‑enables SSR when public pages are enabled (AppSetting `public.enabled = true`), and disables SSR in admin‑only mode. The SSR server endpoint defaults to `http://ssr:13714` (configurable via `INERTIA_SSR_URL`), but no ENV is required by default.

Later (optional)
- SSR, Horizon, and Scheduler are intentionally disabled in MVP for stability. They can be reintroduced via additional services/profiles once the core stack is verified in your environment.

## ⚙️ Environment Variables

Minimal, production‑oriented env. Keep it simple—add more only when enabling features.

Required
- `APP_KEY`: 32‑char key (use `php artisan key:generate`).
- `APP_URL`: Public base URL (e.g., `http://localhost:8888`).

Application
- `APP_NAME`, `APP_ENV`, `APP_DEBUG`, `APP_VERSION`
- Locale/timezone: `APP_LOCALE`, `APP_FALLBACK_LOCALE`, `APP_FAKER_LOCALE`, `APP_TIMEZONE`
- Maintenance: `APP_MAINTENANCE_DRIVER` (default `file`)

Database (PostgreSQL)
- `DB_CONNECTION=pgsql`, `DB_HOST=db`, `DB_PORT=5432`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`

Runtime Stores
- Sessions: `SESSION_DRIVER=file`
- Cache: `CACHE_STORE=file`
- Queue: `QUEUE_CONNECTION=sync`
  - Redis is provisioned by compose but not required by defaults. Switch to Redis by setting `CACHE_STORE=redis` and/or `QUEUE_CONNECTION=redis` when ready.

Redis (optional)
- `REDIS_CLIENT=phpredis`, `REDIS_HOST=redis`, `REDIS_PORT=6379`

Mail (SMTP)
- `MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`
- `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`

Frontend (Vite/SSR)
- `VITE_APP_NAME` (optional). The frontend infers its base URL from the page origin; no need to set `VITE_APP_URL`.
- HMR control (dev):
  - `VITE_DISABLE_HMR` — set to `true` to fully disable HMR (fallback to full page reloads)
  - `VITE_HOST` — dev server host (default `127.0.0.1`)
  - Optional overrides for tunnels/proxies:
    - `VITE_HMR_HOST` — HMR host override
    - `VITE_HMR_PROTOCOL` — `ws` or `wss` (defaults to `wss` if `APP_URL` is https)
    - `VITE_HMR_CLIENT_PORT` — HMR client port (default `5173`)
- SSR control: backend auto‑enables SSR when public pages are enabled (no ENV required). Start the SSR container with `--profile ssr` when using SSR.
- `VITE_I18N_PRELOAD_ALL=false`
  
  i18n (browser console)
  - `VITE_I18N_DEBUG` — enable minimal i18next debug logs (default OFF). Missing‑locale warnings are deduped per language/namespace.

Database bootstrap (containers)
- Auto-migrate/seed run inside containers by default on start:
  - `AUTO_MIGRATE=1` and `AUTO_SEED=1` (default). Set to `0`/`false` to disable.
  - Applied for `app`, and if enabled via profile, also for `horizon` and `scheduler`.

Tips
- FE‐only variables use the `VITE_` prefix and are not consumed by Blade/PHP.
- Keep `.env` minimal to avoid confusion; rely on sensible defaults in config files.

## 🌱 Seeding Strategy

- Core seeders (always run, production‑safe):
  - `DatabaseSeeder` runs `CoreSeeder` by default in all environments.
  - Includes settings, permissions, menus, base reference tables, and a default admin user.

- Sample (faker) seeders (manual only):
  - Use `SampleDataSeeder` to create demo users/rooms/promotions/testimonies.
  - Not controlled by env flags; run explicitly when needed:
    ```bash
    docker compose exec app php artisan seed:sample --force
    ```

- Production recommendation:
  - Run only core seeding (`php artisan db:seed --force`).
  - Use sample seeding only in non‑production contexts or controlled environments.

### Handy Seeder Commands

- `php artisan seed:core` — seeds production‑safe core data (idempotent).
- `php artisan seed:sample` — seeds demo/sample data (asks for confirmation in production unless `--force`).
---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and instructions.

---

## 📄 License

Distributed under a permissive license. Refer to [LICENSE.md](LICENSE.md) for full terms.
