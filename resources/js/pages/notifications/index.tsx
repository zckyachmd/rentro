import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/layouts';
import {
    NotificationItem,
    useNotificationsStore,
} from '@/stores/notifications';
import { Head, router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const {
        items,
        unreadCount: unreadInStore,
        syncFromServer,
        markRead,
        markAllRead,
    } = useNotificationsStore();

    // Hydrate store from server response
    React.useEffect(() => {
        const mapped: NotificationItem[] = (page?.data || []).map((n) => ({
            id: n.id,
            title: (n.data as any)?.title ?? 'Notification',
            message: (n.data as any)?.message ?? '',
            action_url:
                (n.data as any)?.action_url ?? (n.data as any)?.url ?? undefined,
            meta: (n.data as any)?.meta || undefined,
            created_at: (n.data as any)?.created_at || n.created_at,
            read_at: n.read_at || null,
        }));
        syncFromServer(mapped, unreadCount);
    }, [page, unreadCount, syncFromServer]);

    const onMarkRead = (id: string) => {
        router.visit(route('notifications.read', { id }), {
            method: 'put',
            preserveScroll: true,
            onSuccess: () => markRead(id),
        });
    };

    const [markingAll, setMarkingAll] = React.useState(false);
    const onMarkAll = () => {
        if (!confirm(t('common.confirm', 'Are you sure?'))) return;
        setMarkingAll(true);
        router.visit(route('notifications.read_all'), {
            method: 'put',
            preserveScroll: true,
            onSuccess: () => markAllRead(),
            onFinish: () => setMarkingAll(false),
        });
    };

    const switchFilter = (f: 'unread' | 'all') => {
        const url = route('notifications.index', { filter: f });
        router.visit(url, { preserveScroll: true });
    };

    const p = page?.meta || { current_page: 1, last_page: 1 };

    return (
        <AppLayout
            pageTitle={t('notifications.title', 'Notifications')}
            pageDescription={t(
                'notifications.desc',
                'Your latest updates and alerts',
            )}
        >
            <Head title={t('notifications.title', 'Notifications')} />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle className="text-base md:text-lg">
                        {t('notifications.title', 'Notifications')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant={
                                filter === 'unread' ? 'default' : 'outline'
                            }
                            onClick={() => switchFilter('unread')}
                        >
                            {t('notifications.unread', 'Unread')}
                            <Badge className="ml-2">{unreadInStore}</Badge>
                        </Button>
                        <Button
                            size="sm"
                            variant={filter === 'all' ? 'default' : 'outline'}
                            onClick={() => switchFilter('all')}
                        >
                            {t('notifications.all', 'All')}
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={onMarkAll}
                            disabled={!unreadInStore || markingAll}
                        >
                            {markingAll ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t(
                                        'notifications.marking_all',
                                        'Marking...',
                                    )}
                                </span>
                            ) : (
                                t('notifications.mark_all', 'Mark all as read')
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="divide-y rounded-md border">
                        {items.length === 0 && (
                            <div className="text-muted-foreground p-6 text-center text-sm">
                                {t('notifications.empty', 'No notifications')}
                            </div>
                        )}
                        {items.map((n) => (
                            <div
                                key={
                                    n.id ||
                                    n.created_at ||
                                    Math.random().toString()
                                }
                                className="flex items-start gap-3 p-4"
                            >
                                <div className="flex-1">
                                    <div className="text-sm font-medium">
                                        {typeof n.title === 'string'
                                            ? n.title
                                            : t(
                                                  'notifications.item',
                                                  'Notification',
                                              )}
                                        {!n.read_at && (
                                            <Badge className="ml-2">
                                                {t('notifications.new', 'New')}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                                        {typeof n.message === 'string'
                                            ? n.message
                                            : ''}
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-xs">
                                        {n.created_at
                                            ? new Date(
                                                  n.created_at,
                                              ).toLocaleString()
                                            : ''}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {n.action_url && (
                                        <Button size="sm" asChild>
                                            <a href={n.action_url}>
                                                {t(
                                                    'notifications.open',
                                                    'Open',
                                                )}
                                            </a>
                                        </Button>
                                    )}
                                    {n.id && !n.read_at && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onMarkRead(n.id!)}
                                        >
                                            {t(
                                                'notifications.mark_read',
                                                'Mark as read',
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-muted-foreground text-sm">
                            {t('notifications.page_info', 'Page')}{' '}
                            {p.current_page} {t('notifications.of', 'of')}{' '}
                            {p.last_page} ({page?.meta?.total ?? 0}{' '}
                            {t('notifications.total', 'total')})
                        </div>
                        <div className="flex gap-2">
                            {page?.links?.prev && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.visit(page.links.prev!)
                                    }
                                >
                                    {t('notifications.prev', 'Prev')}
                                </Button>
                            )}
                            {page?.links?.next && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.visit(page.links.next!)
                                    }
                                >
                                    {t('notifications.next', 'Next')}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
