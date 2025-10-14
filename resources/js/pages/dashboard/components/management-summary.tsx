import { router } from '@inertiajs/react';
import {
    Banknote,
    Building2,
    CalendarClock,
    FileWarning,
    Filter,
    Info,
    LineChart,
    LogOut,
    Users,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TooltipProps } from 'recharts';
// Lazy-load recharts at runtime to keep initial bundle light
const Recharts = {
    mod: null as null | typeof import('recharts'),
};

import { DatePickerInput } from '@/components/date-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    TooltipContent,
    TooltipTrigger,
    Tooltip as UiTooltip,
} from '@/components/ui/tooltip';
import { toISO } from '@/lib/date';
import { formatDate, formatIDR } from '@/lib/format';
import { variantForContractStatus } from '@/lib/status';
import type {
    Filters,
    ManagementPayload,
    PaymentRecent,
    UpcomingItem,
} from '@/types/dashboard';

const RevenueTooltipContent = ({
    active,
    payload,
    label,
}: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const amount = Number(payload[0]?.value ?? 0);
    return (
        <div className="bg-popover text-popover-foreground rounded-md border p-2 shadow-md">
            <div className="text-muted-foreground text-[10px]">
                {formatDate(String(label))}
            </div>
            <div className="mt-1 text-sm font-semibold">
                {formatIDR(amount)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px]">
                <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: '#16a34a' }}
                />
                <span>Revenue</span>
            </div>
        </div>
    );
};

const InvoicesTooltipContent = ({
    active,
    payload,
    label,
}: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="bg-popover text-popover-foreground rounded-md border p-2 shadow-md">
            <div className="text-muted-foreground text-[10px]">
                {formatDate(String(label))}
            </div>
            <div className="mt-1 space-y-1">
                {payload.map((p, idx) => {
                    const color =
                        (p as unknown as { color?: string })?.color || '#999';
                    const val = Number(p.value ?? 0);
                    return (
                        <div
                            key={idx}
                            className="flex items-center justify-between gap-3 text-[11px]"
                        >
                            <div className="flex items-center gap-1">
                                <span
                                    className="inline-block h-2 w-2 rounded-sm"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="capitalize">{p.name}</span>
                            </div>
                            <span className="font-medium">{val}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function ManagementSummary({
    management,
    filters,
}: {
    management: ManagementPayload;
    filters?: Filters;
}) {
    const { t } = useTranslation();
    const [start, setStart] = React.useState<string | null>(
        filters?.start || null,
    );
    const [end, setEnd] = React.useState<string | null>(filters?.end || null);

    // Lazy-load recharts when this component mounts
    const [chartsReady, setChartsReady] = React.useState(false);
    React.useEffect(() => {
        let mounted = true;
        import('recharts').then((m) => {
            if (!mounted) return;
            Recharts.mod = m;
            setChartsReady(true);
        });
        return () => {
            mounted = false;
        };
    }, []);

    const onApplyFilter = () => {
        const params: Record<string, string> = {};
        if (start) params.start = start;
        if (end) params.end = end;
        router.get(route('dashboard'), params, {
            preserveScroll: true,
            preserveState: true,
        });
    };
    const setPreset = (days: number) => {
        const e = new Date();
        const s = new Date();
        s.setDate(e.getDate() - (days - 1));
        const sISO = toISO(s);
        const eISO = toISO(e);
        setStart(sISO);
        setEnd(eISO);
        router.get(
            route('dashboard'),
            { start: sISO, end: eISO },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };
    const setPresetMTD = () => {
        const e = new Date();
        const s = new Date(e.getFullYear(), e.getMonth(), 1);
        const sISO = toISO(s);
        const eISO = toISO(e);
        setStart(sISO);
        setEnd(eISO);
        router.get(
            route('dashboard'),
            { start: sISO, end: eISO },
            { preserveScroll: true, preserveState: true },
        );
    };
    const setPresetWTD = () => {
        const e = new Date();
        const dow = e.getDay();
        const mondayOffset = (dow + 6) % 7;
        const s = new Date(e);
        s.setDate(e.getDate() - mondayOffset);
        const sISO = toISO(s);
        const eISO = toISO(e);
        setStart(sISO);
        setEnd(eISO);
        router.get(
            route('dashboard'),
            { start: sISO, end: eISO },
            { preserveScroll: true, preserveState: true },
        );
    };
    const setPresetQTD = () => {
        const e = new Date();
        const m = e.getMonth();
        const qStartMonth = Math.floor(m / 3) * 3;
        const s = new Date(e.getFullYear(), qStartMonth, 1);
        const sISO = toISO(s);
        const eISO = toISO(e);
        setStart(sISO);
        setEnd(eISO);
        router.get(
            route('dashboard'),
            { start: sISO, end: eISO },
            { preserveScroll: true, preserveState: true },
        );
    };
    const setPresetYTD = () => {
        const e = new Date();
        const s = new Date(e.getFullYear(), 0, 1);
        const sISO = toISO(s);
        const eISO = toISO(e);
        setStart(sISO);
        setEnd(eISO);
        router.get(
            route('dashboard'),
            { start: sISO, end: eISO },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Filter className="h-4 w-4" />{' '}
                        {t('dashboard.filters.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] md:items-end">
                        <div>
                            <label className="text-muted-foreground mb-1 block text-xs">
                                {t('dashboard.filters.start')}
                            </label>
                            <DatePickerInput
                                value={start}
                                onChange={setStart}
                            />
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1 block text-xs">
                                {t('dashboard.filters.end')}
                            </label>
                            <DatePickerInput value={end} onChange={setEnd} />
                        </div>
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onApplyFilter}
                            >
                                {t('dashboard.filters.apply')}
                            </Button>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                            {t('dashboard.filters.quick')}:
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setPreset(7)}
                        >
                            7D
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setPreset(30)}
                        >
                            30D
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setPreset(90)}
                        >
                            90D
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={setPresetMTD}
                        >
                            {t('dashboard.filters.mtd')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={setPresetWTD}
                        >
                            {t('dashboard.filters.wtd')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={setPresetQTD}
                        >
                            {t('dashboard.filters.qtd')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={setPresetYTD}
                        >
                            {t('dashboard.filters.ytd')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-7 px-2 text-xs"
                            onClick={() => {
                                setStart(null);
                                setEnd(null);
                                router.get(
                                    route('dashboard'),
                                    {},
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                );
                            }}
                        >
                            {t('common.reset')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.metrics.occupancy')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.occupancy')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {Math.round(
                                    (management.rooms?.occupancy_rate ?? 0) *
                                        100,
                                )}
                                %
                            </div>
                            <LineChart className="text-muted-foreground h-6 w-6" />
                        </div>
                        <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded">
                            {(() => {
                                const avail = Math.max(
                                    0,
                                    Number(management.rooms?.available ?? 0),
                                );
                                const occ = Math.max(
                                    0,
                                    Number(management.rooms?.occupied ?? 0),
                                );
                                const res = Math.max(
                                    0,
                                    Number(management.rooms?.reserved ?? 0),
                                );
                                const vac = Math.max(
                                    0,
                                    Number(management.rooms?.vacant ?? 0),
                                );
                                const toPct = (n: number) =>
                                    avail > 0
                                        ? Math.round((n / avail) * 1000) / 10
                                        : 0;
                                const wOcc = toPct(occ);
                                const wRes = toPct(res);
                                const wVac = toPct(vac);
                                return (
                                    <div className="flex h-full w-full">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{
                                                width: `${wOcc}%`,
                                            }}
                                        />
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{
                                                width: `${wRes}%`,
                                            }}
                                        />
                                        <div
                                            className="h-full bg-zinc-300 dark:bg-zinc-700"
                                            style={{
                                                width: `${wVac}%`,
                                            }}
                                        />
                                    </div>
                                );
                            })()}
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('dashboard.metrics.occupancy_hint', {
                                used:
                                    (management.rooms?.reserved ?? 0) +
                                    (management.rooms?.occupied ?? 0),
                                avail: management.rooms?.available ?? 0,
                            })}
                        </p>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
                            <span className="inline-flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />
                                {t('dashboard.metrics.occupied')}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-sm bg-blue-500" />
                                {t('dashboard.metrics.reserved')}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-sm bg-zinc-400 dark:bg-zinc-600" />
                                {t('dashboard.metrics.vacant')}
                            </span>
                        </div>
                        <a
                            className="text-primary mt-1 inline-block text-xs hover:underline"
                            href={route('management.rooms.index', {
                                status: 'occupied',
                            })}
                        >
                            {t('dashboard.actions.view_rooms')}
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.metrics.rooms_available')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.rooms_available')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {management.rooms?.vacant ?? 0}
                            </div>
                            <Building2 className="text-muted-foreground h-6 w-6" />
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('dashboard.metrics.rooms_hint', {
                                occupied: management.rooms?.occupied ?? 0,
                                total: management.rooms?.total ?? 0,
                            })}
                        </p>
                        <a
                            className="text-primary mt-1 inline-block text-xs hover:underline"
                            href={route('management.rooms.index', {
                                status: 'vacant',
                            })}
                        >
                            {t('dashboard.actions.view_rooms')}
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.metrics.contracts_active')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.contracts_active')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {management.contracts?.active ?? 0}
                            </div>
                            <Users className="text-muted-foreground h-6 w-6" />
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('dashboard.metrics.contracts_hint', {
                                booked: management.contracts?.booked ?? 0,
                                pending:
                                    management.contracts?.pending_payment ?? 0,
                            })}
                        </p>
                        <a
                            className="text-primary mt-1 inline-block text-xs hover:underline"
                            href={route('management.contracts.index', {
                                status: 'active',
                            })}
                        >
                            {t('dashboard.actions.view_contracts')}
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.metrics.invoices_unpaid')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.invoices_unpaid')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {(management.invoices?.pending ?? 0) +
                                    (management.invoices?.overdue ?? 0)}
                            </div>
                            <FileWarning className="text-muted-foreground h-6 w-6" />
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('dashboard.metrics.invoices_overdue', {
                                count: management.invoices?.overdue ?? 0,
                            })}
                        </p>
                        <div className="mt-1 space-x-2 text-xs">
                            {(() => {
                                const mk = (status: string) => {
                                    const qs = new URLSearchParams();
                                    qs.set('status', status);
                                    if (start) qs.set('start', start);
                                    if (end) qs.set('end', end);
                                    return `${route('management.invoices.index')}?${qs.toString()}`;
                                };
                                return (
                                    <>
                                        <a
                                            className="text-primary hover:underline"
                                            href={mk('pending')}
                                        >
                                            {t(
                                                'dashboard.actions.view_pending',
                                            )}
                                        </a>
                                        <span className="text-muted-foreground">
                                            •
                                        </span>
                                        <a
                                            className="text-primary hover:underline"
                                            href={mk('overdue')}
                                        >
                                            {t(
                                                'dashboard.actions.view_overdue',
                                            )}
                                        </a>
                                    </>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.metrics.revenue_mtd')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.revenue_mtd')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-semibold">
                                {formatIDR(management.payments?.mtd ?? 0)}
                            </div>
                            <Banknote className="text-muted-foreground h-6 w-6" />
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('dashboard.metrics.revenue_7d', {
                                amount: formatIDR(
                                    management.payments?.last7d ?? 0,
                                ),
                            })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.metrics.outstanding_total')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.outstanding_total')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {formatIDR(
                                management.invoices?.total_outstanding ?? 0,
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('dashboard.metrics.revenue_today', {
                                amount: formatIDR(
                                    management.payments?.today ?? 0,
                                ),
                            })}
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('dashboard.metrics.recent_payments')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.metrics.recent_payments_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm">
                            {(
                                (management.payments?.recent as
                                    | PaymentRecent[]
                                    | undefined) ?? []
                            ).map((p) => (
                                <li
                                    key={p.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">
                                            {p.tenant || '-'}
                                        </div>
                                        <div className="text-muted-foreground truncate">
                                            {(p.room || '-') +
                                                ' • ' +
                                                (p.invoice_no || '-')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">
                                            {formatIDR(p.amount)}
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            {formatDate(p.paid_at, true)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {(!management.payments?.recent ||
                                management.payments.recent.length === 0) && (
                                <li className="text-muted-foreground text-sm">
                                    {t('dashboard.metrics.no_recent_payments')}
                                </li>
                            )}
                        </ul>
                        <div className="mt-3 text-right">
                            {(() => {
                                const qs = new URLSearchParams();
                                if (start) qs.set('start', start);
                                if (end) qs.set('end', end);
                                const href = `${route('management.payments.index')}${qs.toString() ? `?${qs.toString()}` : ''}`;
                                return (
                                    <a
                                        className="text-primary text-xs hover:underline"
                                        href={href}
                                    >
                                        {t('dashboard.actions.view_all')}
                                    </a>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue chart */}
                <Card className="md:col-span-2 lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('dashboard.metrics.revenue_trend')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.metrics.revenue_range', {
                                amount: formatIDR(
                                    management.payments?.range ?? 0,
                                ),
                            })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        {chartsReady && Recharts.mod ? (
                            <Recharts.mod.ResponsiveContainer width="100%" height="100%">
                                <Recharts.mod.AreaChart
                                    data={management.payments?.series || []}
                                    margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <Recharts.mod.CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <Recharts.mod.XAxis dataKey="date" tick={{ fontSize: 12 }} hide={false} />
                                    <Recharts.mod.YAxis
                                        tickFormatter={(v: number) => (v >= 1000000 ? `${Math.round(v / 1000000)}jt` : `${Math.round(v / 1000)}rb`)}
                                        tick={{ fontSize: 12 }}
                                        width={48}
                                    />
                                    <Recharts.mod.Tooltip content={<RevenueTooltipContent />} />
                                    <Recharts.mod.Area type="monotone" dataKey="amount" stroke="#16a34a" fill="url(#rev)" strokeWidth={2} />
                                </Recharts.mod.AreaChart>
                            </Recharts.mod.ResponsiveContainer>
                        ) : (
                            <div className="bg-muted/50 h-full animate-pulse rounded-md" />
                        )}
                    </CardContent>
                </Card>

                {/* Invoice counts chart */}
                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('dashboard.metrics.invoices_trend')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.metrics.invoices_trend_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        {chartsReady && Recharts.mod ? (
                            <Recharts.mod.ResponsiveContainer width="100%" height="100%">
                                <Recharts.mod.BarChart
                                    data={management.invoices?.series || []}
                                    margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                                >
                                    <Recharts.mod.CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <Recharts.mod.XAxis dataKey="date" tick={{ fontSize: 12 }} hide={false} />
                                    <Recharts.mod.YAxis tick={{ fontSize: 12 }} width={28} allowDecimals={false} />
                                    <Recharts.mod.Tooltip content={<InvoicesTooltipContent />} />
                                    <Recharts.mod.Bar dataKey="issued" name={t('dashboard.metrics.issued')} fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                    <Recharts.mod.Bar dataKey="paid" name={t('dashboard.metrics.paid')} fill="#16a34a" radius={[2, 2, 0, 0]} />
                                </Recharts.mod.BarChart>
                            </Recharts.mod.ResponsiveContainer>
                        ) : (
                            <div className="bg-muted/50 h-full animate-pulse rounded-md" />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming check-in/checkout */}
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:gap-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('dashboard.upcoming.checkins')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.upcoming.within_7d')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm">
                            {(
                                (management.upcoming?.checkins as
                                    | UpcomingItem[]
                                    | undefined) ?? []
                            ).map((c) => (
                                <li
                                    key={c.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <CalendarClock className="text-muted-foreground h-4 w-4" />
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">
                                                {c.tenant || '-'}
                                            </div>
                                            <div className="text-muted-foreground truncate">
                                                {(c.room || '-') +
                                                    ' • ' +
                                                    formatDate(c.date)}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={variantForContractStatus(
                                            String(c.status || ''),
                                        )}
                                        className="capitalize"
                                    >
                                        {t(
                                            `contract.status.${String(
                                                c.status || '',
                                            )
                                                .toLowerCase()
                                                .replace(/\s+/g, '_')}`,
                                            {
                                                ns: 'enum',
                                                defaultValue: String(
                                                    c.status || '-',
                                                ),
                                            },
                                        )}
                                    </Badge>
                                </li>
                            ))}
                            {(!management.upcoming?.checkins ||
                                management.upcoming.checkins.length === 0) && (
                                <li className="text-muted-foreground text-sm">
                                    {t('dashboard.upcoming.empty')}
                                </li>
                            )}
                        </ul>
                        <div className="mt-3 text-right">
                            <a
                                className="text-primary text-xs hover:underline"
                                href={route('management.contracts.index')}
                            >
                                {t('dashboard.actions.view_all')}
                            </a>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('dashboard.upcoming.checkouts')}
                        </CardTitle>
                        <CardDescription>
                            {t('dashboard.upcoming.within_7d')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm">
                            {(
                                (management.upcoming?.checkouts as
                                    | UpcomingItem[]
                                    | undefined) ?? []
                            ).map((c) => (
                                <li
                                    key={c.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <LogOut className="text-muted-foreground h-4 w-4" />
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">
                                                {c.tenant || '-'}
                                            </div>
                                            <div className="text-muted-foreground truncate">
                                                {(c.room || '-') +
                                                    ' • ' +
                                                    formatDate(c.date)}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={variantForContractStatus(
                                            String(c.status || ''),
                                        )}
                                        className="capitalize"
                                    >
                                        {t(
                                            `contract.status.${String(
                                                c.status || '',
                                            )
                                                .toLowerCase()
                                                .replace(/\s+/g, '_')}`,
                                            {
                                                ns: 'enum',
                                                defaultValue: String(
                                                    c.status || '-',
                                                ),
                                            },
                                        )}
                                    </Badge>
                                </li>
                            ))}
                            {(!management.upcoming?.checkouts ||
                                management.upcoming.checkouts.length === 0) && (
                                <li className="text-muted-foreground text-sm">
                                    {t('dashboard.upcoming.empty')}
                                </li>
                            )}
                        </ul>
                        <div className="mt-3 text-right">
                            <a
                                className="text-primary text-xs hover:underline"
                                href={route('management.contracts.index')}
                            >
                                {t('dashboard.actions.view_all')}
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
