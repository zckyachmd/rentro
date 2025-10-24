import { router } from '@inertiajs/react';
import { Filter, Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import { DatePickerInput } from '@/components/date-picker';
import { QuickRange } from '@/components/quick-range';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import CancelContractDialog from '@/pages/management/contract/dialogs/cancel-contract-dialog';
import ContractsActionGuideDialog from '@/pages/management/contract/dialogs/contracts-action-guide-dialog';
import HandoverCreate from '@/pages/management/contract/dialogs/handover-create-dialog';
import ToggleAutoRenewDialog from '@/pages/management/contract/dialogs/toggle-autorenew-dialog';
import { createColumns } from '@/pages/management/contract/tables/columns';
import type {
    ContractItem,
    ContractsPageProps,
    ContractQueryInit as QueryInit,
    ContractSafePayload as SafePayload,
    ContractServerQuery as ServerQuery,
} from '@/types/management';

export default function ContractIndex(props: ContractsPageProps) {
    const { t, i18n } = useTranslation();
    const { t: tContract } = useTranslation('management/contract');
    const {
        contracts: paginator,
        query = {},
        options = {},
        handover: handoverOptions,
    } = props;
    const contracts: ContractItem[] = (paginator?.data ?? []) as ContractItem[];
    const statuses = React.useMemo(
        () => options.statuses ?? [],
        [options.statuses],
    );

    const handoverSettings = React.useMemo(
        () => ({
            min_photos_checkin: Math.max(
                0,
                handoverOptions?.min_photos_checkin ?? 0,
            ),
            min_photos_checkout: Math.max(
                0,
                handoverOptions?.min_photos_checkout ?? 0,
            ),
            require_checkin_for_activate: Boolean(
                handoverOptions?.require_checkin_for_activate ?? false,
            ),
        }),
        [
            handoverOptions?.min_photos_checkin,
            handoverOptions?.min_photos_checkout,
            handoverOptions?.require_checkin_for_activate,
        ],
    );

    const [status, setStatus] = React.useState<string>(
        String((query as { status?: string | null }).status ?? ''),
    );
    const [start, setStart] = React.useState<string | null>(
        (query as { start?: string | null }).start ?? null,
    );
    const [end, setEnd] = React.useState<string | null>(
        (query as { end?: string | null }).end ?? null,
    );

    const qinit = (query as QueryInit) || {};
    const initial: QueryBag | undefined = Object.keys(qinit).length
        ? {
              page: qinit.page,
              perPage: qinit.per_page,
              sort: qinit.sort ?? null,
              dir: qinit.dir ?? null,
              ...(qinit.status ? { status: qinit.status } : {}),
              ...(qinit.q ? { q: qinit.q } : {}),
          }
        : undefined;

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const [processing, setProcessing] = React.useState(false);
    const [openGuide, setOpenGuide] = React.useState(false);

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
            if (
                Object.prototype.hasOwnProperty.call(merged, 'search') &&
                merged['search'] === null
            ) {
                delete merged['search'];
            }
            onQueryChange(merged as ServerQuery);
        },
        [onQueryChange],
    );

    const applyFilters = () => {
        const payload: Record<string, unknown> = {
            page: 1,
            status: status || null,
            sort: q.sort ?? null,
            dir: q.dir ?? null,
            start: start || null,
            end: end || null,
        };
        safeOnQueryChange(payload as SafePayload);
    };

    const resetFilter = React.useCallback(() => {
        setStatus('');
        safeOnQueryChange({
            page: 1,
            status: null,
            q: null,
            search: '',
            start: null,
            end: null,
        } as SafePayload);
    }, [safeOnQueryChange]);

    type Target = ContractItem | null;
    const [cancelTarget, setCancelTarget] = React.useState<Target>(null);
    const [toggleTarget, setToggleTarget] = React.useState<Target>(null);
    const [checkinTarget, setCheckinTarget] = React.useState<Target>(null);
    const [checkoutTarget, setCheckoutTarget] = React.useState<Target>(null);

    const lang = i18n.language;
    const tableColumns = React.useMemo(() => {
        void lang;
        return createColumns({
            onCancel: (c) => setCancelTarget(c),
            onStopAutoRenew: (c) => setToggleTarget(c),
            onStartAutoRenew: (c) => setToggleTarget(c),
            onCheckin: (c) => setCheckinTarget(c),
            onCheckout: (c) => setCheckoutTarget(c),
            requireCheckinForActivate:
                handoverSettings.require_checkin_for_activate,
        });
    }, [handoverSettings.require_checkin_for_activate, lang]);

    return (
        <AppLayout
            pageTitle={tContract('list.title')}
            pageDescription={tContract('list.desc')}
            titleIcon="ScrollText"
        >
            <div className="space-y-6">
                <ContractsActionGuideDialog
                    open={openGuide}
                    onOpenChange={setOpenGuide}
                />
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Filter className="h-4 w-4" />{' '}
                                {t('common.filter')}
                            </CardTitle>
                            {props.summary ? (
                                <div className="text-muted-foreground text-xs">
                                    <span className="mr-3">
                                        {t('common.total', 'Total')}:{' '}
                                        <span className="text-foreground font-medium">
                                            {props.summary.count}
                                        </span>
                                    </span>
                                    <span className="mr-3">
                                        {tContract('summary.active', 'Active')}:{' '}
                                        <span className="text-foreground font-medium">
                                            {props.summary.count_active}
                                        </span>
                                    </span>
                                    <span className="mr-3">
                                        {tContract('summary.booked', 'Booked')}:{' '}
                                        <span className="text-foreground font-medium">
                                            {props.summary.count_booked}
                                        </span>
                                    </span>
                                    <span className="mr-3">
                                        {tContract(
                                            'summary.pending_payment',
                                            'Pending',
                                        )}
                                        :{' '}
                                        <span className="text-foreground font-medium">
                                            {props.summary.count_pending}
                                        </span>
                                    </span>
                                    <span>
                                        {tContract(
                                            'summary.overdue',
                                            'Overdue',
                                        )}
                                        :{' '}
                                        <span className="text-foreground font-medium">
                                            {props.summary.count_overdue}
                                        </span>
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
                            <div>
                                <Label
                                    htmlFor="status"
                                    className="text-muted-foreground mb-1 block text-xs"
                                >
                                    {t('common.status')}
                                </Label>
                                <Select
                                    value={status !== '' ? status : 'all'}
                                    onValueChange={(v) => {
                                        const next = v === 'all' ? '' : v;
                                        setStatus(next);
                                        safeOnQueryChange({
                                            page: 1,
                                            status: v === 'all' ? null : v,
                                        });
                                    }}
                                >
                                    <SelectTrigger
                                        id="status"
                                        className="w-full md:w-[160px]"
                                    >
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                {t('common.all_statuses')}
                                            </SelectItem>
                                            {statuses.map((s) => (
                                                <SelectItem
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('dashboard.filters.start')}
                                </Label>
                                <DatePickerInput
                                    value={start}
                                    onChange={setStart}
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('dashboard.filters.end')}
                                </Label>
                                <DatePickerInput
                                    value={end}
                                    onChange={setEnd}
                                />
                            </div>
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={applyFilters}
                                >
                                    {t('common.apply')}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 md:col-span-12">
                            <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <QuickRange
                                        onSelect={(s, e) => {
                                            setStart(s);
                                            setEnd(e);
                                            safeOnQueryChange({
                                                page: 1,
                                                start: s,
                                                end: e,
                                            } as SafePayload);
                                        }}
                                        showReset
                                        onReset={resetFilter}
                                    />
                                </div>
                                <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:shrink-0 md:flex-nowrap">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const qs = new URLSearchParams();
                                            if (status)
                                                qs.set('status', status);
                                            const currentSearch =
                                                (q as QueryBag).search ?? '';
                                            if (currentSearch)
                                                qs.set('q', currentSearch);
                                            if (start) qs.set('start', start);
                                            if (end) qs.set('end', end);
                                            const url = `${route('management.contracts.export')}${qs.toString() ? `?${qs.toString()}` : ''}`;
                                            if (typeof window !== 'undefined')
                                                window.open(url, '_blank');
                                        }}
                                    >
                                        {t('common.export_csv')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setOpenGuide(true)}
                                    >
                                        {tContract('list.guide')}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() =>
                                            router.visit(
                                                route(
                                                    'management.contracts.create',
                                                ),
                                            )
                                        }
                                    >
                                        <Plus className="mr-2 h-4 w-4" />{' '}
                                        {tContract('list.create')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<ContractItem, unknown>
                            columns={tableColumns}
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
                            emptyText={t('datatable.no_data')}
                            showColumn
                            autoRefreshDefault="1m"
                            showRefresh
                        />
                    </CardContent>
                </Card>
            </div>

            <CancelContractDialog
                target={cancelTarget}
                onOpenChange={(o) => {
                    if (!o) setCancelTarget(null);
                }}
                onConfirm={(reason) => {
                    const c = cancelTarget;
                    if (!c) return;
                    router.post(
                        route('management.contracts.cancel', {
                            contract: c.id,
                        }),
                        { reason },
                        {
                            preserveScroll: true,
                            onFinish: () => setCancelTarget(null),
                        },
                    );
                }}
            />

            <Can any={['handover.create']}>
                <HandoverCreate
                    open={!!checkinTarget}
                    onOpenChange={(o) => {
                        if (!o) setCheckinTarget(null);
                    }}
                    contractId={checkinTarget?.id ?? null}
                    mode="checkin"
                    minPhotosCheckin={handoverSettings.min_photos_checkin}
                    minPhotosCheckout={handoverSettings.min_photos_checkout}
                    redo={
                        String(
                            checkinTarget?.latest_checkin_status || '',
                        ).toLowerCase() === 'disputed'
                    }
                    onSaved={() => {
                        router.reload({ only: ['contracts'] });
                    }}
                />
                <HandoverCreate
                    open={!!checkoutTarget}
                    onOpenChange={(o) => {
                        if (!o) setCheckoutTarget(null);
                    }}
                    contractId={checkoutTarget?.id ?? null}
                    mode="checkout"
                    minPhotosCheckin={handoverSettings.min_photos_checkin}
                    minPhotosCheckout={handoverSettings.min_photos_checkout}
                    redo={
                        String(
                            checkoutTarget?.latest_checkout_status || '',
                        ).toLowerCase() === 'disputed'
                    }
                    onSaved={() => {
                        router.reload({ only: ['contracts'] });
                    }}
                />
            </Can>

            <ToggleAutoRenewDialog
                target={toggleTarget}
                onOpenChange={(o) => {
                    if (!o) setToggleTarget(null);
                }}
                onConfirm={(reason) => {
                    const c = toggleTarget;
                    if (!c) return;
                    const next = !c.auto_renew;
                    router.post(
                        route('management.contracts.setAutoRenew', {
                            contract: c.id,
                        }),
                        next
                            ? { auto_renew: next }
                            : { auto_renew: next, reason },
                        {
                            preserveScroll: true,
                            onFinish: () => setToggleTarget(null),
                        },
                    );
                }}
            />
        </AppLayout>
    );
}
