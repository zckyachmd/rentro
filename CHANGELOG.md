# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2025-09-26

A minor pre-release focusing on a new Amenities module, theme preference persistence, route organization, and assorted i18n and DX refinements.

### Added

- Amenities: translation-ready Amenities module (backend CRUD with `name_i18n` JSON and `AmenityCategory` enum; robust validation and category index).
- Amenities UI: management page with modular columns and upsert dialog, category filters, and delete confirmation via AlertDialog.
- i18n: frontend locales for amenities (including enum values) and common.icon; added missing audit translations; consolidated contract translations (admin + tenant).
- Appearance: user theme preferences persisted to `users.preferences['theme']` and synced via cookie; Inertia share and `useTheme` helper; server-side persistence for mode toggle; throttling via `ui-preferences` and cookie excluded from encryption.
- Dashboard: tenant dashboard view and role sourcing improvements.

### Changed

- Routing: extracted management routes to `routes/management.php` and enforced permissions consistently across modules.
- Database migrations: removed separate "drop" migrations and folded changes into the base `create_*` migrations; `create_payments_table` no longer includes soft deletes.
- Database schema: dropped legacy `users.theme` in favor of `users.preferences['theme']` as the single source of truth.
- Code quality: applied CS fixes and PHPStan adjustments; improved enum i18n usage; stabilized Midtrans enum mapping.
- CI/CD: hardened Docker image publishing for `rentro-api` and `rentro-web`; switched lint to npm and standardized auto-formatting.

### Fixed

- Permissions: corrected permission enforcement in management routes.
- Minor FE/BE tweaks and stability improvements.

### Upgrade notes

- If you previously ran migrations before this release, the consolidation of migrations may require a refresh on development environments. For a clean slate: `php artisan migrate:fresh` (this will drop data). On shared/stable environments, review the diff and apply with care.
- Ensure `APP_VERSION` is updated to `0.0.2` to bust caches and client payload namespaces as intended.

## [0.0.1] - 2025-09-21

Initial pre-release providing the application foundation and development environment.

### Added

- Application foundation: Laravel 12 (PHP 8.4), Inertia (React), Vite, Tailwind CSS with OKLCH-based CSS variables and dark mode support.
- Core layouts and components:
  - AuthLayout, GuestLayout, Sidebar, Navbar, Footer, ThemeProvider, and Mode Toggle.
  - Base UI components (Card, Alert, Input, etc.) integrated with the theme system.
- Initial pages/features (skeleton):
  - Auth: login, register, reset/confirm password, verify email, two-factor.
  - Profile: overview, edit, contact, address, document.
  - Security: password, sessions, 2FA.
  - Management: room (create/edit/index), contract (create/detail/index), user (index), role (index), invoice (index), payment (index), audit (index).
  - Tenant: contract (index/detail), invoice (index).
  - Payment: result pages.
- Docker & Compose:
  - Multi-stage Dockerfile (vendor, vendor_dev, assets, app, app-dev, web) with optimized PHP-FPM and optional Xdebug for development.
  - Development compose: services `app` (PHP-FPM), `web` (Nginx), `db` (PostgreSQL 17), `redis` (Redis 7), `vite` (devtools profile), `horizon` and `scheduler` (workers profile), `mailhog` (devtools profile, optional).
  - Production compose file and health checks for core services (app, db, redis).
- Mail & dev integration:
  - Laravel mailer configured; MailHog as dev SMTP (optional via profile) using internal host `mailhog:1025`.
- Database & cache:
  - PostgreSQL with `pgdata` volume and healthcheck.
  - Redis for queue/cache/session.
- JavaScript tooling in containers uses npm; added `package-lock.json` for deterministic builds (assets stage runs `npm ci` when lock exists).
- Global layout background uses Tailwind CSS variables (`bg-background`/`text-foreground`) across Blade and layouts.
- Documentation: initial README with overview, tech stack, and development instructions.
- Quality tooling: ESLint/Prettier, PHP-CS-Fixer, PHPStan, GrumPHP.
[0.0.2]: https://github.com/zckyachmd/rentro/releases/tag/v0.0.2
[0.0.1]: https://github.com/zckyachmd/rentro/releases/tag/v0.0.1
