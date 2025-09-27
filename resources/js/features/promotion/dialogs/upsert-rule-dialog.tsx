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
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t: tProm } = useTranslation('management/promotions');
    const { data, setData, post, put, processing, clearErrors } = useForm({
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
            put(route('management.promotions.rules.update', item.id), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.promotions.rules.store', promotionId), {
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{item?.id ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('rule.label.min_spend')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="text-muted-foreground"><Info className="h-4 w-4" /></TooltipTrigger>
                                    <TooltipContent>{tProm('rule.help.min_spend')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input inputMode="numeric" placeholder={tProm('rule.placeholder.min_spend')} value={data.min_spend_idr} onChange={(e) => setData('min_spend_idr', e.target.value)} />
                        <InputError name="min_spend_idr" />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('rule.label.max_discount')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="text-muted-foreground"><Info className="h-4 w-4" /></TooltipTrigger>
                                    <TooltipContent>{tProm('rule.help.max_discount')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input inputMode="numeric" placeholder={tProm('rule.placeholder.max_discount')} value={data.max_discount_idr} onChange={(e) => setData('max_discount_idr', e.target.value)} />
                        <InputError name="max_discount_idr" />
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                        <Checkbox
                            checked={Boolean(data.applies_to_rent)}
                            onCheckedChange={(v) => setData('applies_to_rent', v)}
                        />
                        <Label>Applies to Rent</Label>
                        <Checkbox
                            checked={Boolean(data.applies_to_deposit)}
                            onCheckedChange={(v) =>
                                setData('applies_to_deposit', v)
                            }
                        />
                        <Label>Applies to Deposit</Label>
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('rule.label.billing_periods')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="text-muted-foreground"><Info className="h-4 w-4" /></TooltipTrigger>
                                    <TooltipContent>{tProm('rule.help.billing_periods')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-4">
                            {['daily', 'weekly', 'monthly'].map((p) => (
                                <label key={p} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.billing_periods.includes(
                                            p,
                                        )}
                                        onChange={() =>
                                            toggleArray('billing_periods', p)
                                        }
                                    />
                                    <span className="capitalize">{p}</span>
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
                            onChange={(e) => setData('date_from', e.target.value)}
                        />
                        <InputError name="date_from" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.date_until')}</Label>
                        <Input
                            type="date"
                            value={data.date_until}
                            onChange={(e) => setData('date_until', e.target.value)}
                        />
                        <InputError name="date_until" />
                    </div>

                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.time_start')}</Label>
                        <Input
                            type="time"
                            value={data.time_start}
                            onChange={(e) => setData('time_start', e.target.value)}
                        />
                        <InputError name="time_start" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.time_end')}</Label>
                        <Input
                            type="time"
                            value={data.time_end}
                            onChange={(e) => setData('time_end', e.target.value)}
                        />
                        <InputError name="time_end" />
                    </div>

                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.channel')}</Label>
                        <select
                            className="border bg-background px-2 py-2 rounded-md"
                            value={data.channel}
                            onChange={(e) => setData('channel', e.target.value)}
                        >
                            <option value="">{tProm('common.any')}</option>
                            <option value="public">{tProm('channel.public')}</option>
                            <option value="referral">{tProm('channel.referral')}</option>
                            <option value="manual">{tProm('channel.manual')}</option>
                            <option value="coupon">{tProm('channel.coupon')}</option>
                        </select>
                        <InputError name="channel" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('rule.label.first_n')}</Label>
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
