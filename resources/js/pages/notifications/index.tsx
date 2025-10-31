import { Head, router, usePage } from '@inertiajs/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useNotificationsActions } from '@/hooks/use-notifications';
import { AppLayout } from '@/layouts';
import NotificationsActionsBar from '@/pages/notifications/components/actions-bar';
import NotificationItemRow from '@/pages/notifications/components/notification-item-row';
import NotificationsPagination from '@/pages/notifications/components/pagination';
import NotificationDetailDialog from '@/pages/notifications/dialogs/detail-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    NotificationItem,
    useNotificationsStore,
} from '@/stores/notifications';

type Paginator<T> = {
    data: T[];
    links: {
        first?: string | null;
        last?: string | null;
        prev?: string | null;
        next?: string | null;
    };
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

type ServerItem = {
    id: string;
    data: {
        title: unknown;
        message: unknown;
        action_url?: string | null;
        meta?: unknown;
        created_at?: string;
    };
    read_at?: string | null;
    created_at?: string;
};

type Props = {
    page: Paginator<ServerItem>;
    filter: 'unread' | 'all';
    unreadCount: number;
};

export default function NotificationsIndex({
    page,
    filter,
    unreadCount,
}: Props) {
    const { t } = useTranslation(['notifications', 'common']);
    const { url } = usePage();
    const {
        items,
        unreadCount: unreadInStore,
        syncFromServer,
    } = useNotificationsStore();
    const { markRead, markAllRead } = useNotificationsActions();
    const markReadLocal = useNotificationsStore((s) => s.markRead);

    React.useEffect(() => {
        const mapped: NotificationItem[] = (page?.data || []).map((n) => {
            const d = n.data as Record<string, unknown>;
            const titleVal =
                (typeof d.title === 'string' && d.title) ||
                (d.title && typeof d.title === 'object'
                    ? (d.title as Record<string, unknown>)
                    : 'Notification');
            const messageVal =
                (typeof d.message === 'string' && d.message) ||
                (d.message && typeof d.message === 'object'
                    ? (d.message as Record<string, unknown>)
                    : '');
            return {
                id: n.id,
                title: titleVal,
                message: messageVal,
                action_url:
                    (typeof d.action_url === 'string' && d.action_url) ||
                    (typeof (d as { url?: unknown }).url === 'string' &&
                        (d as { url?: string }).url) ||
                    undefined,
                meta: (d.meta as Record<string, unknown>) || undefined,
                created_at:
                    (typeof d.created_at === 'string' && d.created_at) ||
                    n.created_at,
                read_at: n.read_at || null,
            };
        });
        syncFromServer(mapped, unreadCount);
    }, [page, unreadCount, syncFromServer]);

    const [markingAll, setMarkingAll] = React.useState(false);
    const [confirmAllOpen, setConfirmAllOpen] = React.useState(false);
    const onMarkAll = () => setConfirmAllOpen(true);
    const confirmMarkAll = () => {
        setMarkingAll(true);
        void markAllRead().finally(() => {
            setMarkingAll(false);
            setConfirmAllOpen(false);
        });
    };

    const switchFilter = (f: 'unread' | 'all') => {
        const url = route('notifications.index', { filter: f });
        router.visit(url, { preserveScroll: true });
    };

    const p = page?.meta || { current_page: 1, last_page: 1 };

    const actions = (
        <NotificationsActionsBar
            filter={filter}
            unreadCount={unreadInStore}
            markingAll={markingAll}
            onFilterChange={switchFilter}
            onMarkAll={onMarkAll}
        />
    );

    // truncation handled in NotificationItemRow

    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<NotificationItem | null>(
        null,
    );
    const openTokenRef = React.useRef<string | null>(null);
    const getOpenIdFromUrl = React.useCallback((): string | null => {
        try {
            // Prefer Inertia's page url if available
            const href = typeof url === 'string' ? new URL(url, window.location.origin).toString() : window.location.href;
            const u = new URL(href, window.location.origin);
            const p = u.searchParams.get('open');
            return p && p.length ? p : null;
        } catch {
            try {
                const u = new URL(window.location.href);
                const p = u.searchParams.get('open');
                return p && p.length ? p : null;
            } catch {
                return null;
            }
        }
    }, [url]);
    const clearOpenParam = React.useCallback(() => {
        try {
            const u = new URL(window.location.href);
            u.searchParams.delete('open');
            window.history.replaceState({}, '', u.toString());
        } catch {
            // ignore
        }
    }, []);
    const openDetail = (n: NotificationItem) => {
        // If text-only (no link), mark as read immediately
        try {
            const hasUrl = typeof n.action_url === 'string' && n.action_url.length > 0;
            if (!hasUrl && n.id && !n.read_at) {
                markReadLocal(n.id);
                void markRead(n.id);
            }
        } catch {
            // ignore
        }
        setSelected(n);
        setOpen(true);
    };

    // Auto-open detail from query param `open=<id>` (used by toast text-only clicks)
    React.useEffect(() => {
        const id = getOpenIdFromUrl();
        if (!id || openTokenRef.current === id) return;
        if (!items || items.length === 0) return;
        const n = items.find((it) => it.id === id);
        if (!n) return;
        openTokenRef.current = id;
        openDetail(n);
        clearOpenParam();
    }, [items, getOpenIdFromUrl, clearOpenParam]);

    const displayItems = React.useMemo(() => {
        // Show only persisted items (with id). Apply filter locally for reliability.
        const persisted = items.filter((n) => Boolean(n.id));
        return filter === 'unread'
            ? persisted.filter((n) => !n.read_at)
            : persisted;
    }, [items, filter]);

    return (
        <AppLayout
            pageTitle={t('notifications.title', 'Notifications')}
            pageDescription={t(
                'notifications.desc',
                'Your latest updates and alerts',
            )}
            actions={actions}
        >
            <Head title={t('notifications.title', 'Notifications')} />

            <div className="space-y-4">
                <div className="divide-y rounded-md border">
                    {displayItems.length === 0 && (
                        <div className="text-muted-foreground p-6 text-center text-sm">
                            {t('notifications.empty', 'No notifications')}
                        </div>
                    )}
                    {displayItems.map((n) => (
                        <NotificationItemRow
                            key={
                                n.id || n.created_at || Math.random().toString()
                            }
                            item={n}
                            onOpen={openDetail}
                        />
                    ))}
                </div>

                <NotificationsPagination
                    current={p.current_page}
                    last={p.last_page}
                    total={page?.meta?.total ?? 0}
                    prev={page?.links?.prev}
                    next={page?.links?.next}
                />
            </div>

            <NotificationDetailDialog
                item={selected}
                open={open}
                onOpenChange={setOpen}
                onMarkRead={markRead}
            />

            {/* Confirm mark all read */}
            <AlertConfirmMarkAll
                open={confirmAllOpen}
                onOpenChange={setConfirmAllOpen}
                onConfirm={confirmMarkAll}
                busy={markingAll}
            />
        </AppLayout>
    );
}

function AlertConfirmMarkAll({
    open,
    onOpenChange,
    onConfirm,
    busy,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onConfirm: () => void;
    busy?: boolean;
}) {
    const { t } = useTranslation(['notifications', 'common']);
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('notifications.mark_all', 'Mark all as read')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            'notifications.mark_all_confirm',
                            'Mark all notifications as read? This cannot be undone.',
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {t('common.cancel', 'Cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={busy}>
                        {t('notifications.mark_all', 'Mark all as read')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
