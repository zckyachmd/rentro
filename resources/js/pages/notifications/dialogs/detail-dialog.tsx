import { router } from '@inertiajs/react';
import { Check, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatTimeAgo } from '@/lib/format';
import type { NotificationItem } from '@/stores/notifications';

const isExternal = (url: string | null | undefined) => {
    if (!url) return false;
    try {
        const u = new URL(url, window.location.origin);
        return u.origin !== window.location.origin;
    } catch {
        return false;
    }
};

export default function NotificationDetailDialog({
    item,
    open,
    onOpenChange,
    onMarkRead,
}: {
    item: NotificationItem | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onMarkRead: (id: string) => Promise<void> | void;
}) {
    const { t } = useTranslation(['notifications', 'common']);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {typeof item?.title === 'string'
                            ? item?.title
                            : t('notifications.title', 'Notifications')}
                    </DialogTitle>
                    <DialogDescription>
                        {item?.created_at ? (
                            <time
                                dateTime={item.created_at}
                                title={formatDate(item.created_at, true)}
                                className="text-muted-foreground text-xs"
                            >
                                {formatTimeAgo(item.created_at)}
                            </time>
                        ) : null}
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm whitespace-pre-wrap">
                    {typeof item?.message === 'string' ? item?.message : ''}
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                    {item?.action_url && isExternal(item.action_url) && (
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={item.action_url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {t('notifications.open', 'Open')}
                            </a>
                        </Button>
                    )}
                    {item?.action_url && !isExternal(item.action_url) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                onOpenChange(false);
                                router.visit(item!.action_url!);
                            }}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('notifications.open', 'Open')}
                        </Button>
                    )}
                    {item?.id && !item?.read_at && (
                        <Button
                            size="sm"
                            onClick={async () => {
                                await onMarkRead(item!.id!);
                                onOpenChange(false);
                            }}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            {t('notifications.mark_read', 'Mark as read')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
