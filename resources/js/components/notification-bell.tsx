import { router } from '@inertiajs/react';
import { Bell, InfoIcon, TriangleAlertIcon, CircleCheckIcon } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useNotificationsActions } from '@/hooks/use-notifications';
import { formatDate, formatTimeAgo } from '@/lib/format';
import NotificationDetailDialog from '@/pages/notifications/dialogs/detail-dialog';
import type { NotificationItem } from '@/stores/notifications';
import { useNotificationsStore } from '@/stores/notifications';

const TITLE_MAX_CHARS = 30;
const MESSAGE_MAX_CHARS = 50;
const PANEL_MIN_HEIGHT = '20rem';
const PANEL_MAX_HEIGHT = '28rem';
const MAX_VISIBLE_ITEMS = 10;

/**
 * NotificationBell: Bell icon with unread badge and recent items dropdown.
 * Integrate into your header/navbar and ensure useRealtimeNotifications hook
 * is mounted in a top-level layout to receive events.
 */
export function NotificationBell() {
    const { items, unreadCount } = useNotificationsStore();
    const markReadLocal = useNotificationsStore((s) => s.markRead);
    const { markRead: persistMarkRead } = useNotificationsActions();
    const { t } = useTranslation(['notifications', 'common', 'nav']);
    const { t: tEnum } = useTranslation('enum');
    const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
    const LS_FILTER_KEY = 'rentro:notifications:bell:filter';

    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_FILTER_KEY);
            if (raw === 'all' || raw === 'unread') setFilter(raw);
        } catch {
            /* ignore */
        }
    }, []);

    React.useEffect(() => {
        try {
            localStorage.setItem(LS_FILTER_KEY, filter);
        } catch {
            /* ignore */
        }
    }, [filter]);

    const isExternal = (url: string) => {
        try {
            const u = new URL(url, window.location.origin);
            return u.origin !== window.location.origin;
        } catch {
            return false;
        }
    };

    const navigateSpa = React.useCallback((url: string) => {
        try {
            const curr = new URL(window.location.href);
            const target = new URL(url, window.location.origin);
            const same =
                curr.pathname === target.pathname && curr.search === target.search;
            if (same) {
                router.visit(target.toString(), {
                    replace: true,
                    preserveScroll: true,
                    preserveState: true,
                });
            } else {
                router.visit(target.toString());
            }
        } catch {
            window.location.assign(url);
        }
    }, []);

    const goToIndex = () => router.visit(route('notifications.index'));

    const [menuOpen, setMenuOpen] = React.useState(false);
    const markedThisOpenRef = React.useRef(false);
    const [detail, setDetail] = React.useState<{
        open: boolean;
        item: NotificationItem | null;
    }>({ open: false, item: null });

    return (
        <DropdownMenu
            open={menuOpen}
            onOpenChange={(o) => {
                setMenuOpen(o);
                if (o) {
                    // Mark visible (on-screen) unread items as read after a tiny delay
                    if (markedThisOpenRef.current) return;
                    markedThisOpenRef.current = true;
                    window.setTimeout(() => {
                        try {
                            const pool =
                                filter === 'unread'
                                    ? items.filter((n) => !n.read_at)
                                    : items;
                            const visible = pool.slice(0, MAX_VISIBLE_ITEMS);
                            const ids = visible
                                .filter((n) => n.id && !n.read_at)
                                .map((n) => n.id!)
                                .slice(0, MAX_VISIBLE_ITEMS);
                            // Optimistic local mark, then persist to server
                            for (const id of ids) {
                                markReadLocal(id);
                                void persistMarkRead(id);
                            }
                        } catch {
                            // ignore
                        }
                    }, 450);
                } else {
                    markedThisOpenRef.current = false;
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={
                        unreadCount > 0
                            ? t(
                                  'notifications.unread_count',
                                  '{{count}} belum dibaca',
                                  {
                                      count: unreadCount,
                                  },
                              )
                            : t('nav.notifications.label', 'Notifikasi')
                    }
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">
                        {t('nav.notifications.label', 'Notifikasi')}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="flex w-96 flex-col !overflow-hidden p-0 bg-popover/85 backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl border border-border/50 ring-1 ring-black/5 dark:ring-white/5 shadow-md"
                style={{
                    height: `min(${PANEL_MAX_HEIGHT}, var(--radix-dropdown-menu-content-available-height))`,
                    minHeight: PANEL_MIN_HEIGHT,
                }}
            >
                <DropdownMenuLabel className="bg-popover/80 z-10 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                            {t('nav.notifications.label', 'Notifikasi')}
                        </span>
                        {unreadCount > 0 && (
                            <span className="text-muted-foreground text-xs">
                                {t(
                                    'notifications.unread_count',
                                    '{{count}} belum dibaca',
                                    { count: unreadCount },
                                )}
                            </span>
                        )}
                    </div>
                    <ToggleGroup
                        type="single"
                        value={filter}
                        onValueChange={(v) =>
                            v && setFilter(v as 'all' | 'unread')
                        }
                        size="sm"
                        variant="outline"
                        aria-label="Filter notifikasi"
                    >
                        <ToggleGroupItem
                            value="all"
                            aria-label={t('common.all', 'Semua')}
                        >
                            {t('common.all', 'Semua')}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="unread"
                            aria-label={t(
                                'notifications.unread',
                                'Belum dibaca',
                            )}
                        >
                            {t('notifications.unread', 'Belum dibaca')}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </DropdownMenuLabel>

                <ScrollArea className="min-h-0 flex-1">
                    {(() => {
                        const filtered =
                            filter === 'all'
                                ? items
                                : items.filter((n) => !n.read_at);
                        const visible = filtered.slice(0, MAX_VISIBLE_ITEMS);
                        if (visible.length === 0) {
                            return (
                                <div className="text-muted-foreground flex min-h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center text-sm">
                                    <div className="rounded-full border p-2">
                                        <Bell className="h-6 w-6 opacity-70" />
                                    </div>
                                    <p>
                                        {t(
                                            'nav.notifications.empty',
                                            'Belum ada notifikasi.',
                                        )}
                                    </p>
                                </div>
                            );
                        }
                        const renderText = (
                            val: string | Record<string, unknown>,
                            fallback = '',
                        ): string => {
                            if (typeof val === 'string') {
                                if (val.startsWith('notifications.')) {
                                    const tr = t(val);
                                    return (
                                        (tr && tr !== val ? tr : val) ||
                                        fallback
                                    );
                                }
                                return val || fallback;
                            }
                            const key =
                                typeof (val as { key?: unknown }).key ===
                                'string'
                                    ? (val as { key: string }).key
                                    : undefined;
                            const params = (val as { params?: unknown }).params;
                            const p = (
                                params && typeof params === 'object'
                                    ? (params as Record<string, unknown>)
                                    : {}
                            ) as Record<string, unknown>;
                            if (
                                typeof p.status === 'string' &&
                                typeof (p as { status_label?: unknown })
                                    .status_label !== 'string'
                            ) {
                                const lbl = tEnum(
                                    `testimony_status.${p.status}`,
                                );
                                if (lbl) p.status_label = lbl;
                            }
                            return key
                                ? t(key, p as Record<string, string>)
                                : fallback;
                        };

                        return (
                            <ul className="py-0">
                                {visible.map((n, idx) => {
                                    const key = `${n.id || 'idx'}:${idx}`;
                                    const isUnread =
                                        !('read_at' in n) || !n.read_at;
                                    const rawTitle = renderText(
                                        n.title as
                                            | string
                                            | Record<string, unknown>,
                                        'Notifikasi',
                                    );
                                    const rawMessage = renderText(
                                        n.message as
                                            | string
                                            | Record<string, unknown>,
                                        '',
                                    );
                                    const title =
                                        rawTitle.length > TITLE_MAX_CHARS
                                            ? `${rawTitle
                                                  .slice(0, TITLE_MAX_CHARS)
                                                  .trimEnd()}...`
                                            : rawTitle;
                                    const message =
                                        rawMessage.length > MESSAGE_MAX_CHARS
                                            ? `${rawMessage
                                                  .slice(0, MESSAGE_MAX_CHARS)
                                                  .trimEnd()}...`
                                            : rawMessage;

                                    const handleClick = () => {
                                        const hasUrl =
                                            typeof n.action_url === 'string' &&
                                            n.action_url.length > 0;

                                        if (hasUrl) {
                                            if (n.id && !n.read_at) {
                                                markReadLocal(n.id);
                                                void persistMarkRead(n.id);
                                            }
                                            if (isExternal(n.action_url!)) {
                                                window.open(
                                                    n.action_url!,
                                                    '_blank',
                                                    'noopener,noreferrer',
                                                );
                                            } else {
                                                navigateSpa(n.action_url!);
                                            }
                                            return;
                                        }

                                        // No link: open detail dialog and mark as read
                                        if (n.id && !n.read_at) {
                                            markReadLocal(n.id);
                                            void persistMarkRead(n.id);
                                        }
                                        setMenuOpen(false);
                                        setDetail({
                                            open: true,
                                            item: n as NotificationItem,
                                        });
                                    };

                                    // Accent choice based on priority meta
                                    const priority = String(
                                        (n.meta as { priority?: unknown } | null)?.priority ?? 'normal'
                                    ) as 'low' | 'normal' | 'high';
                                    const icon = (
                                        priority === 'high' ? (
                                            <TriangleAlertIcon className="size-4" />
                                        ) : priority === 'low' ? (
                                            <CircleCheckIcon className="size-4" />
                                        ) : (
                                            <InfoIcon className="size-4" />
                                        )
                                    );

                                    const iconClass = [
                                        'relative flex size-8 items-center justify-center rounded-full ring-1 transition-all select-none',
                                        isUnread
                                            ? (
                                                  priority === 'high'
                                                      ? 'bg-gradient-to-br from-amber-500/25 to-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/30 shadow-[0_2px_10px_-2px] shadow-amber-500/25'
                                                      : 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/30 shadow-[0_2px_10px_-2px] shadow-primary/20'
                                              )
                                            : 'bg-gradient-to-br from-background/80 to-background/60 text-muted-foreground ring-border/50',
                                    ].join(' ');

                                    return (
                                        <li key={key} className="px-1">
                                            <DropdownMenuItem
                                                className="group relative grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-md px-3 py-2.5 transition-all data-[highlighted]:bg-accent/60 hover:-translate-y-0.5"
                                                onClick={handleClick}
                                            >
                                                <div className="relative">
                                                    <div className={iconClass}>{icon}</div>
                                                    {isUnread && (
                                                        <span
                                                            aria-hidden
                                                            className="bg-primary/90 shadow-primary/20 pointer-events-none absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full shadow-[0_0_0_3px]"
                                                        />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="truncate text-sm leading-5 font-medium">
                                                            {title}
                                                        </div>
                                                    </div>
                                                    {message ? (
                                                        <p className="text-muted-foreground truncate text-xs">
                                                            {message}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <time
                                                    dateTime={n.created_at || undefined}
                                                    title={formatDate(n.created_at, true)}
                                                    className="text-muted-foreground flex-shrink-0 pt-0.5 text-[10px]"
                                                >
                                                    {formatTimeAgo(n.created_at)}
                                                </time>
                                            </DropdownMenuItem>
                                        </li>
                                    );
                                })}
                            </ul>
                        );
                    })()}
                </ScrollArea>

                <div className="bg-popover/80 border-t px-4 py-2 backdrop-blur">
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={goToIndex}
                    >
                        {t(
                            'nav.notifications.open_page',
                            'Buka halaman Notifikasi',
                        )}
                    </Button>
                </div>
            </DropdownMenuContent>

            <NotificationDetailDialog
                open={detail.open}
                item={detail.item}
                onOpenChange={(o) => setDetail((s) => ({ ...s, open: o }))}
                onMarkRead={(id) => {
                    markReadLocal(id);
                    void persistMarkRead(id);
                }}
            />
        </DropdownMenu>
    );
}
