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

import type { ActionRow } from '../tables/actions-columns';

export type UpsertActionDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    promotionId: string;
    item?: ActionRow | null;
};

export default function UpsertActionDialog({
    open,
    onOpenChange,
    promotionId,
    item = null,
}: UpsertActionDialogProps) {
    const { t: tProm } = useTranslation('management/promotions');
    const { data, setData, post, put, processing, clearErrors } = useForm({
        action_type: (item?.action_type ?? 'percent') as any,
        applies_to_rent: Boolean(item?.applies_to_rent ?? true),
        applies_to_deposit: Boolean(item?.applies_to_deposit ?? false),
        percent_bps: item?.percent_bps ? String(item.percent_bps) : '',
        amount_idr: item?.amount_idr ? String(item.amount_idr) : '',
        fixed_price_idr: item?.fixed_price_idr
            ? String(item.fixed_price_idr)
            : '',
        n_days: item?.n_days ? String(item.n_days) : '',
        n_periods: item?.n_periods ? String(item.n_periods) : '',
        max_discount_idr: item?.max_discount_idr
            ? String(item.max_discount_idr)
            : '',
        priority: String(item?.priority ?? 100),
    });

    React.useEffect(() => {
        setData({
            action_type: (item?.action_type ?? 'percent') as any,
            applies_to_rent: Boolean(item?.applies_to_rent ?? true),
            applies_to_deposit: Boolean(item?.applies_to_deposit ?? false),
            percent_bps: item?.percent_bps ? String(item.percent_bps) : '',
            amount_idr: item?.amount_idr ? String(item.amount_idr) : '',
            fixed_price_idr: item?.fixed_price_idr
                ? String(item.fixed_price_idr)
                : '',
            n_days: item?.n_days ? String(item.n_days) : '',
            n_periods: item?.n_periods ? String(item.n_periods) : '',
            max_discount_idr: item?.max_discount_idr
                ? String(item.max_discount_idr)
                : '',
            priority: String(item?.priority ?? 100),
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
            percent_bps: data.percent_bps || null,
            amount_idr: data.amount_idr || null,
            fixed_price_idr: data.fixed_price_idr || null,
            n_days: data.n_days || null,
            n_periods: data.n_periods || null,
            max_discount_idr: data.max_discount_idr || null,
            priority: data.priority || 100,
        };
        if (item?.id) {
            put(route('management.promotions.actions.update', item.id), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.promotions.actions.store', promotionId), {
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
                    <DialogTitle>
                        {item?.id ? 'Edit Action' : 'Add Action'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('action.label.action_type')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="text-muted-foreground"><Info className="h-4 w-4" /></TooltipTrigger>
                                    <TooltipContent>{tProm('action.help.action_type')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <select
                            className="border bg-background px-2 py-2 rounded-md"
                            value={data.action_type}
                            onChange={(e) => setData('action_type', e.target.value)}
                        >
                            <option value="percent">{tProm('action.type.percent')}</option>
                            <option value="amount">{tProm('action.type.amount')}</option>
                            <option value="fixed_price">{tProm('action.type.fixed_price')}</option>
                            <option value="free_n_days">{tProm('action.type.free_n_days')}</option>
                            <option value="first_n_periods_percent">{tProm('action.type.first_n_percent')}</option>
                            <option value="first_n_periods_amount">{tProm('action.type.first_n_amount')}</option>
                        </select>
                        <InputError name="action_type" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('action.label.priority')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.priority}
                            onChange={(e) => setData('priority', e.target.value)}
                        />
                        <InputError name="priority" />
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

                    <div className="grid gap-2">
                        <Label>{tProm('action.label.percent_bps')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.percent_bps}
                            onChange={(e) =>
                                setData('percent_bps', e.target.value)
                            }
                        />
                        <InputError name="percent_bps" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('action.label.amount_idr')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.amount_idr}
                            onChange={(e) => setData('amount_idr', e.target.value)}
                        />
                        <InputError name="amount_idr" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('action.label.fixed_price_idr')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.fixed_price_idr}
                            onChange={(e) =>
                                setData('fixed_price_idr', e.target.value)
                            }
                        />
                        <InputError name="fixed_price_idr" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('action.label.n_days')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.n_days}
                            onChange={(e) => setData('n_days', e.target.value)}
                        />
                        <InputError name="n_days" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('action.label.n_periods')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.n_periods}
                            onChange={(e) => setData('n_periods', e.target.value)}
                        />
                        <InputError name="n_periods" />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label>{tProm('action.label.max_discount_idr')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.max_discount_idr}
                            onChange={(e) =>
                                setData('max_discount_idr', e.target.value)
                            }
                        />
                        <InputError name="max_discount_idr" />
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
