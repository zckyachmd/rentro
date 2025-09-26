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
                        <Label>Code</Label>
                        <Input
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                        />
                        <InputError name="code" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Expires At</Label>
                        <Input
                            type="date"
                            value={data.expires_at}
                            onChange={(e) => setData('expires_at', e.target.value)}
                        />
                        <InputError name="expires_at" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Max Redemptions</Label>
                        <Input
                            inputMode="numeric"
                            value={data.max_redemptions}
                            onChange={(e) =>
                                setData('max_redemptions', e.target.value)
                            }
                        />
                        <InputError name="max_redemptions" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={Boolean(data.is_active)}
                            onCheckedChange={(v) => setData('is_active', v)}
                        />
                        <Label>Active</Label>
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

