import { Head, router } from '@inertiajs/react';
import { Bell, BellDot, Check, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// no Card wrapper to avoid duplicate containers
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AppLayout } from '@/layouts';
import { formatDate, formatTimeAgo } from '@/lib/format';
import { NotificationItem, useNotificationsStore } from '@/stores/notifications';
import { useNotificationsActions } from '@/hooks/use-notifications';

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

export default function NotificationsIndex({ page, filter, unreadCount }: Props) {
    const { t } = useTranslation(['notifications', 'common']);
    const { items, unreadCount: unreadInStore, syncFromServer } =
        useNotificationsStore();
    const { markRead, markAllRead } = useNotificationsActions();

    // Hydrate store from server response
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

    const onMarkRead = (id: string) => {
        void markRead(id);
    };

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

    const isExternal = (url: string | null | undefined) => {
        if (!url) return false;
        try {
            const u = new URL(url, window.location.origin);
            return u.origin !== window.location.origin;
        } catch {
            return false;
        }
    };

    const actions = (
        <div className="flex items-center gap-2">
            <ToggleGroup
                type="single"
                value={filter}
                onValueChange={(v) => v && switchFilter(v as 'unread' | 'all')}
                size="sm"
                variant="outline"
                aria-label={t('common.filter', 'Filter')}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem value="all" aria-label={t('notifications.all', 'All')}>
                            <Bell className="h-4 w-4" />
                        </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>{t('notifications.all', 'All')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem
                            value="unread"
                            aria-label={t('notifications.unread', 'Unread')}
                        >
                            <BellDot className="h-4 w-4" />
                        </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('notifications.unread', 'Unread')}
                    </TooltipContent>
                </Tooltip>
            </ToggleGroup>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={onMarkAll}
                            disabled={!unreadInStore || markingAll}
                            aria-label={t('notifications.mark_all', 'Mark all as read')}
                            className="h-8 w-8"
                        >
                            {markingAll ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCheck className="h-4 w-4" />
                            )}
                        </Button>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    {markingAll
                        ? t('notifications.marking_all', 'Marking...')
                        : t('notifications.mark_all', 'Mark all as read')}
                </TooltipContent>
            </Tooltip>
        </div>
    );

    // Truncation thresholds for list view
    const TITLE_MAX = 60;
    const MESSAGE_MAX = 120;

    // Detail modal state
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
            pageDescription={t('notifications.desc', 'Your latest updates and alerts')}
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
                            <div
                                key={
                                    n.id ||
                                    n.created_at ||
                                    Math.random().toString()
                                }
                                role="button"
                                tabIndex={0}
                                onClick={() => openDetail(n)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        openDetail(n);
                                    }
                                }}
                                className="flex cursor-pointer items-start gap-3 p-4 hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
                            >
                                <div className="flex-1">
                                    <div className="text-sm font-medium">
                                        {(() => {
                                            const tstr =
                                                typeof n.title === 'string'
                                                    ? n.title
                                                    : t(
                                                          'notifications.title',
                                                          'Notifications',
                                                      );
                                            return tstr.length > TITLE_MAX
                                                ? `${tstr
                                                      .slice(0, TITLE_MAX)
                                                      .trimEnd()}...`
                                                : tstr;
                                        })()}
                                        {!n.read_at && (
                                            <Badge className="ml-2">
                                                {t('notifications.new', 'New')}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                                        {(() => {
                                            const mstr =
                                                typeof n.message === 'string'
                                                    ? n.message
                                                    : '';
                                            return mstr.length > MESSAGE_MAX
                                                ? `${mstr
                                                      .slice(0, MESSAGE_MAX)
                                                      .trimEnd()}...`
                                                : mstr;
                                        })()}
                                    </div>
                                    <time
                                        dateTime={n.created_at || undefined}
                                        title={formatDate(n.created_at, true)}
                                        className="text-muted-foreground mt-1 text-xs"
                                    >
                                        {formatTimeAgo(n.created_at)}
                                    </time>
                                </div>
                                {/* List actions removed; click row to view detail */}
                            </div>
                        ))}
                </div>

                <div className="flex items-center justify-between">
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
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {typeof selected?.title === 'string'
                                ? selected?.title
                                : t('notifications.title', 'Notifications')}
                        </DialogTitle>
                        <DialogDescription>
                            {selected?.created_at ? (
                                <time
                                    dateTime={selected.created_at}
                                    title={formatDate(selected.created_at, true)}
                                    className="text-muted-foreground text-xs"
                                >
                                    {formatTimeAgo(selected.created_at)}
                                </time>
                            ) : null}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="whitespace-pre-wrap text-sm">
                        {typeof selected?.message === 'string'
                            ? selected?.message
                            : ''}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        {selected?.action_url && isExternal(selected.action_url) && (
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href={selected.action_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t('notifications.open', 'Open')}
                                </a>
                            </Button>
                        )}
                        {selected?.action_url && !isExternal(selected.action_url) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setOpen(false);
                                    router.visit(selected!.action_url!);
                                }}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {t('notifications.open', 'Open')}
                            </Button>
                        )}
                        {selected?.id && !selected?.read_at && (
                            <Button
                                size="sm"
                                onClick={async () => {
                                    await markRead(selected!.id!);
                                    setOpen(false);
                                }}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                {t('notifications.mark_read', 'Mark as read')}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
