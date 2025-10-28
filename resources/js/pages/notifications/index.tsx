import { Head, router } from '@inertiajs/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useNotificationsActions } from '@/hooks/use-notifications';
import { AppLayout } from '@/layouts';
import NotificationsActionsBar from '@/pages/notifications/components/actions-bar';
import NotificationItemRow from '@/pages/notifications/components/notification-item-row';
import NotificationsPagination from '@/pages/notifications/components/pagination';
import NotificationDetailDialog from '@/pages/notifications/dialogs/detail-dialog';
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
    const {
        items,
        unreadCount: unreadInStore,
        syncFromServer,
    } = useNotificationsStore();
    const { markRead, markAllRead } = useNotificationsActions();

    React.useEffect(() => {
        const mapped: NotificationItem[] = (page?.data || []).map((n) => {
            const d = n.data as Record<string, unknown>;
            return {
                id: n.id,
                title:
                    (typeof d.title === 'string' && d.title) || 'Notification',
                message: (typeof d.message === 'string' && d.message) || '',
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
    const onMarkAll = () => {
        if (!confirm(t('common.confirm', 'Are you sure?'))) return;
        setMarkingAll(true);
        void markAllRead().finally(() => setMarkingAll(false));
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
    const openDetail = (n: NotificationItem) => {
        setSelected(n);
        setOpen(true);
    };

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
                    {items.length === 0 && (
                        <div className="text-muted-foreground p-6 text-center text-sm">
                            {t('notifications.empty', 'No notifications')}
                        </div>
                    )}
                    {items.map((n) => (
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
        </AppLayout>
    );
}
