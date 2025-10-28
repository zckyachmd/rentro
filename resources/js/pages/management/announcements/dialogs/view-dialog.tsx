import { router } from '@inertiajs/react';
import { ExternalLink, Globe, Send, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/format';

export type HistoryItem = {
    id: number;
    scope: 'global' | 'role';
    role_id?: number | null;
    role_name?: string | null;
    title: string;
    message?: string;
    action_url?: string | null;
    persist: boolean;
    scheduled_at?: string | null;
    sent_at?: string | null;
    status: string;
    created_at: string;
};

const isExternal = (url: string | null | undefined) => {
    if (!url) return false;
    try {
        const u = new URL(url, window.location.origin);
        return u.origin !== window.location.origin;
    } catch {
        return false;
    }
};

export default function AnnouncementViewDialog({
    item,
    onClose,
}: {
    item: HistoryItem | null;
    onClose: () => void;
}) {
    const open = !!item;
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {item?.title}
                    </DialogTitle>
                    <DialogDescription>
                        <div className="flex flex-wrap items-center gap-2">
                            {item?.scope === 'global' ? (
                                <Badge
                                    variant="secondary"
                                    className="inline-flex items-center gap-1"
                                >
                                    <Globe className="h-3.5 w-3.5" />
                                    {t(
                                        'management.notifications.target_global',
                                        'Global',
                                    )}
                                </Badge>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="inline-flex items-center gap-1"
                                >
                                    <Tag className="h-3.5 w-3.5" />
                                    {t(
                                        'management.notifications.target_role',
                                        'Role',
                                    )}
                                    {item?.role_name
                                        ? `: ${item.role_name}`
                                        : ''}
                                </Badge>
                            )}
                            {item?.persist && (
                                <Badge variant="outline">
                                    {t(
                                        'management.notifications.persist_label',
                                        'Persist per user',
                                    )}
                                </Badge>
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {item?.message && (
                        <div>
                            <Label className="text-muted-foreground text-xs uppercase">
                                {t(
                                    'management.notifications.message_label',
                                    'Message',
                                )}
                            </Label>
                            <div className="mt-1 text-sm whitespace-pre-wrap">
                                {item?.message}
                            </div>
                        </div>
                    )}
                    {item?.action_url && (
                        <div>
                            <Label className="text-muted-foreground text-xs uppercase">
                                {t(
                                    'management.notifications.action_url_label',
                                    'Action URL (optional)',
                                )}
                            </Label>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                {!isExternal(item?.action_url) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            onClose();
                                            router.visit(item!.action_url!);
                                        }}
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t('common.open', 'Open')}
                                    </Button>
                                )}
                                <Button asChild variant="outline" size="sm">
                                    <a
                                        href={item?.action_url || undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t(
                                            'common.open_new_tab',
                                            'Open in new tab',
                                        )}
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="grid gap-2 text-sm">
                        <div>
                            <Label className="text-muted-foreground text-xs uppercase">
                                {t(
                                    'management.notifications.th_status',
                                    'Status',
                                )}
                            </Label>
                            <div className="mt-0.5 font-medium uppercase">
                                {String(item?.status || '')}
                            </div>
                        </div>
                        {item?.scheduled_at ? (
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase">
                                    {t('management.notifications.when', 'When')}
                                </Label>
                                <div className="mt-0.5">
                                    {formatDate(item?.scheduled_at, true)}
                                </div>
                            </div>
                        ) : null}
                        {item?.sent_at ? (
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase">
                                    {t(
                                        'management.notifications.sent_at',
                                        'sent at',
                                    )}
                                </Label>
                                <div className="mt-0.5">
                                    {formatDate(item?.sent_at, true)}
                                </div>
                            </div>
                        ) : null}
                        {item?.persist ? (
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase">
                                    {t(
                                        'management.notifications.persist_label',
                                        'Persist per user',
                                    )}
                                </Label>
                                <div className="mt-0.5">
                                    {t('common.yes', 'Yes')}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                    {item &&
                        (item.status === 'scheduled' ||
                            item.status === 'pending') && (
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    router.visit(
                                        route(
                                            'management.announcements.send_now',
                                            { announcement: item.id },
                                        ),
                                        {
                                            method: 'post',
                                            preserveScroll: true,
                                            onSuccess: () => onClose(),
                                        },
                                    )
                                }
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {t(
                                    'management.notifications.send_now',
                                    'Send now',
                                )}
                            </Button>
                        )}
                    <Button variant="outline" onClick={onClose}>
                        {t('common.close', 'Close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
