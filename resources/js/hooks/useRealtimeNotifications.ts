import { useEffect } from 'react';
import { toast } from 'sonner';

import { playNotificationSound } from '@/lib/notify-sound';
import { showWebNotification } from '@/lib/web-notify';
import { useNotificationsStore } from '@/stores/notifications';

type Params = {
    userId?: number | string | null;
    roleIds?: Array<number | string> | null;
    globalChannel?: string; // default: 'global'
    globalPrivate?: boolean; // default: false
    includeAnnouncementsInBell?: boolean; // default: from VITE_BELL_INCLUDE_ANNOUNCEMENTS or false
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
    const { add } = useNotificationsStore();
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

        // Simple in-memory dedupe to avoid double-adding when a persistent
        // announcement is broadcast immediately to role/global AND later
        // delivered as a per-user notification via queue.
        const recent = new Map<string, number>();
        const nowMs = () => Date.now();
        const ttlMs = 60_000; // 1 minute window
        const cleanup = () => {
            const t = nowMs();
            for (const [k, ts] of recent) if (t - ts > ttlMs) recent.delete(k);
        };
        const keyOf = (
            title?: unknown,
            message?: unknown,
            url?: unknown,
        ) => [String(title ?? ''), String(message ?? ''), String(url ?? '')].join('|');

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
                        (typeof (data.notification as Record<string, unknown> | undefined)?.title === 'string' &&
                            (data.notification as Record<string, unknown>).title) ||
                        (typeof (data.data as Record<string, unknown> | undefined)?.title === 'string' &&
                            (data.data as Record<string, unknown>).title);
                    const message =
                        (typeof data.message === 'string' && data.message) ||
                        (typeof (data.notification as Record<string, unknown> | undefined)?.message === 'string' &&
                            (data.notification as Record<string, unknown>).message) ||
                        (typeof (data.data as Record<string, unknown> | undefined)?.message === 'string' &&
                            (data.data as Record<string, unknown>).message);
                    const actionUrl =
                        (typeof data.action_url === 'string' && data.action_url) ||
                        (typeof (data.notification as Record<string, unknown> | undefined)?.action_url === 'string' &&
                            (data.notification as Record<string, unknown>).action_url) ||
                        (typeof (data.data as Record<string, unknown> | undefined)?.action_url === 'string' &&
                            (data.data as Record<string, unknown>).action_url) ||
                        (typeof data.url === 'string' && data.url) ||
                        undefined;
                    const createdAt =
                        (typeof data.created_at === 'string' && data.created_at) ||
                        (typeof (data.notification as Record<string, unknown> | undefined)?.created_at === 'string' &&
                            (data.notification as Record<string, unknown>).created_at) ||
                        (typeof (data.data as Record<string, unknown> | undefined)?.created_at === 'string' &&
                            (data.data as Record<string, unknown>).created_at);
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
                    add({
                        title: title,
                        message: message,
                        action_url: actionUrl,
                        meta:
                            data.meta ||
                            data?.notification?.meta ||
                            data?.data?.meta,
                        created_at: createdAt,
                    });
                    playNotificationSound();
                    try {
                        toast(String(title || 'Notification'), {
                            description: String(message || ''),
                            action: actionUrl
                                ? {
                                      label: 'View',
                                      onClick: () => {
                                          window.location.assign(
                                              String(actionUrl),
                                          );
                                      },
                                  }
                                : undefined,
                        });
                        showWebNotification(
                            String(title || 'Notification'),
                            String(message || ''),
                            actionUrl,
                        );
                    } catch {
                        /* noop */
                    }
                };

                // Custom name from broadcastAs on Notification
                ch.listen('.user.notification', handlePersonal);
                // Fallback: default notification broadcast event name
                ch.listen(
                    '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
                    handlePersonal,
                );
                try {
                    ch.subscribed?.(() =>
                        console.info('[Echo] Subscribed user channel', name),
                    );
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
                        add({
                            title: String(
                                (data as { title?: unknown }).title ?? '',
                            ),
                            message: String(
                                (data as { message?: unknown }).message ?? '',
                            ),
                            action_url: (data as {
                                action_url?: string | null;
                            }).action_url,
                            meta: {
                                ...(((data as { meta?: unknown }).meta as Record<
                                    string,
                                    unknown
                                >) || {}),
                                scope: 'role',
                                role_id: rid,
                                persist,
                            },
                            created_at: new Date().toISOString(),
                        });
                        playNotificationSound();
                    }
                    try {
                        toast(
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
                                                              string | null;
                                                      }
                                                  ).action_url,
                                              ),
                                          ),
                                  }
                                : undefined,
                            },
                        );
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
                    ch.subscribed?.(() =>
                        console.info('[Echo] Subscribed role channel', name),
                    );
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
            ch.listen('.global.announcement', (e: unknown) => {
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
                    add({
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
                    playNotificationSound();
                }
                try {
                    toast(
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
                                                              string | null;
                                                      }
                                                  ).action_url,
                                              ),
                                          ),
                                  }
                                : undefined,
                        },
                    );
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
                ch.subscribed?.(() =>
                    console.info('[Echo] Subscribed global channel', name),
                );
            } catch {
                /* noop */
            }
        } catch {
            /* noop */
        }

        return () => {
            try {
                subs.forEach((s) => s.leave());
            } catch {
                /* noop */
            }
        };
        // We intentionally only bind once per mount; pass stable params to re-init if needed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.userId]);
}
