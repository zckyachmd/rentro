import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DataTableServer,
    type QueryBag,
} from '@/components/ui/data-table-server';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import { getJson } from '@/lib/api';
import { formatDate } from '@/lib/format';
import TenantHandoverDetailDialog from '@/pages/tenant/contract/dialogs/handover-detail-dialog';
import type {
    TenantContractsPageProps as ContractsPageProps,
    TenantContractQueryInit as QueryInit,
    TenantContractSafePayload as SafePayload,
    TenantContractServerQuery as ServerQuery,
    TenantContractItem,
    TenantHandover,
} from '@/types/tenant';

import { createColumns } from './columns';

export default function TenantContractIndex(props: ContractsPageProps) {
    const { t } = useTranslation();
    const { contracts: paginator, query = {}, options = {} } = props;
    const contracts: TenantContractItem[] = (paginator?.data ??
        []) as TenantContractItem[];
    const statuses = React.useMemo(
        () => options.statuses ?? [],
        [options.statuses],
    );
    const forfeitDays = React.useMemo(
        () => Number(options.forfeit_days ?? 7),
        [options.forfeit_days],
    );

    const [status, setStatus] = React.useState<string>(
        String((query as { status?: string | null }).status ?? ''),
    );
    // Search is handled by DataTableServer; no local keyword input here

    const qinit = (query as QueryInit) || {};
    const initial: QueryBag | undefined = Object.keys(qinit).length
        ? {
              page: qinit.page,
              perPage: qinit.per_page,
              sort: qinit.sort ?? null,
              dir: qinit.dir ?? null,
              ...(qinit.status ? { status: qinit.status } : {}),
              ...(qinit.q ? { q: qinit.q, search: qinit.q } : {}),
          }
        : undefined;

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const [processing, setProcessing] = React.useState(false);

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator,
        initial,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const safeOnQueryChange = React.useCallback(
        (payload: SafePayload) => {
            const merged: Record<string, unknown> = { ...payload };
            Object.keys(merged).forEach((k) => {
                if (merged[k] === undefined) delete merged[k];
            });
            // Normalize search: map to `q` for server while using `search` for table state
            if (Object.prototype.hasOwnProperty.call(merged, 'search')) {
                const val = merged['search'] as string | null | undefined;
                if (val === null) delete merged['search'];
                merged['q'] = val ?? null;
            }
            onQueryChange(merged as ServerQuery);
        },
        [onQueryChange],
    );

    const applyFilters = () => {
        // Apply only non-search filters; search is handled by table toolbar
        const payload: Record<string, unknown> = {
            page: 1,
            status: status || null,
            sort: q.sort ?? null,
            dir: q.dir ?? null,
        };
        safeOnQueryChange(payload as SafePayload);
    };

    const resetFilter = React.useCallback(() => {
        setStatus('');
        // Do not reset search here; only reset filters
        safeOnQueryChange({ page: 1, status: null } as SafePayload);
    }, [safeOnQueryChange]);

    const [stopTarget, setStopTarget] =
        React.useState<TenantContractItem | null>(null);
    const [ack, setAck] = React.useState(false);

    const [handoverDialog, setHandoverDialog] = React.useState<{
        open: boolean;
        data: TenantHandover | null;
    }>({ open: false, data: null });

    const openLatestHandover = React.useCallback(
        async (contractId: string, type: 'checkin' | 'checkout') => {
            try {
                const j = await getJson<{ handovers?: TenantHandover[] }>(
                    route('tenant.contracts.handovers.index', {
                        contract: contractId,
                    }),
                );
                const list = (j.handovers ?? []).filter(Boolean);
                const latest = list.find((h) => h.type === type) || null;
                if (!latest) {
                    window.alert(
                        type === 'checkin'
                            ? t('contract.no_checkin')
                            : t('contract.no_checkout'),
                    );
                    return;
                }
                setHandoverDialog({ open: true, data: latest });
            } catch {
                // ignore
            }
        },
        [t],
    );

    const daysUntil = (end?: string | null): number | null => {
        if (!end) return null;
        const endDate = new Date(end);
        const today = new Date();
        const d0 = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
        );
        const d1 = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
        );
        const diffMs = d1.getTime() - d0.getTime();
        return Math.max(0, Math.ceil(diffMs / 86_400_000));
    };

    return (
        <AppLayout
            pageTitle={t('contract.title')}
            pageDescription={t('contract.desc')}
        >
            <div className="space-y-6">
                {/* Filter (only non-search filters) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            {t('contract.filter')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid items-end gap-3 md:grid-cols-2">
                            <div>
                                <Label
                                    htmlFor="status"
                                    className="text-muted-foreground mb-1 block text-xs"
                                >
                                    {t('common.status')}
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={(v) => {
                                        setStatus(v);
                                        safeOnQueryChange({
                                            page: 1,
                                            status: v,
                                        });
                                    }}
                                >
                                    <SelectTrigger id="status" className="h-9 w-full md:w-[180px]">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {statuses.map((s) => {
                                                const slug = String(s.value)
                                                    .trim()
                                                    .toLowerCase()
                                                    .replace(/\s+/g, '_');
                                                return (
                                                    <SelectItem
                                                        key={s.value}
                                                        value={s.value}
                                                    >
                                                        {t(
                                                            `contract.status.${slug}`,
                                                            {
                                                                ns: 'enum',
                                                                defaultValue:
                                                                    s.label ??
                                                                    String(
                                                                        s.value,
                                                                    ),
                                                            },
                                                        )}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2 md:col-span-12">
                            <Button type="button" onClick={applyFilters}>
                                {t('common.apply')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilter}
                            >
                                {t('common.reset')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                        {/* Table */}
                <Card>
                    <CardContent>
                        <DataTableServer<TenantContractItem, unknown>
                            columns={createColumns({
                                onStopAutoRenew: (row) => setStopTarget(row),
                                onViewCheckin: (row) =>
                                    openLatestHandover(row.id, 'checkin'),
                                onViewCheckout: (row) =>
                                    openLatestHandover(row.id, 'checkout'),
                            })}
                            rows={contracts}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                safeOnQueryChange({
                                    page: 1,
                                    search: v,
                                    q: v || null,
                                } as SafePayload)
                            }
                            searchKey="number"
                            searchPlaceholder={t('nav.search.placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText={t('contract.empty')}
                            showColumn={false}
                            onRowClick={(row) =>
                                router.visit(
                                    route('tenant.contracts.show', {
                                        contract: row.id,
                                    }),
                                )
                            }
                        />
                    </CardContent>
                </Card>

                <AlertDialog
                    open={!!stopTarget}
                    onOpenChange={(v) => {
                        if (!v) {
                            setStopTarget(null);
                            setAck(false);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {t('contract.stop.title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('contract.stop.desc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        {/* Ringkasan singkat */}
                        <div className="bg-muted/40 rounded-md border p-3 text-sm">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="min-w-0">
                                    <div className="text-muted-foreground text-xs">
                                        {t('contract.stop.summary.end_date')}
                                    </div>
                                    <div className="font-medium">
                                        {formatDate(stopTarget?.end_date)}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-muted-foreground text-xs">
                                        {t('contract.stop.summary.days_left')}
                                    </div>
                                    <div className="font-mono tabular-nums">
                                        {(() => {
                                            const n = daysUntil(
                                                stopTarget?.end_date,
                                            );
                                            return n == null ? '-' : n;
                                        })()}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-muted-foreground text-xs">
                                        {t(
                                            'contract.stop.summary.forfeit_limit',
                                        )}
                                    </div>
                                    <div className="font-mono tabular-nums">
                                        {t('common.days', {
                                            count: forfeitDays,
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Peringatan / konsekuensi */}
                        <div className="space-y-3 py-2 text-sm">
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
                                <div className="flex items-center gap-2 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>
                                        {t('contract.stop.notice.title')}
                                    </span>
                                </div>
                                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                                    <li>
                                        {t('contract.stop.notice.no_guarantee')}
                                    </li>
                                    {(() => {
                                        const d = daysUntil(
                                            stopTarget?.end_date,
                                        );
                                        if (d != null && d < forfeitDays) {
                                            return (
                                                <li>
                                                    {t(
                                                        'contract.stop.notice.forfeit_now',
                                                        { days: forfeitDays },
                                                    )}
                                                </li>
                                            );
                                        }
                                        return (
                                            <li>
                                                {t(
                                                    'contract.stop.notice.forfeit_cond',
                                                    { days: forfeitDays },
                                                )}
                                            </li>
                                        );
                                    })()}
                                </ul>
                            </div>

                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="ack-stop-auto-renew"
                                    checked={ack}
                                    onCheckedChange={(v) => setAck(Boolean(v))}
                                />
                                <Label
                                    htmlFor="ack-stop-auto-renew"
                                    className="cursor-pointer leading-snug"
                                >
                                    {t('contract.stop.confirm_ack')}
                                </Label>
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                {t('common.cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                disabled={!ack}
                                onClick={() => {
                                    const c = stopTarget;
                                    if (!c) return;
                                    setProcessing(true);
                                    router.post(
                                        route(
                                            'tenant.contracts.stopAutoRenew',
                                            { contract: c.id },
                                        ),
                                        { confirm: true },
                                        {
                                            preserveScroll: true,
                                            onFinish: () => {
                                                setProcessing(false);
                                                setStopTarget(null);
                                                setAck(false);
                                            },
                                        },
                                    );
                                }}
                            >
                                {t('contract.stop.disable_button')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <TenantHandoverDetailDialog
                    open={handoverDialog.open}
                    onOpenChange={(o) =>
                        setHandoverDialog((s) => ({ ...s, open: o }))
                    }
                    handover={handoverDialog.data}
                />
            </div>
        </AppLayout>
    );
}
