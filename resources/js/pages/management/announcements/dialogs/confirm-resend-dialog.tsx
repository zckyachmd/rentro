import { router } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import * as React from 'react';
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
import { Label } from '@/components/ui/label';
import type { HistoryItem } from './view-dialog';

export default function ConfirmResendDialog({
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
            {t('management.notifications.confirm_resend_title', 'Resend Announcement')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'management.notifications.confirm_resend_desc',
              'This will resend the announcement to the selected target.',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {item?.title ? (
            <div>
              <Label className="text-muted-foreground text-xs uppercase">
                {t('management.notifications.title_label', 'Title')}
              </Label>
              <div className="mt-0.5">{item.title}</div>
            </div>
          ) : null}
          {item?.message ? (
            <div>
              <Label className="text-muted-foreground text-xs uppercase">
                {t('management.notifications.message_label', 'Message')}
              </Label>
              <div className="mt-0.5 whitespace-pre-wrap">{item.message}</div>
            </div>
          ) : null}
          <div className="grid gap-1">
            <div>
              <Label className="text-muted-foreground text-xs uppercase">
                {t('management.notifications.target', 'Target')}
              </Label>
              <div className="mt-0.5">
                {item?.scope === 'global'
                  ? t('management.notifications.target_global', 'Global')
                  : `${t('management.notifications.target_role', 'Role')}${item?.role_name ? ': ' + item.role_name : ''}`}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase">
                {t('management.notifications.persist_label', 'Persist per user')}
              </Label>
              <div className="mt-0.5">
                {item?.persist
                  ? t(
                      'management.notifications.confirm_persist_info',
                      'Persistent: creates stored notifications for each user (queued).',
                    )
                  : t(
                      'management.notifications.confirm_non_persist_info',
                      'Transient broadcast only (no stored notifications).',
                    )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={() => {
              if (!item) return;
              router.visit(
                route('management.announcements.resend', { announcement: item.id }),
                { method: 'post', preserveScroll: true, onSuccess: onClose, onFinish: onClose },
              );
            }}
          >
            <Megaphone className="mr-2 h-4 w-4" />
            {t('management.notifications.resend_now', 'Resend now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

