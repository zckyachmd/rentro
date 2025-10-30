import { router, useForm } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
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
import { Textarea } from '@/components/ui/textarea';
import { formatIDR } from '@/lib/format';
import type { ManagementRoomTypeItem } from '@/types/management';

export type UpsertRoomTypeDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    item?: ManagementRoomTypeItem | null;
};

export default function UpsertRoomTypeDialog({
    open,
    onOpenChange,
    item = null,
}: UpsertRoomTypeDialogProps) {
    const { t } = useTranslation();
    const { t: tType } = useTranslation('management/room-types');

    const { data, setData, post, put, processing, clearErrors } = useForm({
        name: item?.name ?? '',
        slug: item?.slug ?? '',
        capacity: item?.capacity ? String(item.capacity) : '1',
        price_rupiah: item?.price_monthly_rupiah
            ? String(
                  Number(
                      (item.price_monthly_rupiah || '').replace(/[^0-9]/g, ''),
                  ),
              )
            : '',
        price_weekly_rupiah: item?.price_weekly_rupiah
            ? String(
                  Number(
                      (item.price_weekly_rupiah || '').replace(/[^0-9]/g, ''),
                  ),
              )
            : '',
        price_daily_rupiah: item?.price_daily_rupiah
            ? String(
                  Number(
                      (item.price_daily_rupiah || '').replace(/[^0-9]/g, ''),
                  ),
              )
            : '',
        deposit_rupiah: item?.deposit_monthly_rupiah
            ? String(
                  Number(
                      (item.deposit_monthly_rupiah || '').replace(
                          /[^0-9]/g,
                          '',
                      ),
                  ),
              )
            : '',
        deposit_weekly_rupiah: item?.deposit_weekly_rupiah
            ? String(
                  Number(
                      (item.deposit_weekly_rupiah || '').replace(/[^0-9]/g, ''),
                  ),
              )
            : '',
        deposit_daily_rupiah: item?.deposit_daily_rupiah
            ? String(
                  Number(
                      (item.deposit_daily_rupiah || '').replace(/[^0-9]/g, ''),
                  ),
              )
            : '',
        description: item?.description ?? '',
        is_active: item?.is_active ?? true,
    });

    React.useEffect(() => {
        // Helper to pull digits from formatted string like "Rp 1.200.000"
        const digits = (s?: string | null) =>
            s ? String(s).replace(/[^0-9]/g, '') : '';

        setData({
            name: item?.name ?? '',
            slug: item?.slug ?? '',
            capacity: item?.capacity ? String(item.capacity) : '1',
            price_rupiah: digits(item?.price_monthly_rupiah),
            price_weekly_rupiah: digits(item?.price_weekly_rupiah),
            price_daily_rupiah: digits(item?.price_daily_rupiah),
            deposit_rupiah: digits(item?.deposit_monthly_rupiah),
            deposit_weekly_rupiah: digits(item?.deposit_weekly_rupiah),
            deposit_daily_rupiah: digits(item?.deposit_daily_rupiah),
            description: item?.description ?? '',
            is_active: item?.is_active ?? true,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id]);

    const close = React.useCallback(() => {
        onOpenChange(false);
        clearErrors();
    }, [onOpenChange, clearErrors]);

    const submit = React.useCallback(() => {
        clearErrors();
        if (item?.id) {
            put(route('management.room-types.update', item.id), {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        } else {
            post(route('management.room-types.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveUrl: true });
                    close();
                },
            });
        }
    }, [post, put, item?.id, close, clearErrors]);

    const toNumber = React.useCallback((v?: string | number | null) => {
        if (v === null || v === undefined) return null;
        const n = Number(String(v).replace(/[^0-9]/g, ''));
        return Number.isNaN(n) ? null : n;
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {item?.id ? tType('edit_title') : tType('create_title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>
                            {t('common.name')}
                            <span className="ml-1 text-red-500">*</span>
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
                        <p className="text-muted-foreground text-xs">
                            {tType(
                                'form.slug_hint',
                                'Lowercase URL key; leave blank to auto-generate from name.',
                            )}
                            {` `}
                            <span>
                                {tType(
                                    'form.slug_example',
                                    'e.g., single-bed, deluxe-suite',
                                )}
                            </span>
                        </p>
                        <InputError name="slug" />
                    </div>

                    <div className="grid gap-2">
                        <Label>
                            {tType('form.capacity')}
                            <span className="ml-1 text-red-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            value={data.capacity}
                            onChange={(e) =>
                                setData('capacity', e.target.value)
                            }
                        />
                        <InputError name="capacity" />
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>{tType('form.price_monthly')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.price_rupiah ?? ''}
                                onChange={(e) =>
                                    setData('price_rupiah', e.target.value)
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {formatIDR(toNumber(data.price_rupiah))}
                            </p>
                            <InputError name="price_rupiah" />
                        </div>
                        <div className="grid gap-2">
                            <Label>{tType('form.price_weekly')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.price_weekly_rupiah ?? ''}
                                onChange={(e) =>
                                    setData(
                                        'price_weekly_rupiah',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {formatIDR(toNumber(data.price_weekly_rupiah))}
                            </p>
                            <InputError name="price_weekly_rupiah" />
                        </div>
                        <div className="grid gap-2">
                            <Label>{tType('form.price_daily')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.price_daily_rupiah ?? ''}
                                onChange={(e) =>
                                    setData(
                                        'price_daily_rupiah',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {formatIDR(toNumber(data.price_daily_rupiah))}
                            </p>
                            <InputError name="price_daily_rupiah" />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>{tType('form.deposit_monthly')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.deposit_rupiah ?? ''}
                                onChange={(e) =>
                                    setData('deposit_rupiah', e.target.value)
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {formatIDR(toNumber(data.deposit_rupiah))}
                            </p>
                            <InputError name="deposit_rupiah" />
                        </div>
                        <div className="grid gap-2">
                            <Label>{tType('form.deposit_weekly')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.deposit_weekly_rupiah ?? ''}
                                onChange={(e) =>
                                    setData(
                                        'deposit_weekly_rupiah',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {formatIDR(
                                    toNumber(data.deposit_weekly_rupiah),
                                )}
                            </p>
                            <InputError name="deposit_weekly_rupiah" />
                        </div>
                        <div className="grid gap-2">
                            <Label>{tType('form.deposit_daily')}</Label>
                            <Input
                                inputMode="numeric"
                                value={data.deposit_daily_rupiah ?? ''}
                                onChange={(e) =>
                                    setData(
                                        'deposit_daily_rupiah',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                {formatIDR(toNumber(data.deposit_daily_rupiah))}
                            </p>
                            <InputError name="deposit_daily_rupiah" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('common.description')}</Label>
                        <Textarea
                            value={data.description ?? ''}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError name="description" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            checked={Boolean(data.is_active)}
                            onCheckedChange={(v) => setData('is_active', v)}
                        />
                        <Label>{t('common.active', 'Active')}</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={close}>
                            {t('common.cancel')}
                        </Button>
                        <Can
                            all={[
                                item?.id
                                    ? 'room-type.update'
                                    : 'room-type.create',
                            ]}
                        >
                            <Button
                                type="button"
                                disabled={processing}
                                onClick={submit}
                            >
                                {tType('form.save')}
                            </Button>
                        </Can>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
