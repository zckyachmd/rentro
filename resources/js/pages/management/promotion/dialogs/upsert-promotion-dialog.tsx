import { router, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import React from 'react';
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
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PromotionItem } from '@/types/management';

export type UpsertPromotionDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    item?: PromotionItem | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function UpsertPromotionDialog({
    open,
    onOpenChange,
    item = null,
}: UpsertPromotionDialogProps) {
    const { t } = useTranslation();
    const { t: tProm } = useTranslation('management/promotions');

    const { data, setData, processing, clearErrors } = useForm({
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
            router.put(
                route('management.promotions.update', item.id),
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.reload({ preserveUrl: true });
                        close();
                    },
                },
            );
        } else {
            router.post(route('management.promotions.store'), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        }
    }, [data, item?.id, close, clearErrors]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-3xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {item?.id
                            ? tProm('edit_title', 'Edit Promotion')
                            : tProm('create_title', 'Create Promotion')}
                    </DialogTitle>
                    <DialogDescription>
                        {tProm(
                            'promotion.desc',
                            'Basic settings for a promotion, including stack mode, default channel, active dates, and limits.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {t('common.name')}{' '}
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
                                    {tProm('promotion.help.name')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            placeholder={tProm('promotion.placeholder.name')}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError name="name" />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('promotion.label.slug')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('promotion.help.slug')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            placeholder={tProm('promotion.placeholder.slug')}
                            value={data.slug ?? ''}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                        <InputError name="slug" />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('promotion.label.priority')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('promotion.help.priority')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            type="number"
                            inputMode="numeric"
                            placeholder={tProm(
                                'promotion.placeholder.priority',
                            )}
                            value={data.priority}
                            onChange={(e) =>
                                setData('priority', e.target.value)
                            }
                        />
                        <InputError name="priority" />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('promotion.label.stack_mode')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('promotion.help.stack_mode')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <select
                            className="bg-background rounded-md border px-2 py-2"
                            value={data.stack_mode}
                            onChange={(e) =>
                                setData('stack_mode', e.target.value as any)
                            }
                        >
                            <option value="stack">
                                {tProm('promotion.stack.stack')}
                            </option>
                            <option value="highest_only">
                                {tProm('promotion.stack.highest_only')}
                            </option>
                            <option value="exclusive">
                                {tProm('promotion.stack.exclusive')}
                            </option>
                        </select>
                        <InputError name="stack_mode" />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('promotion.label.channel')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('promotion.help.channel')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <select
                            className="bg-background rounded-md border px-2 py-2"
                            value={data.default_channel ?? ''}
                            onChange={(e) =>
                                setData(
                                    'default_channel',
                                    (e.target.value || '') as any,
                                )
                            }
                        >
                            <option value="">{tProm('common.any')}</option>
                            <option value="public">
                                {tProm('channel.public')}
                            </option>
                            <option value="referral">
                                {tProm('channel.referral')}
                            </option>
                            <option value="manual">
                                {tProm('channel.manual')}
                            </option>
                            <option value="coupon">
                                {tProm('channel.coupon')}
                            </option>
                        </select>
                        <InputError name="default_channel" />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('promotion.label.valid_from')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('promotion.help.valid_from')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            type="date"
                            value={data.valid_from ?? ''}
                            onChange={(e) =>
                                setData('valid_from', e.target.value)
                            }
                        />
                        <InputError name="valid_from" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('promotion.label.valid_until')}
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
                                    {tProm('promotion.help.valid_until')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            type="date"
                            value={data.valid_until ?? ''}
                            onChange={(e) =>
                                setData('valid_until', e.target.value)
                            }
                        />
                        <InputError name="valid_until" />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        <div className="flex items-center gap-2">
                            <Label>{t('common.description')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('promotion.help.description')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Textarea
                            value={data.description ?? ''}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError name="description" />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('promotion.label.tags')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('promotion.help.tags')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            placeholder={tProm('promotion.placeholder.tags')}
                            value={data.tags ?? ''}
                            onChange={(e) => setData('tags', e.target.value)}
                        />
                        <InputError name="tags" />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('promotion.label.total_quota')}
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
                                    {tProm('promotion.help.total_quota')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm(
                                'promotion.placeholder.total_quota',
                            )}
                            value={data.total_quota}
                            onChange={(e) =>
                                setData('total_quota', e.target.value)
                            }
                        />
                        <InputError name="total_quota" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('promotion.label.per_user_limit')}
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
                                    {tProm('promotion.help.per_user_limit')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm(
                                'promotion.placeholder.per_user_limit',
                            )}
                            value={data.per_user_limit}
                            onChange={(e) =>
                                setData('per_user_limit', e.target.value)
                            }
                        />
                        <InputError name="per_user_limit" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('promotion.label.per_contract_limit')}
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
                                    {tProm('promotion.help.per_contract_limit')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm(
                                'promotion.placeholder.per_contract_limit',
                            )}
                            value={data.per_contract_limit}
                            onChange={(e) =>
                                setData('per_contract_limit', e.target.value)
                            }
                        />
                        <InputError name="per_contract_limit" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('promotion.label.per_invoice_limit')}
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
                                    {tProm('promotion.help.per_invoice_limit')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm(
                                'promotion.placeholder.per_invoice_limit',
                            )}
                            value={data.per_invoice_limit}
                            onChange={(e) =>
                                setData('per_invoice_limit', e.target.value)
                            }
                        />
                        <InputError name="per_invoice_limit" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('promotion.label.per_day_limit')}
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
                                    {tProm('promotion.help.per_day_limit')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm(
                                'promotion.placeholder.per_day_limit',
                            )}
                            value={data.per_day_limit}
                            onChange={(e) =>
                                setData('per_day_limit', e.target.value)
                            }
                        />
                        <InputError name="per_day_limit" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('promotion.label.per_month_limit')}
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
                                    {tProm('promotion.help.per_month_limit')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm(
                                'promotion.placeholder.per_month_limit',
                            )}
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
                            onCheckedChange={(v) =>
                                setData('require_coupon', v)
                            }
                        />
                        <div className="flex items-center gap-2">
                            <Label>
                                {tProm('promotion.label.require_coupon')}
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
                                    {tProm('promotion.help.require_coupon')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
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
                        <Can
                            all={[
                                item?.id
                                    ? 'promotion.update'
                                    : 'promotion.create',
                            ]}
                        >
                            <Button
                                type="button"
                                disabled={processing}
                                onClick={submit}
                            >
                                {tProm('form.save', 'Save')}
                            </Button>
                        </Can>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
