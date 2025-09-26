import { router, useForm } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { PromotionItem } from '@/types/management';

export type UpsertPromotionDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    item?: PromotionItem | null;
};

export default function UpsertPromotionDialog({
    open,
    onOpenChange,
    item = null,
}: UpsertPromotionDialogProps) {
    const { t } = useTranslation();
    const { t: tProm } = useTranslation('management/promotions');

    const { data, setData, post, put, processing, clearErrors } = useForm({
        name: item?.name ?? '',
        slug: item?.slug ?? '',
        description: item?.description ?? '',
        valid_from: item?.valid_from ?? '',
        valid_until: item?.valid_until ?? '',
        stack_mode: (item?.stack_mode ?? 'stack') as
            | 'stack'
            | 'highest_only'
            | 'exclusive',
        priority: String(item?.priority ?? 100),
        default_channel: (item?.default_channel ?? '') as
            | 'public'
            | 'referral'
            | 'manual'
            | 'coupon'
            | '',
        require_coupon: Boolean(item?.require_coupon ?? false),
        is_active: Boolean(item?.is_active ?? true),
        tags: (item?.tags ?? []).join(','),
        total_quota: '',
        per_user_limit: '',
        per_contract_limit: '',
        per_invoice_limit: '',
        per_day_limit: '',
        per_month_limit: '',
    });

    React.useEffect(() => {
        setData({
            name: item?.name ?? '',
            slug: item?.slug ?? '',
            description: item?.description ?? '',
            valid_from: item?.valid_from ?? '',
            valid_until: item?.valid_until ?? '',
            stack_mode: (item?.stack_mode ?? 'stack') as any,
            priority: String(item?.priority ?? 100),
            default_channel: (item?.default_channel ?? '') as any,
            require_coupon: Boolean(item?.require_coupon ?? false),
            is_active: Boolean(item?.is_active ?? true),
            tags: (item?.tags ?? []).join(','),
            total_quota: '',
            per_user_limit: '',
            per_contract_limit: '',
            per_invoice_limit: '',
            per_day_limit: '',
            per_month_limit: '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id]);

    const close = React.useCallback(() => {
        onOpenChange(false);
        clearErrors();
    }, [onOpenChange, clearErrors]);

    const toNumberOrNull = (v?: string | number | null) => {
        if (!v && v !== 0) return null;
        const n = Number(String(v).replace(/[^0-9]/g, ''));
        return Number.isNaN(n) ? null : n;
    };

    const submit = React.useCallback(() => {
        clearErrors();
        const payload: any = {
            ...data,
            priority: toNumberOrNull(data.priority),
            total_quota: toNumberOrNull(data.total_quota),
            per_user_limit: toNumberOrNull(data.per_user_limit),
            per_contract_limit: toNumberOrNull(data.per_contract_limit),
            per_invoice_limit: toNumberOrNull(data.per_invoice_limit),
            per_day_limit: toNumberOrNull(data.per_day_limit),
            per_month_limit: toNumberOrNull(data.per_month_limit),
            tags: (data.tags || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
        };

        if (item?.id) {
            put(route('management.promotions.update', item.id), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.promotions.store'), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        }
    }, [data, post, put, item?.id, close, clearErrors]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {item?.id
                            ? tProm('edit_title', 'Edit Promotion')
                            : tProm('create_title', 'Create Promotion')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <Label>
                            {t('common.name')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError name="name" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Slug</Label>
                        <Input
                            placeholder="auto from name if empty"
                            value={data.slug ?? ''}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                        <InputError name="slug" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Priority</Label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            value={data.priority}
                            onChange={(e) => setData('priority', e.target.value)}
                        />
                        <InputError name="priority" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Stack Mode</Label>
                        <select
                            className="border bg-background px-2 py-2 rounded-md"
                            value={data.stack_mode}
                            onChange={(e) =>
                                setData(
                                    'stack_mode',
                                    e.target.value as any,
                                )
                            }
                        >
                            <option value="stack">Stack</option>
                            <option value="highest_only">Highest Only</option>
                            <option value="exclusive">Exclusive</option>
                        </select>
                        <InputError name="stack_mode" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Default Channel</Label>
                        <select
                            className="border bg-background px-2 py-2 rounded-md"
                            value={data.default_channel ?? ''}
                            onChange={(e) =>
                                setData(
                                    'default_channel',
                                    (e.target.value || '') as any,
                                )
                            }
                        >
                            <option value="">Any</option>
                            <option value="public">Public</option>
                            <option value="referral">Referral</option>
                            <option value="manual">Manual</option>
                            <option value="coupon">Coupon</option>
                        </select>
                        <InputError name="default_channel" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Valid From</Label>
                        <Input
                            type="date"
                            value={data.valid_from ?? ''}
                            onChange={(e) => setData('valid_from', e.target.value)}
                        />
                        <InputError name="valid_from" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Valid Until</Label>
                        <Input
                            type="date"
                            value={data.valid_until ?? ''}
                            onChange={(e) => setData('valid_until', e.target.value)}
                        />
                        <InputError name="valid_until" />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        <Label>{t('common.description')}</Label>
                        <Textarea
                            value={data.description ?? ''}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError name="description" />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        <Label>Tags (comma-separated)</Label>
                        <Input
                            placeholder="e.g. dp, limited, featured"
                            value={data.tags ?? ''}
                            onChange={(e) => setData('tags', e.target.value)}
                        />
                        <InputError name="tags" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Total Quota</Label>
                        <Input
                            inputMode="numeric"
                            value={data.total_quota}
                            onChange={(e) => setData('total_quota', e.target.value)}
                        />
                        <InputError name="total_quota" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Per-User Limit</Label>
                        <Input
                            inputMode="numeric"
                            value={data.per_user_limit}
                            onChange={(e) =>
                                setData('per_user_limit', e.target.value)
                            }
                        />
                        <InputError name="per_user_limit" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Per-Contract Limit</Label>
                        <Input
                            inputMode="numeric"
                            value={data.per_contract_limit}
                            onChange={(e) =>
                                setData('per_contract_limit', e.target.value)
                            }
                        />
                        <InputError name="per_contract_limit" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Per-Invoice Limit</Label>
                        <Input
                            inputMode="numeric"
                            value={data.per_invoice_limit}
                            onChange={(e) =>
                                setData('per_invoice_limit', e.target.value)
                            }
                        />
                        <InputError name="per_invoice_limit" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Per-Day Limit</Label>
                        <Input
                            inputMode="numeric"
                            value={data.per_day_limit}
                            onChange={(e) => setData('per_day_limit', e.target.value)}
                        />
                        <InputError name="per_day_limit" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Per-Month Limit</Label>
                        <Input
                            inputMode="numeric"
                            value={data.per_month_limit}
                            onChange={(e) =>
                                setData('per_month_limit', e.target.value)
                            }
                        />
                        <InputError name="per_month_limit" />
                    </div>

                    <div className="flex items-center gap-3 sm:col-span-2">
                        <Switch
                            checked={Boolean(data.require_coupon)}
                            onCheckedChange={(v) => setData('require_coupon', v)}
                        />
                        <Label>Require Coupon</Label>
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2">
                        <Switch
                            checked={Boolean(data.is_active)}
                            onCheckedChange={(v) => setData('is_active', v)}
                        />
                        <Label>{t('common.active', 'Active')}</Label>
                    </div>

                    <DialogFooter className="sm:col-span-2">
                        <Button type="button" variant="outline" onClick={close}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={processing}
                            onClick={submit}
                        >
                            {tProm('form.save', 'Save')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

