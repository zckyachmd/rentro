import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Crumb } from '@/components/breadcrumbs';
import { DatePickerInput } from '@/components/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { SearchOption } from '@/components/ui/search-select';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import NominalRow from '@/features/contract/components/nominal-row';
import NotesPanel from '@/features/contract/components/notes-panel';
import TenantRoomSelect from '@/features/contract/components/tenant-room-select';
import ContractPreviewDialog from '@/features/contract/dialogs/contact-create-preview-dialog';
import ContractGuideDialog from '@/features/contract/dialogs/contract-create-guide-dialog';
import { LeaveGuardDialog, useLeaveGuard } from '@/hooks/use-leave-guard';
import { AppLayout } from '@/layouts';
import { formatIDR } from '@/lib/format';
import type {
    ContractCreateForm,
    ContractCreateLocal,
    PageOptions,
    ContractPeriodOption as PeriodOption,
    RoomOption,
    TenantOption,
} from '@/types/management';

const buildRoomLocation = (r: RoomOption, t: (k: string) => string) => {
    const floorBase = t('common.floor');
    const floorLabel =
        r.floor_label ??
        r.floor_label_text ??
        (typeof r.floor?.level !== 'undefined'
            ? `${floorBase} ${r.floor.level}`
            : r.floor_level
              ? `${floorBase} ${r.floor_level}`
              : undefined);
    const buildingLabel =
        r.building_label ??
        r.building_name ??
        r.building?.name ??
        r.building_short_name;
    if (floorLabel && buildingLabel) return `${floorLabel} - ${buildingLabel}`;
    if (floorLabel) return String(floorLabel);
    if (buildingLabel) return String(buildingLabel);
    return '';
};

const buildRoomBaseLabel = (r: RoomOption) => {
    const num = r.number ?? '';
    const nm = r.name ?? r.room_name ?? '';
    return nm ? `${num} / ${nm}` : `${num}`;
};

export default function ContractCreate() {
    const { t } = useTranslation();
    const { t: tContract } = useTranslation('management/contract');
    const { props } = usePage<InertiaPageProps & { options?: PageOptions }>();
    const opt = props.options;
    const todayDay = opt?.today_date
        ? String(Number(opt.today_date.slice(8, 10)))
        : '';

    const tenants: TenantOption[] = opt?.tenants ?? [];
    const rooms: RoomOption[] = opt?.rooms ?? [];
    const periods: PeriodOption[] = React.useMemo(
        () => opt?.billing_periods ?? [],
        [opt?.billing_periods],
    );

    const contractSettings = opt?.contract_settings ?? {};
    const prorata = Boolean(contractSettings.prorata ?? false);
    const autoRenewDefault = Boolean(
        contractSettings.auto_renew_default ?? false,
    );
    const dailyMax = Number(contractSettings.daily_max_days ?? 5);
    const weeklyMax = Number(contractSettings.weekly_max_weeks ?? 3);
    const monthlyTerms: number[] = Array.isArray(
        contractSettings.monthly_allowed_terms,
    )
        ? (contractSettings.monthly_allowed_terms as number[])
        : [3, 6, 12];

    const { data, setData, processing, errors, isDirty, post, transform } =
        useForm<ContractCreateForm & ContractCreateLocal>({
            user_id: '',
            room_id: '',
            start_date: opt?.today_date ?? '',
            end_date: '',
            rent_rupiah: '',
            deposit_rupiah: '',
            billing_period: 'monthly',
            billing_day: todayDay,
            auto_renew: autoRenewDefault,
            notes: '',
            duration_count: '',
            monthly_payment_mode: 'per_month',
        });

    const selectedPeriod = periods.find((p) => p.value === data.billing_period);
    const canEditDetails = Boolean(data.room_id);

    const roomOptions: SearchOption[] = rooms.map((r) => ({
        value: String(r.id),
        label: buildRoomBaseLabel(r),
        description: buildRoomLocation(r, t),
        payload: r,
    }));

    const tenantOptions: SearchOption[] = tenants.map((t) => ({
        value: String(t.id),
        label: t.name,
        description: t.email ?? '',
        payload: t,
    }));

    const periodKey = (p: string | undefined | null) => {
        const v = (p ?? '').toLowerCase();
        return v === 'daily' || v === 'weekly' ? v : 'monthly';
    };

    type PeriodKey = 'daily' | 'weekly' | 'monthly';
    const onRoomChange = (value: string, opt?: SearchOption) => {
        setData('room_id', value);
        const r =
            (opt?.payload as RoomOption) ||
            rooms.find((x) => String(x.id) === String(value));
        if (r) {
            const key = periodKey(data.billing_period) as PeriodKey;
            const price = r.prices?.[key] ?? null;
            const deposit = r.deposits?.[key] ?? null;
            setData(
                'rent_rupiah',
                price != null ? String(Math.round(price as number)) : '',
            );
            setData(
                'deposit_rupiah',
                deposit != null ? String(Math.round(deposit as number)) : '',
            );
            if (r.billing_period) setData('billing_period', r.billing_period);
        }
    };

    React.useEffect(() => {
        const r = rooms.find((x) => String(x.id) === String(data.room_id));
        if (!r) return;
        const key = periodKey(data.billing_period) as PeriodKey;
        const price = r.prices?.[key] ?? null;
        const deposit = r.deposits?.[key] ?? null;
        setData(
            'rent_rupiah',
            price != null ? String(Math.round(price as number)) : '',
        );
        setData(
            'deposit_rupiah',
            deposit != null ? String(Math.round(deposit as number)) : '',
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.billing_period, data.room_id]);

    const toISO = React.useCallback((d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }, []);

    const addDaysISO = React.useCallback(
        (iso: string, days: number) => {
            if (!iso) return '';
            const dt = new Date(iso + 'T00:00:00');
            if (Number.isNaN(dt.getTime())) return '';
            dt.setDate(dt.getDate() + days);
            return toISO(dt);
        },
        [toISO],
    );

    React.useEffect(() => {
        const startISO = data.start_date;
        const period = periods.find((p) => p.value === data.billing_period);
        const hasDuration =
            data.duration_count !== '' &&
            !Number.isNaN(Number(data.duration_count));
        if (!hasDuration) {
            if (data.end_date) setData('end_date', '');
            if (data.billing_day) setData('billing_day', '');
            return;
        }
        const count = Math.max(1, Number(data.duration_count));
        let nextEnd = '';
        if (startISO) {
            if (data.billing_period === 'monthly') {
                const d = new Date(startISO + 'T00:00:00');
                const y = d.getFullYear();
                const m = d.getMonth();
                const day = d.getDate();
                const nextMonthLastDay = new Date(
                    y,
                    m + count + 1,
                    0,
                ).getDate();
                const clamped = Math.min(day, nextMonthLastDay);
                const end = new Date(y, m + count, clamped - 1);
                nextEnd = toISO(end);
            } else {
                const unitDays = Number(period?.days ?? 0) || 30;
                // Inclusive: subtract 1 day
                nextEnd = addDaysISO(startISO, unitDays * count - 1);
            }
        }
        const currEnd = data.end_date ?? '';
        if (nextEnd !== currEnd) {
            setData('end_date', nextEnd);
        }

        let nextBilling = '';
        if (data.billing_period === 'monthly') {
            nextBilling = nextEnd
                ? String(new Date(nextEnd + 'T00:00:00').getDate())
                : '';
            if (
                prorata &&
                count >= 2 &&
                startISO &&
                new Date(startISO + 'T00:00:00').getDate() !== 1
            ) {
                const releaseDom = Number(
                    contractSettings.release_day_of_month ?? 1,
                );
                nextBilling = String(
                    Math.max(1, Math.min(31, releaseDom || 1)),
                );
            }
        }
        const currBilling = data.billing_day ?? '';
        if (nextBilling !== currBilling) {
            setData('billing_day', nextBilling);
        }
    }, [
        data.start_date,
        data.billing_period,
        data.duration_count,
        data.end_date,
        data.billing_day,
        periods,
        addDaysISO,
        toISO,
        setData,
        prorata,
        contractSettings.release_day_of_month,
    ]);

    const [autoRenewAuto, setAutoRenewAuto] = React.useState(true);

    React.useEffect(() => {
        if (!autoRenewAuto) return;
        const isMonthly = data.billing_period === 'monthly';
        if (data.auto_renew !== isMonthly) {
            setData('auto_renew', isMonthly);
        }
    }, [data.billing_period, data.auto_renew, setData, autoRenewAuto]);

    const guard = useLeaveGuard({ enabled: isDirty });
    const [previewOpen, setPreviewOpen] = React.useState(false);

    const handleConfirmSubmit = () => {
        const { rent_rupiah = '', deposit_rupiah = '' } = data;
        const rentCents =
            rent_rupiah !== '' ? Math.round(Number(rent_rupiah)) : 0;
        const depositCents =
            deposit_rupiah !== '' ? Math.round(Number(deposit_rupiah)) : 0;

        transform((d: ContractCreateForm & ContractCreateLocal) => ({
            user_id: d.user_id || undefined,
            room_id: d.room_id || undefined,
            start_date: d.start_date,
            end_date: d.end_date || undefined,
            rent_idr: rentCents,
            deposit_idr: depositCents,
            billing_period: d.billing_period,
            billing_day:
                d.billing_period === 'monthly'
                    ? Number(d.billing_day || '1')
                    : undefined,
            auto_renew: d.auto_renew,
            notes: d.notes || undefined,
            duration_count: Number(d.duration_count),
            monthly_payment_mode:
                d.billing_period === 'monthly'
                    ? d.monthly_payment_mode
                    : undefined,
        }));

        guard.skipWhile(() =>
            post(route('management.contracts.store'), {
                preserveScroll: true,
                onFinish: () => setPreviewOpen(false),
            }),
        );
    };

    const BREADCRUMBS: Crumb[] = [
        {
            label: tContract('list.title'),
            href: route('management.contracts.index'),
        },
        { label: tContract('create.title'), href: '#' },
    ];

    return (
        <AppLayout
            pageTitle={tContract('create.title')}
            pageDescription={tContract('list.desc')}
            breadcrumbs={BREADCRUMBS}
        >
            <Head title={tContract('create.title')} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setPreviewOpen(true);
                }}
                className="space-y-6"
            >
                <Card>
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>{tContract('info_title')}</CardTitle>
                        <ContractGuideDialog prorata={prorata} />
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        {/* Penyewa & Kamar */}
                        <TenantRoomSelect
                            userId={data.user_id}
                            roomId={data.room_id}
                            onUserChange={(v) => setData('user_id', v)}
                            onRoomChange={onRoomChange}
                            tenantOptions={tenantOptions}
                            roomOptions={roomOptions}
                            errors={{
                                user_id: errors.user_id,
                                room_id: errors.room_id,
                            }}
                        />

                        <fieldset
                            disabled={!canEditDetails}
                            className="contents"
                        >
                            <div className="grid gap-6 md:col-span-2 md:grid-cols-3">
                                {/* Periode Tagihan */}
                                <div className="space-y-2">
                                    <Label>
                                        {t('common.billing_period')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={data.billing_period}
                                        onValueChange={(v) => {
                                            setData('billing_period', v);
                                            setData('duration_count', '');
                                            setData(
                                                'monthly_payment_mode',
                                                'per_month',
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue
                                                placeholder={tContract(
                                                    'select_period',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {periods.map((p) => (
                                                    <SelectItem
                                                        key={p.value}
                                                        value={p.value}
                                                    >
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.billing_period}
                                    />
                                </div>

                                {/* Durasi */}
                                {data.billing_period === 'monthly' ? (
                                    <div className="space-y-2">
                                        <Label>
                                            {tContract('duration.months_label')}{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={String(
                                                data.duration_count || '',
                                            )}
                                            onValueChange={(v) =>
                                                setData('duration_count', v)
                                            }
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue
                                                    placeholder={tContract(
                                                        'select_duration',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {monthlyTerms.map((m) => (
                                                        <SelectItem
                                                            key={m}
                                                            value={String(m)}
                                                        >
                                                            {tContract(
                                                                'month_count',
                                                                {
                                                                    count: m,
                                                                },
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.duration_count}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>
                                            {data.billing_period === 'weekly'
                                                ? tContract(
                                                      'duration.weeks_label',
                                                  )
                                                : tContract(
                                                      'duration.days_label',
                                                  )}{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={
                                                data.billing_period === 'weekly'
                                                    ? weeklyMax
                                                    : dailyMax
                                            }
                                            value={data.duration_count || ''}
                                            onChange={(e) =>
                                                setData(
                                                    'duration_count',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9"
                                            placeholder={tContract(
                                                'select_duration',
                                            )}
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            {t('common.max')}{' '}
                                            {data.billing_period === 'weekly'
                                                ? tContract('week_count', {
                                                      count: weeklyMax,
                                                  })
                                                : tContract('day_count', {
                                                      count: dailyMax,
                                                  })}
                                            .
                                        </p>
                                        <InputError
                                            message={errors.duration_count}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>
                                        {tContract('start_date_label')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <DatePickerInput
                                        value={data.start_date}
                                        onChange={(v) =>
                                            setData('start_date', v ?? '')
                                        }
                                        placeholder={tContract(
                                            'start_date_placeholder',
                                        )}
                                        required
                                    />
                                    <InputError message={errors.start_date} />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset
                            disabled={!canEditDetails}
                            className="contents"
                        >
                            <NominalRow
                                rent={data.rent_rupiah}
                                deposit={data.deposit_rupiah}
                                onRent={(v) => setData('rent_rupiah', v)}
                                onDeposit={(v) => setData('deposit_rupiah', v)}
                                errors={{
                                    rent_idr: errors.rent_idr,
                                    deposit_idr: errors.deposit_idr,
                                }}
                                billingPeriod={
                                    data.billing_period as
                                        | 'daily'
                                        | 'weekly'
                                        | 'monthly'
                                }
                            />
                        </fieldset>

                        <fieldset
                            disabled={!canEditDetails}
                            className="contents"
                        >
                            <NotesPanel
                                value={data.notes ?? ''}
                                onChange={(v) => setData('notes', v)}
                                error={errors.notes}
                            />
                        </fieldset>

                        {data.billing_period === 'monthly' && (
                            <fieldset
                                disabled={!canEditDetails}
                                className="contents"
                            >
                                <div className="space-y-3 md:col-span-2">
                                    <div className="space-y-2">
                                        <Label>
                                            {tContract('payment_label')}
                                        </Label>
                                        <RadioGroup
                                            value={data.monthly_payment_mode}
                                            onValueChange={(v) =>
                                                setData(
                                                    'monthly_payment_mode',
                                                    v as 'per_month' | 'full',
                                                )
                                            }
                                            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6"
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem
                                                    id="pay_per_month"
                                                    value="per_month"
                                                />
                                                <Label
                                                    htmlFor="pay_per_month"
                                                    className="font-normal"
                                                >
                                                    {tContract('pay_per_month')}
                                                </Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem
                                                    id="pay_full"
                                                    value="full"
                                                />
                                                <Label
                                                    htmlFor="pay_full"
                                                    className="font-normal"
                                                >
                                                    {tContract('pay_full')}
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                        <InputError
                                            message={
                                                errors.monthly_payment_mode
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="auto_renew"
                                            checked={data.auto_renew}
                                            onCheckedChange={(v) => {
                                                setAutoRenewAuto(false);
                                                setData(
                                                    'auto_renew',
                                                    Boolean(v),
                                                );
                                            }}
                                        />
                                        <Label htmlFor="auto_renew">
                                            {tContract('auto_renew_contract')}
                                        </Label>
                                    </div>
                                </div>
                            </fieldset>
                        )}
                    </CardContent>
                </Card>

                <p className="text-muted-foreground text-sm">
                    {tContract('user_not_found_hint_prefix')}{' '}
                    <Link
                        href={route('management.users.index')}
                        className="underline"
                    >
                        {tContract('user_management_link')}
                    </Link>
                    .
                </p>

                <div className="flex gap-2">
                    <Button
                        type="submit"
                        disabled={processing || !canEditDetails}
                    >
                        {t('common.save')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => history.back()}
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            </form>

            <ContractPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                data={data}
                tenantOptions={tenantOptions}
                roomOptions={roomOptions}
                periodLabel={selectedPeriod?.label ?? data.billing_period}
                formatRupiah={formatIDR}
                processing={processing}
                onConfirm={handleConfirmSubmit}
            />

            <LeaveGuardDialog
                open={guard.open}
                onOpenChange={guard.setOpen}
                onConfirm={guard.proceed}
                onCancel={guard.cancel}
                description={<>{tContract('leave.desc')}</>}
            />
        </AppLayout>
    );
}
