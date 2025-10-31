import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getJson } from '@/lib/api';
import { playNotificationSound } from '@/lib/notify-sound';
import { showWebNotification } from '@/lib/web-notify';
import {
    useNotificationsStore,
    type NotificationItem,
} from '@/stores/notifications';

type Params = {
    userId?: number | string | null;
    roleIds?: Array<number | string> | null;
    globalChannel?: string; // default: 'global'
    globalPrivate?: boolean; // default: false
    systemChannel?: string; // default: 'system'
    includeAnnouncementsInBell?: boolean; // default: true
    enableSound?: boolean; // default: true
    minToastPriority?: 'low' | 'normal' | 'high'; // default: 'low'
    resyncIntervalMs?: number; // default: 120_000
    enabled?: boolean; // default: true
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
    const { t } = useTranslation(['notifications', 'enum']);
    const { upsert, syncFromServer } = useNotificationsStore();
    useEffect(() => {
        if (params.enabled === false) return;
        const Echo = (globalThis as { Echo?: EchoLike }).Echo;
        if (!Echo) return;

        const userId = params.userId ? String(params.userId) : undefined;
        const roleIds = (params.roleIds || []).map((r) => String(r));
        const globalChannel = params.globalChannel || 'global';
        const systemChannel = params.systemChannel || 'system';

        const subs: Array<{ leave: () => void }> = [];
        const includeAnnouncements = params.includeAnnouncementsInBell ?? true;
        const enableSound = params.enableSound ?? true;
        const minToastPriority = params.minToastPriority ?? 'low';
        const resyncIntervalMs = params.resyncIntervalMs ?? 120_000;

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
            if (toastBudget > 0) {
                toastBudget -= 1;
                return true;
            }
            return false;
        };

        type Summary = {
            unread: number;
            latest: Array<{
                id: string;
                data: {
                    title?: unknown;
                    message?: unknown;
                    action_url?: string | null;
                    meta?: unknown;
                    created_at?: string | null;
                };
                read_at?: string | null;
                created_at?: string | null;
            }>;
        };
        const resyncOnce = async () => {
            try {
                const url = route('notifications.summary');
                const json = await getJson<Summary>(url);
                const parseMaybeJson = (v: unknown) => {
                    if (typeof v === 'string') {
                        const s = v.trim();
                        if (s.startsWith('{') && s.endsWith('}')) {
                            try {
                                const obj = JSON.parse(s) as Record<
                                    string,
                                    unknown
                                >;
                                if (obj && typeof obj === 'object') return obj;
                            } catch {
                                /* noop */
                            }
                        }
                    }
                    return v;
                };
                const mapped: NotificationItem[] = (json.latest || []).map(
                    (n) => {
                        const d = n.data as Record<string, unknown>;
                        const tRaw = parseMaybeJson(d.title);
                        const mRaw = parseMaybeJson(d.message);
                        const titleVal =
                            (typeof tRaw === 'string' && tRaw) ||
                            (tRaw && typeof tRaw === 'object'
                                ? (tRaw as Record<string, unknown>)
                                : 'Notification');
                        const messageVal =
                            (typeof mRaw === 'string' && mRaw) ||
                            (mRaw && typeof mRaw === 'object'
                                ? (mRaw as Record<string, unknown>)
                                : '');
                        return {
                            id: n.id,
                            title: titleVal,
                            message: messageVal,
                            action_url:
                                (typeof d.action_url === 'string' &&
                                    d.action_url) ||
                                (typeof (d as { url?: unknown }).url ===
                                    'string' &&
                                    (d as { url?: string }).url) ||
                                undefined,
                            meta:
                                (d.meta as Record<string, unknown>) ||
                                undefined,
                            created_at:
                                (typeof d.created_at === 'string' &&
                                    d.created_at) ||
                                n.created_at ||
                                undefined,
                            read_at: n.read_at || null,
                        };
                    },
                );
                syncFromServer(mapped, Number(json.unread || 0));
            } catch {
                // ignore
            }
        };
        let resyncTimer: number | undefined;
        const scheduleResync = (delay = 1200) => {
            try {
                if (resyncTimer) clearTimeout(resyncTimer);
            } catch {
                void 0;
            }
            // @ts-expect-error browser setTimeout returns number
            resyncTimer = setTimeout(resyncOnce, delay);
        };

        void resyncOnce();

        if (userId) {
            try {
                const name = `user.${userId}`;
                const ch = Echo.private(name);
                subs.push({ leave: () => Echo.leave(name) });

                const handlePersonal = (e: unknown) => {
                    const data = (e || {}) as Record<string, unknown>;
                    const hasAny = (v: unknown) =>
                        (typeof v === 'string' && v.trim().length > 0) ||
                        (v !== null && typeof v === 'object');
                    if (
                        !hasAny((data as { title?: unknown }).title) &&
                        !hasAny((data as { message?: unknown }).message)
                    ) {
                        return;
                    }
                    const parseMaybeJson = (v: unknown) => {
                        if (typeof v === 'string') {
                            const s = v.trim();
                            if (s.startsWith('{') && s.endsWith('}')) {
                                try {
                                    const obj = JSON.parse(s) as Record<
                                        string,
                                        unknown
                                    >;
                                    if (obj && typeof obj === 'object')
                                        return obj;
                                } catch {
                                    /* noop */
                                }
                            }
                        }
                        return v;
                    };
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
                    const titleParsed = parseMaybeJson(title);
                    const messageParsed = parseMaybeJson(message);
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
                            data.notification as
                                | Record<string, unknown>
                                | undefined
                        )?.id === 'string'
                    ) {
                        id = (data.notification as { id: string }).id;
                    }
                    if (id && seenIds.has(id)) return;
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
                        typeof titleParsed === 'string'
                            ? titleParsed
                            : titleParsed && typeof titleParsed === 'object'
                              ? (titleParsed as Record<string, unknown>)
                              : String(titleParsed ?? '');
                    const messageVal: string | Record<string, unknown> =
                        typeof messageParsed === 'string'
                            ? messageParsed
                            : messageParsed && typeof messageParsed === 'object'
                              ? (messageParsed as Record<string, unknown>)
                              : String(messageParsed ?? '');
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
                    const renderPersonal = (val: unknown): string => {
                        if (typeof val === 'string') {
                            if (val.startsWith('notifications.')) {
                                const tr = t(val, { ns: 'notifications' });
                                return tr && tr !== val ? tr : val;
                            }
                            return val;
                        }
                        if (val && typeof val === 'object') {
                            const key = (val as { key?: unknown }).key;
                            const params = (val as { params?: unknown }).params;
                            const p: Record<string, unknown> =
                                params && typeof params === 'object'
                                    ? (params as Record<string, unknown>)
                                    : {};
                            if (
                                typeof p.status === 'string' &&
                                typeof (p as { status_label?: unknown })
                                    .status_label !== 'string'
                            ) {
                                p.status_label = t(
                                    `testimony_status.${String(p.status)}`,
                                    { ns: 'enum' },
                                );
                            }
                            return typeof key === 'string'
                                ? t(String(key), p as Record<string, string>)
                                : '';
                        }
                        return '';
                    };
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
                            toast(
                                renderPersonal(title || 'Notification') ||
                                    'Notification',
                                {
                                    description:
                                        renderPersonal(message || '') || '',
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
                                },
                            );
                        if (allowToast)
                            showWebNotification(
                                renderPersonal(title || 'Notification') ||
                                    'Notification',
                                renderPersonal(message || '') || '',
                                actionUrlStr,
                            );
                    } catch {
                        /* noop */
                    }
                };

                // Laravel Notification sugar: deliver via `notification()`
                try {
                    (
                        ch as unknown as {
                            notification?: (
                                cb: (payload: unknown) => void,
                            ) => void;
                        }
                    ).notification?.(handlePersonal);
                } catch {
                    /* noop */
                }
                ch.listen?.('.user.notification', (p: unknown) =>
                    handlePersonal(p),
                );
                ch.listen?.(
                    '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
                    (p: unknown) => handlePersonal(p),
                );
                try {
                    (
                        ch as { subscribed?: (cb: () => void) => void }
                    ).subscribed?.(() => scheduleResync(1000));
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
                    const hasAny = (v: unknown) =>
                        (typeof v === 'string' && v.trim().length > 0) ||
                        (v !== null && typeof v === 'object');
                    if (
                        !hasAny((data as { title?: unknown }).title) &&
                        !hasAny((data as { message?: unknown }).message)
                    ) {
                        return;
                    }
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
                            title:
                                ((data as { title?: unknown }).title as
                                    | string
                                    | Record<string, unknown>) ?? '',
                            message:
                                ((data as { message?: unknown }).message as
                                    | string
                                    | Record<string, unknown>) ?? '',
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
                    const render = (val: unknown): string => {
                        if (typeof val === 'string') return val;
                        if (val && typeof val === 'object') {
                            const key = (val as { key?: unknown }).key;
                            const params = (val as { params?: unknown }).params;
                            const p: Record<string, unknown> =
                                params && typeof params === 'object'
                                    ? (params as Record<string, unknown>)
                                    : {};
                            if (
                                typeof p.status === 'string' &&
                                typeof (p as { status_label?: unknown })
                                    .status_label !== 'string'
                            ) {
                                p.status_label = t(
                                    `testimony_status.${String(p.status)}`,
                                    { ns: 'enum' },
                                );
                            }
                            return typeof key === 'string'
                                ? t(String(key), p as Record<string, string>)
                                : '';
                        }
                        return '';
                    };
                    try {
                        const pr = String(
                            (data as { meta?: { priority?: unknown } }).meta
                                ?.priority || 'normal',
                        ) as 'low' | 'normal' | 'high';
                        const allowToast =
                            minToastPriority === 'low' ||
                            (minToastPriority === 'normal' && pr !== 'low') ||
                            (minToastPriority === 'high' && pr === 'high');
                        if (allowToast && canToast())
                            toast(
                                render(
                                    (data as { title?: unknown }).title ||
                                        'Announcement',
                                ) || 'Announcement',
                                {
                                    description:
                                        render(
                                            (data as { message?: unknown })
                                                .message || '',
                                        ) || '',
                                    action: (
                                        data as { action_url?: string | null }
                                    ).action_url
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
                        if (allowToast)
                            showWebNotification(
                                render(
                                    (data as { title?: unknown }).title ||
                                        'Announcement',
                                ) || 'Announcement',
                                render(
                                    (data as { message?: unknown }).message ||
                                        '',
                                ) || '',
                                (data as { action_url?: string | null })
                                    .action_url,
                            );
                    } catch {
                        /* noop */
                    }
                });
                try {
                    ch.subscribed?.(() => scheduleResync(1000));
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
            const isPrivate = Boolean(params.globalPrivate);
            const ch = isPrivate ? Echo.private(name) : Echo.channel(name);
            subs.push({ leave: () => Echo.leave(name) });
            const onGlobal = (e: unknown) => {
                const data = (e || {}) as Record<string, unknown>;
                const hasAny = (v: unknown) =>
                    (typeof v === 'string' && v.trim().length > 0) ||
                    (v !== null && typeof v === 'object');
                if (
                    !hasAny((data as { title?: unknown }).title) &&
                    !hasAny((data as { message?: unknown }).message)
                ) {
                    return;
                }
                const persist = Boolean(
                    (data as Record<string, unknown>)?.persist,
                );
                const render = (val: unknown): string => {
                    if (typeof val === 'string') return val;
                    if (val && typeof val === 'object') {
                        const key = (val as { key?: unknown }).key;
                        const params = (val as { params?: unknown }).params;
                        const p: Record<string, unknown> =
                            params && typeof params === 'object'
                                ? (params as Record<string, unknown>)
                                : {};
                        if (
                            typeof p.status === 'string' &&
                            typeof (p as { status_label?: unknown })
                                .status_label !== 'string'
                        ) {
                            p.status_label = t(
                                `testimony_status.${String(p.status)}`,
                                { ns: 'enum' },
                            );
                        }
                        return typeof key === 'string'
                            ? t(String(key), p as Record<string, string>)
                            : '';
                    }
                    return '';
                };
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
                        title:
                            ((data as { title?: unknown }).title as
                                | string
                                | Record<string, unknown>) ?? '',
                        message:
                            ((data as { message?: unknown }).message as
                                | string
                                | Record<string, unknown>) ?? '',
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
                    if (allowToast && canToast())
                        toast(
                            render(
                                (data as { title?: unknown }).title ||
                                    'Announcement',
                            ) || 'Announcement',
                            {
                                description:
                                    render(
                                        (data as { message?: unknown })
                                            .message || '',
                                    ) || '',
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
                    if (allowToast)
                        showWebNotification(
                            render(
                                (data as { title?: unknown }).title ||
                                    'Announcement',
                            ) || 'Announcement',
                            render(
                                (data as { message?: unknown }).message || '',
                            ) || '',
                            (data as { action_url?: string | null }).action_url,
                        );
                } catch {
                    /* noop */
                }
            };
            ch.listen?.('.global.announcement', onGlobal);
            try {
                ch.subscribed?.(() => scheduleResync(1200));
            } catch {
                /* noop */
            }
        } catch {
            /* noop */
        }

        // System notifications: private channel for authenticated users
        try {
            const name = String(systemChannel || 'system');
            const chSys = Echo.private(name);
            subs.push({ leave: () => Echo.leave(name) });
            const onSystem = (e: unknown) => {
                const data = (e || {}) as Record<string, unknown>;
                const titleStr = String(
                    (data as { title?: unknown }).title ?? '',
                ).trim();
                const msgStr = String(
                    (data as { message?: unknown }).message ?? '',
                ).trim();
                if (!titleStr && !msgStr) return;
                upsert({
                    title: titleStr || 'System',
                    message: msgStr,
                    action_url: (data as { action_url?: string | null })
                        .action_url,
                    meta: {
                        ...(((data as { meta?: unknown }).meta as Record<
                            string,
                            unknown
                        >) || {}),
                        scope: 'system',
                    },
                    created_at: new Date().toISOString(),
                });
                if (enableSound) playNotificationSound();
                scheduleResync(600);
            };
            chSys.listen?.('.system.notification', onSystem);
            try {
                chSys.subscribed?.(() => scheduleResync(800));
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
            } catch {
                void 0;
            }
        }, resyncIntervalMs);

        return () => {
            try {
                subs.forEach((s) => s.leave());
            } catch {
                void 0;
            }
            try {
                clearInterval(intervalId);
            } catch {
                void 0;
            }
        };
        // We intentionally only bind once per mount; pass stable params to re-init if needed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.userId]);
}
