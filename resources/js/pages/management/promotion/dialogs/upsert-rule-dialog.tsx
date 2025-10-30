/* eslint-disable @typescript-eslint/no-explicit-any */
import { router, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import type { RuleRow } from '../tables/rules-columns';

export type UpsertRuleDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    promotionId: string;
    item?: RuleRow | null;
};

export default function UpsertRuleDialog({
    open,
    onOpenChange,
    promotionId,
    item = null,
}: UpsertRuleDialogProps) {
    const { t } = useTranslation();
    const { t: tProm } = useTranslation('management/promotions');
    const { data, setData, processing, clearErrors } = useForm({
        min_spend_idr: item?.min_spend_idr ? String(item.min_spend_idr) : '',
        max_discount_idr: item?.max_discount_idr
            ? String(item.max_discount_idr)
            : '',
        applies_to_rent: Boolean(item?.applies_to_rent ?? true),
        applies_to_deposit: Boolean(item?.applies_to_deposit ?? false),
        billing_periods: (item?.billing_periods ?? []) as string[],
        date_from: '',
        date_until: '',
        days_of_week: [] as number[],
        time_start: '',
        time_end: '',
        channel: '',
        first_n_periods: '',
        allowed_role_names: [] as string[],
        allowed_user_ids: [] as number[],
    });

    React.useEffect(() => {
        setData({
            min_spend_idr: item?.min_spend_idr
                ? String(item.min_spend_idr)
                : '',
            max_discount_idr: item?.max_discount_idr
                ? String(item.max_discount_idr)
                : '',
            applies_to_rent: Boolean(item?.applies_to_rent ?? true),
            applies_to_deposit: Boolean(item?.applies_to_deposit ?? false),
            billing_periods: (item?.billing_periods ?? []) as string[],
            date_from: '',
            date_until: '',
            days_of_week: [] as number[],
            time_start: '',
            time_end: '',
            channel: '',
            first_n_periods: '',
            allowed_role_names: [] as string[],
            allowed_user_ids: [] as number[],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id]);

    const close = React.useCallback(() => {
        onOpenChange(false);
        clearErrors();
    }, [onOpenChange, clearErrors]);

    const toggleArray = (key: keyof typeof data, value: string | number) => {
        const list = new Set([...(data[key] as any[])]);
        if (list.has(value)) list.delete(value);
        else list.add(value);
        setData(key as any, Array.from(list));
    };

    const submit = React.useCallback(() => {
        clearErrors();
        const payload: any = {
            ...data,
            min_spend_idr: data.min_spend_idr || null,
            max_discount_idr: data.max_discount_idr || null,
            date_from: data.date_from || null,
            date_until: data.date_until || null,
            time_start: data.time_start || null,
            time_end: data.time_end || null,
            channel: data.channel || null,
            first_n_periods: data.first_n_periods || null,
        };
        if (item?.id) {
            router.put(
                route('management.promotions.rules.update', item.id),
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
            router.post(
                route('management.promotions.rules.store', promotionId),
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.reload({ preserveUrl: true });
                        close();
                    },
                },
            );
        }
    }, [data, item?.id, close, clearErrors, promotionId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-3xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {item?.id
                            ? tProm('rule.edit_title', 'Edit Rule')
                            : tProm('rule.create_title', 'Add Rule')}
                    </DialogTitle>
                    <DialogDescription>
                        {tProm(
                            'rule.desc',
                            'Define conditions for when this promotion applies.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('rule.label.min_spend')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('rule.help.min_spend')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm('rule.placeholder.min_spend')}
                            value={data.min_spend_idr}
                            onChange={(e) =>
                                setData('min_spend_idr', e.target.value)
                            }
                        />
                        <InputError name="min_spend_idr" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('rule.label.max_discount')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('rule.help.max_discount')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            placeholder={tProm('rule.placeholder.max_discount')}
                            value={data.max_discount_idr}
                            onChange={(e) =>
                                setData('max_discount_idr', e.target.value)
                            }
                        />
                        <InputError name="max_discount_idr" />
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                        <Checkbox
                            checked={Boolean(data.applies_to_rent)}
                            onCheckedChange={(v) =>
                                setData('applies_to_rent', !!v)
                            }
                        />
                        <Label>{tProm('common.rent', 'Rent')}</Label>
                        <Checkbox
                            checked={Boolean(data.applies_to_deposit)}
                            onCheckedChange={(v) =>
                                setData('applies_to_deposit', !!v)
                            }
                        />
                        <Label>{tProm('common.deposit', 'Deposit')}</Label>
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('rule.label.billing_periods')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('rule.help.billing_periods')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-4">
                            {['daily', 'weekly', 'monthly'].map((p) => (
                                <label
                                    key={p}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.billing_periods.includes(
                                            p,
                                        )}
                                        onChange={() =>
                                            toggleArray('billing_periods', p)
                                        }
                                    />
                                    <span className="capitalize">
                                        {p === 'daily'
                                            ? t('common.daily', 'Daily')
                                            : p === 'weekly'
                                              ? t('common.weekly', 'Weekly')
                                              : t('common.monthly', 'Monthly')}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <InputError name="billing_periods" />
                    </div>

                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.date_from')}</Label>
                        <Input
                            type="date"
                            value={data.date_from}
                            onChange={(e) =>
                                setData('date_from', e.target.value)
                            }
                        />
                        <InputError name="date_from" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.date_until')}</Label>
                        <Input
                            type="date"
                            value={data.date_until}
                            onChange={(e) =>
                                setData('date_until', e.target.value)
                            }
                        />
                        <InputError name="date_until" />
                    </div>

                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.time_start')}</Label>
                        <Input
                            type="time"
                            value={data.time_start}
                            onChange={(e) =>
                                setData('time_start', e.target.value)
                            }
                        />
                        <InputError name="time_start" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.time_end')}</Label>
                        <Input
                            type="time"
                            value={data.time_end}
                            onChange={(e) =>
                                setData('time_end', e.target.value)
                            }
                        />
                        <InputError name="time_end" />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('rule.label.channel')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm(
                                        'rule.help.channel',
                                        'Default sales channel to apply this rule',
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <select
                            className="bg-background rounded-md border px-2 py-2"
                            value={data.channel}
                            onChange={(e) => setData('channel', e.target.value)}
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
                        <InputError name="channel" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('rule.label.first_n')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm(
                                        'rule.help.first_n',
                                        'Limit effect to the first N billing periods',
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Input
                            inputMode="numeric"
                            value={data.first_n_periods}
                            onChange={(e) =>
                                setData('first_n_periods', e.target.value)
                            }
                        />
                        <InputError name="first_n_periods" />
                    </div>

                    <DialogFooter className="sm:col-span-2">
                        <Button type="button" variant="outline" onClick={close}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Can all={['promotion.update']}>
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
