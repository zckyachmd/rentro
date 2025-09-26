import React from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { SearchOption } from '@/components/ui/search-select';
import { Separator } from '@/components/ui/separator';
import type {
    ContractCreateForm,
    ContractCreateLocal,
} from '@/types/management';

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    data: ContractCreateForm & ContractCreateLocal;
    tenantOptions: SearchOption[];
    roomOptions: SearchOption[];
    periodLabel: string;
    formatRupiah: (val: string) => string;
    processing: boolean;
    onConfirm: () => void;
};

export default function ContractCreatePreviewDialog({
    open,
    onOpenChange,
    data,
    tenantOptions,
    roomOptions,
    periodLabel,
    formatRupiah,
    processing,
    onConfirm,
}: Props) {
    const { t } = useTranslation('management/contract');
    const [confirmChecked, setConfirmChecked] = React.useState(false);

    React.useEffect(() => {
        if (open) setConfirmChecked(false);
    }, [open]);

    const tenant = tenantOptions.find((t) => t.value === data.user_id);
    const room = roomOptions.find((r) => r.value === data.room_id);
    const tenantInitial = (tenant?.label || '?').slice(0, 1).toUpperCase();

    return (
        <React.Suspense fallback={null}>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[720px]">
                    <DialogHeader>
                        <DialogTitle>{t('preview.title')}</DialogTitle>
                        <DialogDescription>
                            {t('preview.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="flex items-center gap-3 rounded-md border p-3">
                            <Avatar className="size-10">
                                <AvatarFallback className="text-sm font-medium">
                                    {tenantInitial}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                    {tenant?.label ??
                                        t(
                                            'preview.placeholders.tenantNotSelected',
                                        )}
                                </div>
                                <div className="text-muted-foreground truncate text-xs">
                                    {tenant?.description || '-'}
                                </div>
                            </div>
                            <div className="ml-auto">
                                <Badge variant="secondary">
                                    {t('preview.badges.tenant')}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                {t('preview.sections.details')}
                            </div>
                            <div className="grid grid-cols-1 items-stretch gap-3 text-sm sm:grid-cols-2">
                                <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                    <span className="text-muted-foreground">
                                        {t('preview.fields.room')}
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={room?.label ?? '-'}
                                    >
                                        {room?.label ?? '-'}
                                    </span>
                                </div>
                                <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                    <span className="text-muted-foreground">
                                        {t('preview.fields.location')}
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={room?.description || '-'}
                                    >
                                        {room?.description || '-'}
                                    </span>
                                </div>
                                <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                    <span className="text-muted-foreground">
                                        {t('preview.fields.period')}
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={periodLabel}
                                    >
                                        {periodLabel}
                                    </span>
                                </div>
                                {(data.billing_period === 'monthly' ||
                                    data.billing_period === 'weekly' ||
                                    data.billing_period === 'daily') && (
                                    <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                        <span className="text-muted-foreground">
                                            {t('preview.fields.payment')}
                                        </span>
                                        <span
                                            className="min-w-0 justify-self-end truncate text-right font-medium"
                                            title={
                                                data.billing_period ===
                                                'monthly'
                                                    ? data.monthly_payment_mode ===
                                                      'full'
                                                        ? t('payment.full')
                                                        : t('common.monthly')
                                                    : t('payment.full')
                                            }
                                        >
                                            {data.billing_period === 'monthly'
                                                ? data.monthly_payment_mode ===
                                                  'full'
                                                    ? t('payment.full')
                                                    : t('common.monthly')
                                                : t('payment.full')}
                                        </span>
                                    </div>
                                )}
                                <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                    <span className="text-muted-foreground">
                                        {t('preview.fields.autoRenew')}
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={
                                            data.auto_renew
                                                ? t('common.yes')
                                                : t('common.no')
                                        }
                                    >
                                        {data.auto_renew
                                            ? t('common.yes')
                                            : t('common.no')}
                                    </span>
                                </div>
                                <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                    <span className="text-muted-foreground">
                                        {t('preview.fields.billingDay')}
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={data.billing_day || '-'}
                                    >
                                        {data.billing_day || '-'}
                                    </span>
                                </div>
                                <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                    <span className="text-muted-foreground">
                                        {t('preview.fields.startDate')}
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={data.start_date || '-'}
                                    >
                                        {data.start_date || '-'}
                                    </span>
                                </div>
                                <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                    <span className="text-muted-foreground">
                                        {t('preview.fields.endDate')}
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={data.end_date || '-'}
                                    >
                                        {data.end_date || '-'}
                                    </span>
                                </div>
                                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                                    <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                        <span className="text-muted-foreground">
                                            {t('preview.fields.deposit')}
                                        </span>
                                        <span
                                            className="min-w-0 justify-self-end truncate text-right font-medium"
                                            title={formatRupiah(
                                                data.deposit_rupiah,
                                            )}
                                        >
                                            {formatRupiah(data.deposit_rupiah)}
                                        </span>
                                    </div>
                                    <div className="bg-muted/30 grid h-full grid-cols-[auto_1fr] items-center gap-3 rounded-md p-3">
                                        <span className="text-muted-foreground">
                                            {t('preview.fields.rent')}
                                        </span>
                                        <span
                                            className="min-w-0 justify-self-end truncate text-right font-medium"
                                            title={formatRupiah(
                                                data.rent_rupiah,
                                            )}
                                        >
                                            {formatRupiah(data.rent_rupiah)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {data.notes ? (
                            <div className="space-y-2">
                                <div className="text-sm font-medium">
                                    {t('preview.sections.notes')}
                                </div>
                                <div className="bg-muted/20 rounded-md border p-3 text-sm">
                                    {data.notes}
                                </div>
                            </div>
                        ) : null}

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="confirm"
                                checked={confirmChecked}
                                onCheckedChange={(v) =>
                                    setConfirmChecked(Boolean(v))
                                }
                            />
                            <Label htmlFor="confirm" className="text-sm">
                                {t('preview.confirmation.label')}
                            </Label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={onConfirm}
                                disabled={!confirmChecked || processing}
                            >
                                {t('common.save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </React.Suspense>
    );
}
