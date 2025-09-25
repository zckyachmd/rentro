import { router } from '@inertiajs/react';
import { Filter, Plus, Search } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DataTableServer,
    type QueryBag,
} from '@/components/ui/data-table-server';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import CancelContractDialog from '@/features/contract/dialogs/cancel-contract-dialog';
import ContractsActionGuideDialog from '@/features/contract/dialogs/contracts-action-guide-dialog';
import HandoverCreate from '@/features/contract/dialogs/handover-create-dialog';
import ToggleAutoRenewDialog from '@/features/contract/dialogs/toggle-autorenew-dialog';
import { createColumns } from '@/features/contract/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
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
    const [keyword, setKeyword] = React.useState<string>(
        String((query as { q?: string | null }).q ?? ''),
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
        const trimmedQ = (keyword || '').trim();
        const hadQ =
            'q' in (q as Record<string, unknown>) &&
            Boolean((q as Record<string, unknown>).q);
        const payload: Record<string, unknown> = {
            page: 1,
            status: status || null,
            sort: q.sort ?? null,
            dir: q.dir ?? null,
        };
        if (trimmedQ) {
            payload.q = trimmedQ;
        } else if (hadQ) {
            payload.q = null;
        }
        safeOnQueryChange(payload as SafePayload);
    };

    const resetFilter = React.useCallback(() => {
        setStatus('');
        setKeyword('');
        safeOnQueryChange({ page: 1, status: null, q: null } as SafePayload);
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

    const headerActions = (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpenGuide(true)}
            >
                {tContract('list.guide')}
            </Button>
            <Button
                type="button"
                onClick={() =>
                    router.visit(route('management.contracts.create'))
                }
            >
                <Plus className="mr-2 h-4 w-4" /> {tContract('list.create')}
            </Button>
        </div>
    );

    return (
        <AuthLayout
            pageTitle={tContract('list.title')}
            pageDescription={tContract('list.desc')}
            titleIcon="ScrollText"
            actions={headerActions}
        >
            <div className="space-y-6">
                <ContractsActionGuideDialog
                    open={openGuide}
                    onOpenChange={setOpenGuide}
                />
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Filter className="h-4 w-4" />{' '}
                            {tContract('list.filter')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid items-end gap-3 md:grid-cols-2">
                            <div>
                                <Label htmlFor="contract-search">
                                    {t('datatable.search')}
                                </Label>
                                <div className="relative">
                                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        id="contract-search"
                                        className="h-9 pl-8"
                                        value={keyword}
                                        onChange={(e) =>
                                            setKeyword(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                applyFilters();
                                            }
                                        }}
                                        placeholder={t(
                                            'datatable.search_placeholder',
                                        )}
                                        aria-label={t(
                                            'datatable.search_placeholder',
                                        )}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="status">
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
                                    <SelectTrigger id="status" className="h-9">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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

                <Card>
                    <CardContent>
                        <DataTableServer<ContractItem, unknown>
                            columns={tableColumns}
                            rows={contracts}
                            paginator={paginator ?? null}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText={t('datatable.no_data')}
                            showColumn={false}
                            autoRefreshDefault="1m"
                            showRefresh={false}
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
        </AuthLayout>
    );
}
