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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


import type { CouponRow } from '../tables/coupons-columns';

export type UpsertCouponDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    promotionId: string;
    item?: CouponRow | null;
    onSuccess?: () => void;
};

type CouponForm = {
    code: string;
    is_active: boolean;
    max_redemptions: string;
    expires_at: string;
};

export default function UpsertCouponDialog({
    open,
    onOpenChange,
    promotionId,
    item = null,
    onSuccess,
}: UpsertCouponDialogProps) {
    const { t } = useTranslation();
    const { t: tProm } = useTranslation('management/promotions');
    const { data, setData, processing, clearErrors } = useForm<CouponForm>({
        code: item?.code ?? '',
        is_active: Boolean(item?.is_active ?? true),
        max_redemptions: item?.max_redemptions ? String(item.max_redemptions) : '',
        expires_at: item?.expires_at ?? '',
    });

    React.useEffect(() => {
        setData({
            code: item?.code ?? '',
            is_active: Boolean(item?.is_active ?? true),
            max_redemptions: item?.max_redemptions ? String(item.max_redemptions) : '',
            expires_at: item?.expires_at ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id]);

    const close = React.useCallback(() => {
        onOpenChange(false);
        clearErrors();
    }, [onOpenChange, clearErrors]);

    const submit = React.useCallback(() => {
        clearErrors();
        const payload = {
            code: data.code,
            is_active: Boolean(data.is_active),
            max_redemptions: data.max_redemptions ? Number(data.max_redemptions) : null,
            expires_at: data.expires_at || null,
        };
        if (item?.id) {
            router.put(route('management.promotions.coupons.update', item.id), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    try { onSuccess?.() } catch {}
                    close();
                },
            });
        } else {
            router.post(route('management.promotions.coupons.store', promotionId), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    try { onSuccess?.() } catch {}
                    close();
                },
            });
        }
    }, [data, item?.id, close, clearErrors, promotionId, onSuccess]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{item?.id ? tProm('coupon.edit_title', 'Edit Coupon') : tProm('coupon.dialog_title', 'Coupon')}</DialogTitle>
                    <DialogDescription>{tProm('coupon.desc', 'Create or edit a single coupon code.')}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('coupon.label.code')} <span className="text-red-500">*</span>
                            </Label>
                            <Tooltip>
                                <TooltipTrigger tabIndex={-1} type="button" className="text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>{tProm('coupon.help.code')}</TooltipContent>
                            </Tooltip>
                        </div>
                        <Input placeholder={tProm('coupon.placeholder.code')} value={data.code} onChange={(e) => setData('code', e.target.value)} />
                        <InputError name="code" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('coupon.label.expires_at')}</Label>
                            <Tooltip>
                                <TooltipTrigger tabIndex={-1} type="button" className="text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>{tProm('coupon.help.expires_at')}</TooltipContent>
                            </Tooltip>
                        </div>
                        <Input type="date" value={data.expires_at} onChange={(e) => setData('expires_at', e.target.value)} />
                        <InputError name="expires_at" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('coupon.label.max_redemptions')}</Label>
                            <Tooltip>
                                <TooltipTrigger tabIndex={-1} type="button" className="text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>{tProm('coupon.help.max_redemptions')}</TooltipContent>
                            </Tooltip>
                        </div>
                        <Input inputMode="numeric" placeholder={tProm('coupon.placeholder.max_redemptions')} value={data.max_redemptions} onChange={(e) => setData('max_redemptions', e.target.value)} />
                        <InputError name="max_redemptions" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch checked={Boolean(data.is_active)} onCheckedChange={(v) => setData('is_active', v)} />
                        <Label>{tProm('coupon.label.is_active')}</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={close}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="button" disabled={processing} onClick={submit}>
                            {tProm('form.save', 'Save')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
