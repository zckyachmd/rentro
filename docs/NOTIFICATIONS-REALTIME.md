# Realtime Notifications (Laravel Reverb + Echo)

This document describes how the realtime notification system in Rentro is wired, how to run it locally, and how to test the three scenarios: personal, role-based broadcasts, and global announcements.

## Overview

- Backend uses Laravel Broadcasting with the `reverb` driver.
- Channels:
  - `private user.{id}` for personal notifications (stored in DB + broadcast).
  - `presence role.{roleId}` for role announcements (broadcast-only by default).
  - `global` channel for global announcements (public by default; can be private).
- Frontend uses Echo (via `@laravel/echo-react`) to subscribe and show toast + update a zustand store for badges and lists.
- A service layer (`App\Services\NotificationService`) provides simple methods to send personal notifications and announce to role/global, with an option to persist per-user (fan-out).

## Environment & Config

Set these variables (also available in `.env.example`):

```
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=local
REVERB_APP_KEY=local
REVERB_APP_SECRET=local

REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
REVERB_SERVER_PATH=

REVERB_SCALING_ENABLED=false
REVERB_SCALING_CHANNEL=reverb

BROADCAST_GLOBAL_PRIVATE=false
VITE_NOTIFICATIONS_GLOBAL_PRIVATE=${BROADCAST_GLOBAL_PRIVATE}

VITE_REVERB_APP_KEY=${REVERB_APP_KEY}
VITE_REVERB_HOST=${REVERB_HOST}
VITE_REVERB_PORT=${REVERB_PORT}
VITE_REVERB_SCHEME=${REVERB_SCHEME}
VITE_REVERB_WS_PATH=${REVERB_SERVER_PATH}
```

Notes:

- When `BROADCAST_GLOBAL_PRIVATE=true`, the global channel becomes private and requires auth; frontend should subscribe with `Echo.private('global')`.
- For production with TLS, use `REVERB_SCHEME=https` and configure TLS certs via `config/reverb.php` (`options.tls`).

## Queues (Horizon)

- Queue driver: Redis (recommended). Fall back to `database` if Redis is unavailable.
- Horizon is already configured via `config/horizon.php`.
- All notification fan-out jobs run on the default queue; adjust as needed.

## Running Locally

Option A (one command):

- `composer dev` will start: Laravel server, queue worker, scheduler, Pail logs, Vite, and Reverb.

Option B (manual):

1. Start the application as usual (e.g., `php artisan serve`).
2. Start Reverb websocket server: `php artisan reverb:start` (port configured by `.env`).
3. Start Horizon (queues): `php artisan horizon` (ensure Redis is running).
4. Start Vite dev server: `npm run dev`.

Echo in `resources/js/app.tsx` is configured with `broadcaster: 'reverb'` via `@laravel/echo-react` and will use the `VITE_REVERB_*` variables.

## Channels & Authorization

- `private user.{id}`: User must match the `{id}` in the channel.
- `presence role.{roleId}`: Only users that have the Spatie role with the given `roleId` can join; presence payload includes `{ id, name }`.
- `global`: Public by default. If `BROADCAST_GLOBAL_PRIVATE=true`, it becomes private and requires auth (any authenticated user may join).

Channel definitions: `routes/channels.php`.

## Backend APIs

Management endpoints (role/permission protected):

- `POST /management/announcements/role`
  - Body: `{ role_id, title, message, action_url?, persist?: boolean }`
  - Always broadcasts immediately on `presence role.{roleId}` with payload `{ title, message, action_url, persist }` for realtime toast.
  - `persist=true` additionally queues fan-out so each user also receives a stored `PersonalNotification` on `private user.{id}` (which also broadcasts per-user).

- `POST /management/announcements/global`
  - Body: `{ title, message, action_url?, persist?: boolean }`
  - Always broadcasts immediately on `global` (or private `global`) with payload `{ title, message, action_url, persist }` for realtime toast.
  - `persist=true` additionally queues fan-out to all users (stored `PersonalNotification` on `private user.{id}` + per-user broadcast).

User notifications (Inertia/REST):

- `GET /notifications?filter=unread|all` → paginated list (default `all`).
- `PUT /notifications/{id}/read` → mark a single notification as read.
- `PUT /notifications/read-all` → mark all as read.

## Service Layer

`App\Services\NotificationService`:

- `notifyUser(userId, title, message, actionUrl?, meta?)`
  - Stores a `PersonalNotification` (DB) and broadcasts on `private user.{id}`.
- `announceRole(roleId, title, message, actionUrl?, persistPerUser)`
  - `persistPerUser=false`: broadcast-only on presence role channel.
  - `true`: queue fan-out to every user in the role.
- `announceGlobal(title, message, actionUrl?, persistPerUser)`
  - `persistPerUser=false`: broadcast-only on global channel.
  - `true`: queue fan-out to all users.

Fan-out uses chunking (`NOTIFICATIONS_FANOUT_CHUNK`, default 1000) and batched jobs.

## Frontend Integration

Initialize Echo: already done in `resources/js/app.tsx` via `configureEcho({ broadcaster: 'reverb' })`.

Hook: `resources/js/hooks/useRealtimeNotifications.ts`

- Subscribe to:
  - Private: `user.{id}` (event `.user.notification`).
  - Presence: `presence-role.{roleId}` (event `.role.announcement`).
  - Global: `global` or private `global` depending on env toggle.
- Shows toast (Sonner) and updates zustand store.
- Bell count rules:
  - Personal notifications always increment the bell.
  - Role/global announcements increment the bell only when `persist=true` in the event, unless `VITE_BELL_INCLUDE_ANNOUNCEMENTS=true` is set to include all announcements.

Store: `resources/js/stores/notifications.ts`

- State: `items`, `unreadCount`.
- Methods: `setInitial`, `add`, `update`, `markRead`, `markAllRead`, `syncFromServer`.

UI Components:

- `resources/js/components/notification-bell.tsx`
  - Bell icon with unread badge; dropdown shows recent items and link to the full page.
- Page: `resources/js/pages/notifications/index.tsx`
  - Paginated list with filter (unread/all), mark single/all read, open `action_url` if present.

Usage:

- Mount `useRealtimeNotifications({ userId, roleIds, globalPrivate: import.meta.env.VITE_NOTIFICATIONS_GLOBAL_PRIVATE === 'true' })` in a root layout.
- Place `<NotificationBell />` in the navbar.

## Tinker Scenarios

Personal (stored + broadcast):

```
app(App\Services\NotificationService::class)->notifyUser(1, 'Invoice Paid', 'Your invoice #INV-1 has been paid', route('tenant.invoices.show', 1));
```

Role broadcast-only:

```
app(App\Services\NotificationService::class)->announceRole(3, 'Reminder', 'Team meeting at 4PM', null, false);
```

Role with persist:

```
app(App\Services\NotificationService::class)->announceRole(3, 'Policy Update', 'Please read the new policy', route('management.pages.index'), true);
```

Global broadcast-only:

```
app(App\Services\NotificationService::class)->announceGlobal('Maintenance', 'We will have maintenance tonight', route('public.maintenance'), false);
```

Global with persist:

```
app(App\Services\NotificationService::class)->announceGlobal('Welcome', 'New features are live!', url('/'), true);
```

## Security Notes

- Authorization for channels is strict:
  - Only the owner can join `private user.{id}`.
  - Only members of the role can join `presence role.{roleId}`.
- Keep payloads minimal (no sensitive data) for broadcast events.
- Consider making the global channel private when needed via `BROADCAST_GLOBAL_PRIVATE=true`.

## Performance Notes

- For large fan-outs, use Redis + Horizon and consider increasing worker concurrency.
- Jobs are unique for a short period to reduce duplicates during bursts.
- Chunk size is configurable via `NOTIFICATIONS_FANOUT_CHUNK`.

## Fallback (Polling)

- If websockets are unavailable, the Notifications page continues to work via REST.
- You can add a lightweight polling fallback by periodically fetching `/notifications?filter=unread` and updating the store.

## Tests

- Unit: notification service job dispatch.
- Feature:
  - Channel auth for private/presence channels.
  - Mark single and all as read endpoints.
- E2E-lite: events dispatched for broadcast-only scenarios.
