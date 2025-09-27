/* eslint-disable @typescript-eslint/no-explicit-any */
import { router, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const { t: tProm } = useTranslation('management/promotions');
    const { data, setData, processing, clearErrors } = useForm<any>({
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

    const close = () => {
        onOpenChange(false);
        (clearErrors as any)();
    };

    const submit = () => {
        (clearErrors as any)();
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
            router.put(
                route('management.promotions.actions.update', item.id),
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
                route('management.promotions.actions.store', promotionId),
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
    };

    const isPercent =
        data.action_type === 'percent' ||
        data.action_type === 'first_n_periods_percent';
    const isAmount =
        data.action_type === 'amount' ||
        data.action_type === 'first_n_periods_amount';
    const isFixed = data.action_type === 'fixed_price';
    const isFreeDays = data.action_type === 'free_n_days';
    const isFirstN = data.action_type.startsWith('first_n_periods_');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-3xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {item?.id
                            ? tProm('action.edit_title', 'Edit Action')
                            : tProm('action.create_title', 'Add Action')}
                    </DialogTitle>
                    <DialogDescription>
                        {tProm(
                            'action.desc',
                            'Specify how the discount is applied.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Label>{tProm('action.label.action_type')}</Label>
                            <Tooltip>
                                <TooltipTrigger
                                    tabIndex={-1}
                                    type="button"
                                    className="text-muted-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm('action.help.action_type')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <select
                            className="bg-background rounded-md border px-2 py-2"
                            value={data.action_type}
                            onChange={(e) =>
                                (setData as any)('action_type', e.target.value)
                            }
                        >
                            <option value="percent">
                                {tProm('action.type.percent')}
                            </option>
                            <option value="amount">
                                {tProm('action.type.amount')}
                            </option>
                            <option value="fixed_price">
                                {tProm('action.type.fixed_price')}
                            </option>
                            <option value="free_n_days">
                                {tProm('action.type.free_n_days')}
                            </option>
                            <option value="first_n_periods_percent">
                                {tProm('action.type.first_n_percent')}
                            </option>
                            <option value="first_n_periods_amount">
                                {tProm('action.type.first_n_amount')}
                            </option>
                        </select>
                        <InputError name="action_type" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tProm('action.label.priority')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.priority}
                            onChange={(e) =>
                                (setData as any)('priority', e.target.value)
                            }
                        />
                        <InputError name="priority" />
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                        <Checkbox
                            checked={Boolean(data.applies_to_rent)}
                            onCheckedChange={(v) =>
                                (setData as any)('applies_to_rent', !!v)
                            }
                        />
                        <Label>{t('common.rent', 'Rent')}</Label>
                        <Checkbox
                            checked={Boolean(data.applies_to_deposit)}
                            onCheckedChange={(v) =>
                                (setData as any)('applies_to_deposit', !!v)
                            }
                        />
                        <Label>{t('common.deposit', 'Deposit')}</Label>
                    </div>

                    {/* Parameters */}
                    {isPercent && (
                        <div className="grid gap-2">
                            <Label>{tProm('action.label.percent_bps')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.percent_bps}
                                onChange={(e) =>
                                    (setData as any)(
                                        'percent_bps',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {tProm(
                                    'action.help.percent_bps',
                                    'Enter basis points, e.g. 500 = 5%',
                                )}
                            </p>
                            <InputError name="percent_bps" />
                        </div>
                    )}
                    {isAmount && (
                        <div className="grid gap-2">
                            <Label>{tProm('action.label.amount_idr')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.amount_idr}
                                onChange={(e) =>
                                    (setData as any)(
                                        'amount_idr',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {tProm(
                                    'action.help.amount_idr',
                                    'Flat discount amount in Rupiah',
                                )}
                            </p>
                            <InputError name="amount_idr" />
                        </div>
                    )}
                    {isFixed && (
                        <div className="grid gap-2">
                            <Label>
                                {tProm('action.label.fixed_price_idr')}
                            </Label>
                            <Input
                                inputMode="numeric"
                                value={data.fixed_price_idr}
                                onChange={(e) =>
                                    (setData as any)(
                                        'fixed_price_idr',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {tProm(
                                    'action.help.fixed_price_idr',
                                    'Override price to this fixed amount',
                                )}
                            </p>
                            <InputError name="fixed_price_idr" />
                        </div>
                    )}
                    {isFreeDays && (
                        <div className="grid gap-2">
                            <Label>{tProm('action.label.n_days')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.n_days}
                                onChange={(e) =>
                                    (setData as any)('n_days', e.target.value)
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {tProm(
                                    'action.help.n_days',
                                    'Number of days covered for free',
                                )}
                            </p>
                            <InputError name="n_days" />
                        </div>
                    )}
                    {isFirstN && (
                        <div className="grid gap-2">
                            <Label>{tProm('action.label.n_periods')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.n_periods}
                                onChange={(e) =>
                                    (setData as any)(
                                        'n_periods',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {tProm(
                                    'action.help.n_periods',
                                    'Applies only to the first N billing periods',
                                )}
                            </p>
                            <InputError name="n_periods" />
                        </div>
                    )}
                    <div className="grid gap-2 sm:col-span-2">
                        <Label>{tProm('action.label.max_discount_idr')}</Label>
                        <Input
                            inputMode="numeric"
                            value={data.max_discount_idr}
                            onChange={(e) =>
                                (setData as any)(
                                    'max_discount_idr',
                                    e.target.value,
                                )
                            }
                        />
                        <p className="text-muted-foreground text-xs">
                            {tProm(
                                'action.help.max_discount_idr',
                                'Optional cap for discount amount',
                            )}
                        </p>
                        <InputError name="max_discount_idr" />
                    </div>

                    <DialogFooter className="sm:col-span-2">
                        <Button type="button" variant="outline" onClick={close}>
                            {t('common.cancel', 'Cancel')}
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
