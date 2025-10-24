import { useEffect } from 'react';
import { toast } from 'sonner';

import { getJson } from '@/lib/api';
import { playNotificationSound } from '@/lib/notify-sound';
import { showWebNotification } from '@/lib/web-notify';
import { useNotificationsStore, type NotificationItem } from '@/stores/notifications';

type Params = {
    userId?: number | string | null;
    roleIds?: Array<number | string> | null;
    globalChannel?: string; // default: 'global'
    globalPrivate?: boolean; // default: false
    includeAnnouncementsInBell?: boolean; // default: from VITE_BELL_INCLUDE_ANNOUNCEMENTS or false
    enableSound?: boolean; // default: true
    minToastPriority?: 'low' | 'normal' | 'high'; // default: 'low'
    resyncIntervalMs?: number; // default: 120_000
};

/**
 * Subscribe to realtime notifications via Laravel Echo (Reverb).
 * - private user.{id} for personal notifications
 * - presence role.{roleId} for role announcements
 * - public/private global channel for global announcements
 */
type EchoLike = {
    private: (name: string) => {
        notification: (cb: (payload: unknown) => void) => void;
        listen?: (event: string, cb: (payload: unknown) => void) => void;
        subscribed?: (cb: () => void) => void;
    };
    join: (name: string) => {
        listen: (event: string, cb: (payload: unknown) => void) => void;
        subscribed?: (cb: () => void) => void;
    };
    channel: (name: string) => {
        listen: (event: string, cb: (payload: unknown) => void) => void;
        subscribed?: (cb: () => void) => void;
    };
    leave: (name: string) => void;
};

export function useRealtimeNotifications(params: Params) {
    const { upsert, syncFromServer } = useNotificationsStore();
    useEffect(() => {
        const Echo = (globalThis as { Echo?: EchoLike }).Echo;
        if (!Echo) return;

        const userId = params.userId ? String(params.userId) : undefined;
        const roleIds = (params.roleIds || []).map((r) => String(r));
        const globalChannel = params.globalChannel || 'global';
        const globalPrivate = Boolean(params.globalPrivate);

        const subs: Array<{ leave: () => void }> = [];
        // Always include announcements in bell unless explicitly disabled by param
        const includeAnnouncements = params.includeAnnouncementsInBell ?? true;
        const enableSound = params.enableSound ?? true;
        const minToastPriority = params.minToastPriority ?? 'low';
        const resyncIntervalMs = params.resyncIntervalMs ?? 120_000;
        const DEBUG_TOKEN = String((import.meta.env as Record<string, string | undefined>).VITE_NOTIFICATIONS_DEBUG || '').trim().toLowerCase();
        const DEBUG = ['true', '1', 'yes', 'on'].includes(DEBUG_TOKEN);
        const debug = (...args: unknown[]) => { if (DEBUG) console.log('[Notifications]', ...args); };

        // Simple in-memory dedupe to avoid double-adding when a persistent
        // announcement is broadcast immediately to role/global AND later
        // delivered as a per-user notification via queue.
        const recent = new Map<string, number>();
        const seenIds = new Set<string>();
        const nowMs = () => Date.now();
        const ttlMs = 60_000; // 1 minute window
        const cleanup = () => {
            const t = nowMs();
            for (const [k, ts] of recent) if (t - ts > ttlMs) recent.delete(k);
        };
        const keyOf = (title?: unknown, message?: unknown, url?: unknown) =>
            [
                String(title ?? ''),
                String(message ?? ''),
                String(url ?? ''),
            ].join('|');

        // Toast rate-limit
        let toastBudget = 3;
        const toastWindowMs = 3000;
        let lastWindowStart = nowMs();
        const canToast = () => {
            const t = nowMs();
            if (t - lastWindowStart > toastWindowMs) {
                lastWindowStart = t;
                toastBudget = 3;
            }
            if (toastBudget > 0) { toastBudget -= 1; return true; }
            return false;
        };

        // Resync helpers
        type Summary = { unread: number; latest: Array<{ id: string; data: { title?: unknown; message?: unknown; action_url?: string | null; meta?: unknown; created_at?: string | null; }; read_at?: string | null; created_at?: string | null; }>; };
        const resyncOnce = async () => {
            try {
                const url = route('notifications.summary');
                const json = await getJson<Summary>(url);
                const mapped: NotificationItem[] = (json.latest || []).map((n) => {
                    const d = n.data as Record<string, unknown>;
                    return {
                        id: n.id,
                        title: (typeof d.title === 'string' && d.title) || 'Notification',
                        message: (typeof d.message === 'string' && d.message) || '',
                        action_url: (typeof d.action_url === 'string' && d.action_url) || (typeof (d as { url?: unknown }).url === 'string' && (d as { url?: string }).url) || undefined,
                        meta: (d.meta as Record<string, unknown>) || undefined,
                        created_at: (typeof d.created_at === 'string' && d.created_at) || n.created_at || undefined,
                        read_at: n.read_at || null,
                    };
                });
                syncFromServer(mapped, Number(json.unread || 0));
                debug('Resync summary', { items: mapped.length, unread: json.unread });
            } catch (e) {
                debug('Resync failed', e);
            }
        };
        let resyncTimer: number | undefined;
        const scheduleResync = (delay = 1200) => {
            try { if (resyncTimer) clearTimeout(resyncTimer); } catch { void 0; }
            // @ts-expect-error browser setTimeout returns number
            resyncTimer = setTimeout(resyncOnce, delay);
        };

        // Initial resync on mount
        void resyncOnce();

        // Personal notifications (Laravel Notification broadcast)
        if (userId) {
            try {
                const name = `user.${userId}`;
                const ch = Echo.private(name);
                // Echo.leave expects the logical channel name; it handles prefixes
                subs.push({ leave: () => Echo.leave(name) });

                const handlePersonal = (e: unknown) => {
                    const data = (e || {}) as Record<string, unknown>;
                    const title =
                        (typeof data.title === 'string' && data.title) ||
                        (typeof (
                            data.notification as
                                | Record<string, unknown>
                                | undefined
                        )?.title === 'string' &&
                            (data.notification as Record<string, unknown>)
                                .title) ||
                        (typeof (
                            data.data as Record<string, unknown> | undefined
                        )?.title === 'string' &&
                            (data.data as Record<string, unknown>).title);
                    const message =
                        (typeof data.message === 'string' && data.message) ||
                        (typeof (
                            data.notification as
                                | Record<string, unknown>
                                | undefined
                        )?.message === 'string' &&
                            (data.notification as Record<string, unknown>)
                                .message) ||
                        (typeof (
                            data.data as Record<string, unknown> | undefined
                        )?.message === 'string' &&
                            (data.data as Record<string, unknown>).message);
                    const actionUrl =
                        (typeof data.action_url === 'string' &&
                            data.action_url) ||
                        (typeof (
                            data.notification as
                                | Record<string, unknown>
                                | undefined
                        )?.action_url === 'string' &&
                            (data.notification as Record<string, unknown>)
                                .action_url) ||
                        (typeof (
                            data.data as Record<string, unknown> | undefined
                        )?.action_url === 'string' &&
                            (data.data as Record<string, unknown>)
                                .action_url) ||
                        (typeof data.url === 'string' && data.url) ||
                        undefined;
                    const createdAt =
                        (typeof data.created_at === 'string' &&
                            data.created_at) ||
                        (typeof (
                            data.notification as
                                | Record<string, unknown>
                                | undefined
                        )?.created_at === 'string' &&
                            (data.notification as Record<string, unknown>)
                                .created_at) ||
                        (typeof (
                            data.data as Record<string, unknown> | undefined
                        )?.created_at === 'string' &&
                            (data.data as Record<string, unknown>).created_at);
                    let id: string | undefined = undefined;
                    if (typeof (data as { id?: unknown }).id === 'string') {
                        id = (data as { id: string }).id;
                    } else if (
                        typeof (
                            (data.notification as Record<string, unknown> | undefined)
                                ?.id
                        ) === 'string'
                    ) {
                        id = (
                            data.notification as { id: string }
                        ).id;
                    }
                    if (id && seenIds.has(id)) {
                        debug('skip duplicate by id', id);
                        return;
                    }
                    if (id) seenIds.add(id);
                    // Skip if we recently added the same content from an announcement broadcast
                    try {
                        const k = keyOf(title, message, actionUrl);
                        if (recent.has(k)) {
                            cleanup();
                            return; // avoid double count
                        }
                    } catch {
                        /* noop */
                    }
                    const titleVal: string | Record<string, unknown> =
                        typeof title === 'string'
                            ? title
                            : title && typeof title === 'object'
                              ? (title as Record<string, unknown>)
                              : String(title ?? '');
                    const messageVal: string | Record<string, unknown> =
                        typeof message === 'string'
                            ? message
                            : message && typeof message === 'object'
                              ? (message as Record<string, unknown>)
                              : String(message ?? '');
                    const actionUrlStr: string | null | undefined =
                        typeof actionUrl === 'string' ? actionUrl : undefined;
                    const obj = data as Record<string, unknown>;
                    const notification = obj.notification as
                        | Record<string, unknown>
                        | undefined;
                    const dataObj = obj.data as
                        | Record<string, unknown>
                        | undefined;
                    const metaRaw =
                        (obj.meta as unknown) ??
                        (notification?.meta as unknown) ??
                        (dataObj?.meta as unknown);
                    const metaVal: Record<string, unknown> | undefined =
                        metaRaw && typeof metaRaw === 'object'
                            ? (metaRaw as Record<string, unknown>)
                            : undefined;
                    const createdAtStr: string | undefined =
                        typeof createdAt === 'string' ? createdAt : undefined;

                    upsert({
                        id,
                        title: titleVal,
                        message: messageVal,
                        action_url: actionUrlStr,
                        meta: metaVal,
                        created_at: createdAtStr,
                    });
                    if (enableSound) playNotificationSound();
                    scheduleResync(800);
                    try {
                        const priority = String(
                            (metaVal as { priority?: unknown })?.priority ??
                                'normal',
                        ) as 'low' | 'normal' | 'high';
                        const allowToast =
                            minToastPriority === 'low' ||
                            (minToastPriority === 'normal' &&
                                priority !== 'low') ||
                            (minToastPriority === 'high' &&
                                priority === 'high');
                        if (allowToast && canToast())
                            toast(String(title || 'Notification'), {
                                description: String(message || ''),
                                action: actionUrlStr
                                    ? {
                                          label: 'View',
                                          onClick: () => {
                                              window.location.assign(
                                                  String(actionUrlStr),
                                              );
                                          },
                                      }
                                    : undefined,
                            });
                        if (allowToast && canToast())
                            showWebNotification(
                                String(title || 'Notification'),
                                String(message || ''),
                                actionUrlStr,
                            );
                    } catch {
                        /* noop */
                    }
                };

                // Custom name from broadcastAs on Notification
                ch.listen?.('.user.notification', handlePersonal);
                // Fallback: default notification broadcast event name
                ch.listen?.(
                    '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
                    handlePersonal,
                );
                try {
                    (ch as { subscribed?: (cb: () => void) => void }).subscribed?.(
                        () => console.log('[Echo] Subscribed user channel', name),
                    );
                    scheduleResync(1000);
                } catch {
                    /* noop */
                }
            } catch {
                /* noop */
            }
        }

        // Role announcements (presence channels)
        for (const rid of roleIds) {
            try {
                const name = `role.${rid}`;
                const ch = Echo.join(name);
                subs.push({ leave: () => Echo.leave(name) });
                ch.listen('.role.announcement', (e: unknown) => {
                    const data = (e || {}) as Record<string, unknown>;
                    const persist = Boolean(
                        (data as Record<string, unknown>)?.persist,
                    );
                    const shouldAdd = persist || includeAnnouncements;
                    if (shouldAdd) {
                        if (persist) {
                            const k = keyOf(
                                (data as { title?: unknown }).title,
                                (data as { message?: unknown }).message,
                                (data as { action_url?: unknown }).action_url,
                            );
                            recent.set(k, nowMs());
                            cleanup();
                        }
                        upsert({
                            title: String(
                                (data as { title?: unknown }).title ?? '',
                            ),
                            message: String(
                                (data as { message?: unknown }).message ?? '',
                            ),
                            action_url: (
                                data as {
                                    action_url?: string | null;
                                }
                            ).action_url,
                            meta: {
                                ...(((data as { meta?: unknown })
                                    .meta as Record<string, unknown>) || {}),
                                scope: 'role',
                                role_id: rid,
                                persist,
                            },
                            created_at: new Date().toISOString(),
                        });
                        if (enableSound) playNotificationSound();
                        scheduleResync(800);
                    }
                    try {
                        const pr = String(
                            (data as { meta?: { priority?: unknown } }).meta
                                ?.priority || 'normal',
                        ) as 'low' | 'normal' | 'high';
                        const allowToast =
                            minToastPriority === 'low' ||
                            (minToastPriority === 'normal' && pr !== 'low') ||
                            (minToastPriority === 'high' && pr === 'high');
                        if (allowToast && canToast()) toast(
                            String(
                                (data as { title?: unknown }).title ||
                                    'Announcement',
                            ),
                            {
                                description: String(
                                    (data as { message?: unknown }).message ||
                                        '',
                                ),
                                action: (data as { action_url?: string | null })
                                    .action_url
                                    ? {
                                          label: 'Open',
                                          onClick: () =>
                                              window.location.assign(
                                                  String(
                                                      (
                                                          data as {
                                                              action_url?:
                                                                  | string
                                                                  | null;
                                                          }
                                                      ).action_url,
                                                  ),
                                              ),
                                      }
                                    : undefined,
                            },
                        );
                        if (allowToast && canToast())
                            showWebNotification(
                                String(
                                    (data as { title?: unknown }).title ||
                                        'Announcement',
                                ),
                                String(
                                    (data as { message?: unknown }).message ||
                                        '',
                                ),
                                (data as { action_url?: string | null })
                                    .action_url,
                            );
                    } catch {
                        /* noop */
                    }
                });
                try {
                    ch.subscribed?.(() => console.log('[Echo] Subscribed role channel', name));
                    scheduleResync(1000);
                } catch {
                    /* noop */
                }
            } catch {
                /* noop */
            }
        }

        // Global announcements
        try {
            const name = String(globalChannel || 'global');
            const ch = globalPrivate ? Echo.private(name) : Echo.channel(name);
            subs.push({ leave: () => Echo.leave(name) });
            ch.listen?.('.global.announcement', (e: unknown) => {
                const data = (e || {}) as Record<string, unknown>;
                const persist = Boolean(
                    (data as Record<string, unknown>)?.persist,
                );
                const shouldAdd = persist || includeAnnouncements;
                if (shouldAdd) {
                    if (persist) {
                        const k = keyOf(
                            (data as { title?: unknown }).title,
                            (data as { message?: unknown }).message,
                            (data as { action_url?: unknown }).action_url,
                        );
                        recent.set(k, nowMs());
                        cleanup();
                    }
                    upsert({
                        title: String(
                            (data as { title?: unknown }).title ?? '',
                        ),
                        message: String(
                            (data as { message?: unknown }).message ?? '',
                        ),
                        action_url: (data as { action_url?: string | null })
                            .action_url,
                        meta: {
                            ...(((data as { meta?: unknown }).meta as Record<
                                string,
                                unknown
                            >) || {}),
                            scope: 'global',
                            persist,
                        },
                        created_at: new Date().toISOString(),
                    });
                    if (enableSound) playNotificationSound();
                    scheduleResync(800);
                }
                try {
                    const pr = String(
                        (data as { meta?: { priority?: unknown } }).meta
                            ?.priority || 'normal',
                    ) as 'low' | 'normal' | 'high';
                    const allowToast =
                        minToastPriority === 'low' ||
                        (minToastPriority === 'normal' && pr !== 'low') ||
                        (minToastPriority === 'high' && pr === 'high');
                    if (allowToast && canToast()) toast(
                        String(
                            (data as { title?: unknown }).title ||
                                'Announcement',
                        ),
                        {
                            description: String(
                                (data as { message?: unknown }).message || '',
                            ),
                            action: (data as { action_url?: string | null })
                                .action_url
                                ? {
                                      label: 'Open',
                                      onClick: () =>
                                          window.location.assign(
                                              String(
                                                  (
                                                      data as {
                                                          action_url?:
                                                              | string
                                                              | null;
                                                      }
                                                  ).action_url,
                                              ),
                                          ),
                                  }
                                : undefined,
                        },
                    );
                    if (allowToast && canToast())
                        showWebNotification(
                            String(
                                (data as { title?: unknown }).title ||
                                    'Announcement',
                            ),
                            String(
                                (data as { message?: unknown }).message || '',
                            ),
                            (data as { action_url?: string | null }).action_url,
                        );
                } catch {
                    /* noop */
                }
            });
            try {
                ch.subscribed?.(() => console.log('[Echo] Subscribed global channel', name));
                scheduleResync(1200);
            } catch {
                /* noop */
            }
        } catch {
            /* noop */
        }

        // Periodic resync when tab visible
        const intervalId = window.setInterval(() => {
            try {
                if (typeof document === 'undefined') return;
                if (document.visibilityState !== 'visible') return;
                void resyncOnce();
            } catch { void 0; }
        }, resyncIntervalMs);

        return () => {
            try {
                subs.forEach((s) => s.leave());
            } catch { void 0; }
            try { clearInterval(intervalId); } catch { void 0; }
        };
        // We intentionally only bind once per mount; pass stable params to re-init if needed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.userId]);
}
