import { router } from '@inertiajs/react';
import { XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
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

import type { HistoryItem } from './view-dialog';

export default function ConfirmCancelDialog({
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
                    <DialogTitle>
                        {t(
                            'management.notifications.confirm_cancel_title',
                            'Cancel Schedule',
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'management.notifications.confirm_cancel_desc',
                            'This will cancel the scheduled delivery but keep the record. The announcement will not be sent at the scheduled time.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                    {item?.title ? (
                        <div>
                            <Label className="text-muted-foreground text-xs uppercase">
                                {t(
                                    'management.notifications.title_label',
                                    'Title',
                                )}
                            </Label>
                            <div className="mt-0.5">{item.title}</div>
                        </div>
                    ) : null}
                    {item?.scheduled_at ? (
                        <div>
                            <Label className="text-muted-foreground text-xs uppercase">
                                {t('management.notifications.when', 'When')}
                            </Label>
                            <div className="mt-0.5">
                                {formatDate(item.scheduled_at, true)}
                            </div>
                        </div>
                    ) : null}
                    <div>
                        <Label className="text-muted-foreground text-xs uppercase">
                            {t('management.notifications.target', 'Target')}
                        </Label>
                        <div className="mt-0.5">
                            {item?.scope === 'global'
                                ? t(
                                      'management.notifications.target_global',
                                      'Global',
                                  )
                                : `${t('management.notifications.target_role', 'Role')}${item?.role_name ? ': ' + item.role_name : ''}`}
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={onClose}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Can all={["announcement.cancel"]}>
                        <Button
                            onClick={() => {
                                if (!item) return;
                                router.visit(
                                    route(
                                        'management.announcements.cancel_schedule',
                                        { announcement: item.id },
                                    ),
                                    {
                                        method: 'post',
                                        preserveScroll: true,
                                        onSuccess: onClose,
                                        onFinish: onClose,
                                    },
                                );
                            }}
                        >
                            <XIcon className="mr-2 h-4 w-4" />
                            {t(
                                'management.notifications.cancel_schedule_now',
                                'Cancel schedule',
                            )}
                        </Button>
                    </Can>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
