import { router, useForm } from '@inertiajs/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';

import type { CouponRow } from '../tables/coupons-columns';

export type UpsertCouponDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    promotionId: string;
    item?: CouponRow | null;
};

export default function UpsertCouponDialog({
    open,
    onOpenChange,
    promotionId,
    item = null,
}: UpsertCouponDialogProps) {
    const { t: tProm } = useTranslation('management/promotions');
    const { data, setData, post, put, processing, clearErrors } = useForm({
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
        const payload: any = {
            ...data,
            max_redemptions: data.max_redemptions || null,
            expires_at: data.expires_at || null,
        };
        if (item?.id) {
            put(route('management.promotions.coupons.update', item.id), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.promotions.coupons.store', promotionId), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        }
    }, [data, post, put, item?.id, close, clearErrors, promotionId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item?.id ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('coupon.label.code')} <span className="text-red-500">*</span>
                            </Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="text-muted-foreground">
                                        <Info className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent>{tProm('coupon.help.code')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input placeholder={tProm('coupon.placeholder.code')} value={data.code} onChange={(e) => setData('code', e.target.value)} />
                        <InputError name="code" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('coupon.label.expires_at')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="text-muted-foreground">
                                        <Info className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent>{tProm('coupon.help.expires_at')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input type="date" value={data.expires_at} onChange={(e) => setData('expires_at', e.target.value)} />
                        <InputError name="expires_at" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('coupon.label.max_redemptions')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="text-muted-foreground">
                                        <Info className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent>{tProm('coupon.help.max_redemptions')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
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
                            Cancel
                        </Button>
                        <Button type="button" disabled={processing} onClick={submit}>
                            Save
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
