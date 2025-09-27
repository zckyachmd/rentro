import { router, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import React from 'react';
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
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export type BulkCouponDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    promotionId: string;
    onSuccess?: () => void;
};

type BulkForm = {
    count: string;
    prefix: string;
    length: string;
    is_active: boolean;
    max_redemptions: string;
    expires_at: string;
};

type BulkPayload = {
    count: number;
    prefix: string;
    length: number;
    is_active: boolean;
    max_redemptions: number | null;
    expires_at: string | null;
};

export default function BulkCouponDialog({
    open,
    onOpenChange,
    promotionId,
    onSuccess,
}: BulkCouponDialogProps) {
    const { t } = useTranslation();
    const { t: tProm } = useTranslation('management/promotions');
    const { data, setData, processing, clearErrors } = useForm<BulkForm>({
        count: '1',
        prefix: '',
        length: '10',
        is_active: true,
        max_redemptions: '1',
        expires_at: '',
    });

    const close = React.useCallback(() => {
        onOpenChange(false);
        clearErrors();
    }, [onOpenChange, clearErrors]);

    const submit = React.useCallback(() => {
        clearErrors();
        const payload: BulkPayload = {
            count: Number(data.count) || 0,
            prefix: data.prefix || '',
            length: Number(data.length) || 10,
            is_active: Boolean(data.is_active),
            max_redemptions: data.max_redemptions
                ? Number(data.max_redemptions)
                : null,
            expires_at: data.expires_at || null,
        };
        router.post(
            route('management.promotions.coupons.bulk', promotionId),
            payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    onSuccess?.();
                    close();
                },
            },
        );
    }, [data, promotionId, close, clearErrors, onSuccess]);

    // Reset defaults each time dialog opens
    React.useEffect(() => {
        if (open) {
            setData('count', '1');
            setData('prefix', '');
            setData('length', '10');
            setData('is_active', true);
            setData('max_redemptions', '1');
            setData('expires_at', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-lg"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {tProm('bulk.title', 'Bulk Generate Coupons')}
                    </DialogTitle>
                    <DialogDescription>
                        {tProm(
                            'bulk.desc',
                            'Create one or many coupon codes at once.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('bulk.label.count')}{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('bulk.help.count')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm('bulk.placeholder.count')}
                            value={data.count}
                            onChange={(e) => setData('count', e.target.value)}
                        />
                        <InputError name="count" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('bulk.label.length')}{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('bulk.help.length')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm('bulk.placeholder.length')}
                            value={data.length}
                            onChange={(e) => setData('length', e.target.value)}
                        />
                        <InputError name="length" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('bulk.label.prefix')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('bulk.help.prefix')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            placeholder={tProm('bulk.placeholder.prefix')}
                            value={data.prefix}
                            onChange={(e) => setData('prefix', e.target.value)}
                        />
                        <InputError name="prefix" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('bulk.label.max_redemptions')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('bulk.help.max_redemptions')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm(
                                'bulk.placeholder.max_redemptions',
                            )}
                            value={data.max_redemptions}
                            onChange={(e) =>
                                setData('max_redemptions', e.target.value)
                            }
                        />
                        <InputError name="max_redemptions" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('bulk.label.expires_at')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('bulk.help.expires_at')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            type="date"
                            value={data.expires_at}
                            onChange={(e) =>
                                setData('expires_at', e.target.value)
                            }
                        />
                        <InputError name="expires_at" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={Boolean(data.is_active)}
                            onCheckedChange={(v) => setData('is_active', v)}
                        />
                        <Label>{tProm('bulk.label.is_active')}</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={close}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={submit}
                    >
                        {t('common.submit', 'Submit')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
