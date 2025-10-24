import { playNotificationSound } from '@/lib/notify-sound';
import { showWebNotification } from '@/lib/web-notify';
import { useNotificationsStore } from '@/stores/notifications';
import { useEffect } from 'react';
import { toast } from 'sonner';

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
export function useRealtimeNotifications(params: Params) {
    const { add } = useNotificationsStore();
    useEffect(() => {
        const Echo: any = (globalThis as any).Echo;
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
        const keyOf = (title?: any, message?: any, url?: any) =>
            [
                String(title ?? ''),
                String(message ?? ''),
                String(url ?? ''),
            ].join('|');

        // Personal notifications (Laravel Notification broadcast)
        if (userId) {
            try {
                const name = `user.${userId}`;
                const ch = Echo.private(name);
                // Echo.leave expects the logical channel name; it handles prefixes
                subs.push({ leave: () => Echo.leave(name) });

                const handlePersonal = (e: any) => {
                    const data = e || {};
                    const title =
                        data.title ??
                        data?.notification?.title ??
                        data?.data?.title;
                    const message =
                        data.message ??
                        data?.notification?.message ??
                        data?.data?.message;
                    const actionUrl =
                        data.action_url ??
                        data?.notification?.action_url ??
                        data?.data?.action_url ??
                        data?.url;
                    const createdAt =
                        data.created_at ??
                        data?.notification?.created_at ??
                        data?.data?.created_at;
                    // Skip if we recently added the same content from an announcement broadcast
                    try {
                        const k = keyOf(title, message, actionUrl);
                        if (recent.has(k)) {
                            cleanup();
                            return; // avoid double count
                        }
                    } catch {}
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
                    } catch {}
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
                } catch {}
            } catch {}
        }

        // Role announcements (presence channels)
        for (const rid of roleIds) {
            try {
                const name = `role.${rid}`;
                const ch = Echo.join(name);
                subs.push({ leave: () => Echo.leave(name) });
                ch.listen('.role.announcement', (e: any) => {
                    const data = e || {};
                    const persist = Boolean((data as any)?.persist);
                    const shouldAdd = persist || includeAnnouncements;
                    if (shouldAdd) {
                        if (persist) {
                            const k = keyOf(
                                data.title,
                                data.message,
                                data.action_url,
                            );
                            recent.set(k, nowMs());
                            cleanup();
                        }
                        add({
                            title: data.title,
                            message: data.message,
                            action_url: data.action_url,
                            meta: {
                                ...(data.meta || {}),
                                scope: 'role',
                                role_id: rid,
                                persist,
                            },
                            created_at: new Date().toISOString(),
                        });
                        playNotificationSound();
                    }
                    try {
                        toast(String(data.title || 'Announcement'), {
                            description: String(data.message || ''),
                            action: data.action_url
                                ? {
                                      label: 'Open',
                                      onClick: () =>
                                          window.location.assign(
                                              String(data.action_url),
                                          ),
                                  }
                                : undefined,
                        });
                        showWebNotification(
                            String(data.title || 'Announcement'),
                            String(data.message || ''),
                            data.action_url,
                        );
                    } catch {}
                });
                try {
                    ch.subscribed?.(() =>
                        console.info('[Echo] Subscribed role channel', name),
                    );
                } catch {}
            } catch {}
        }

        // Global announcements
        try {
            const name = String(globalChannel || 'global');
            const ch = globalPrivate ? Echo.private(name) : Echo.channel(name);
            subs.push({ leave: () => Echo.leave(name) });
            ch.listen('.global.announcement', (e: any) => {
                const data = e || {};
                const persist = Boolean((data as any)?.persist);
                const shouldAdd = persist || includeAnnouncements;
                if (shouldAdd) {
                    if (persist) {
                        const k = keyOf(
                            data.title,
                            data.message,
                            data.action_url,
                        );
                        recent.set(k, nowMs());
                        cleanup();
                    }
                    add({
                        title: data.title,
                        message: data.message,
                        action_url: data.action_url,
                        meta: {
                            ...(data.meta || {}),
                            scope: 'global',
                            persist,
                        },
                        created_at: new Date().toISOString(),
                    });
                    playNotificationSound();
                }
                try {
                    toast(String(data.title || 'Announcement'), {
                        description: String(data.message || ''),
                        action: data.action_url
                            ? {
                                  label: 'Open',
                                  onClick: () =>
                                      window.location.assign(
                                          String(data.action_url),
                                      ),
                              }
                            : undefined,
                    });
                    showWebNotification(
                        String(data.title || 'Announcement'),
                        String(data.message || ''),
                        data.action_url,
                    );
                } catch {}
            });
            try {
                ch.subscribed?.(() =>
                    console.info('[Echo] Subscribed global channel', name),
                );
            } catch {}
        } catch {}

        return () => {
            try {
                subs.forEach((s) => s.leave());
            } catch {}
        };
        // We intentionally only bind once per mount; pass stable params to re-init if needed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.userId]);
}
