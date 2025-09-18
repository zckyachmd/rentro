import { router } from '@inertiajs/react';
import { Filter, Plus, Search } from 'lucide-react';
import React from 'react';

import { Can } from '@/components/acl';
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
import { Textarea } from '@/components/ui/textarea';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import { createColumns } from '@/pages/management/contract/columns';
import ContractsGuideDialog from '@/pages/management/contract/dialogs/contracts-guide';
import HandoverCreate from '@/pages/management/contract/dialogs/handover-create';
import type {
    ContractItem,
    ContractsPageProps,
    ContractQueryInit as QueryInit,
    ContractSafePayload as SafePayload,
    ContractServerQuery as ServerQuery,
} from '@/types/management';

// types moved to pages/types

export default function ContractIndex(props: ContractsPageProps) {
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
    const [cancelReason, setCancelReason] = React.useState<string>('');
    const [toggleTarget, setToggleTarget] = React.useState<Target>(null);
    const [toggleReason, setToggleReason] = React.useState<string>('');
    const [checkinTarget, setCheckinTarget] = React.useState<Target>(null);
    const [checkoutTarget, setCheckoutTarget] = React.useState<Target>(null);

    const tableColumns = React.useMemo(
        () =>
            createColumns({
                onCancel: (c) => setCancelTarget(c),
                onStopAutoRenew: (c) => setToggleTarget(c),
                onStartAutoRenew: (c) => setToggleTarget(c),
                onCheckin: (c) => setCheckinTarget(c),
                onCheckout: (c) => setCheckoutTarget(c),
                requireCheckinForActivate:
                    handoverSettings.require_checkin_for_activate,
            }),
        [handoverSettings.require_checkin_for_activate],
    );

    const headerActions = (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpenGuide(true)}
            >
                Panduan Aksi
            </Button>
            <Button
                type="button"
                onClick={() =>
                    router.visit(route('management.contracts.create'))
                }
            >
                <Plus className="mr-2 h-4 w-4" /> Buat Kontrak
            </Button>
        </div>
    );

    return (
        <AuthLayout
            pageTitle="Kontrak"
            pageDescription="Kelola kontrak penyewa dan status perpanjangan."
            titleIcon="ScrollText"
            actions={headerActions}
        >
            <div className="space-y-6">
                <ContractsGuideDialog
                    open={openGuide}
                    onOpenChange={setOpenGuide}
                />
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Filter className="h-4 w-4" /> Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid items-end gap-3 md:grid-cols-2">
                            <div>
                                <Label htmlFor="contract-search">Cari</Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                        placeholder="Cari nomor kontrak/penyewa/kamar…"
                                        aria-label="Cari nomor kontrak, penyewa, atau kamar"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="status">Status</Label>
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
                                        <SelectValue placeholder="Semua" />
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
                                Terapkan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilter}
                            >
                                Reset
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
                            emptyText="Tidak ada kontrak."
                            showColumn={false}
                            autoRefreshDefault="1m"
                            showRefresh={false}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Cancel Contract Dialog */}
            <AlertDialog
                open={!!cancelTarget}
                onOpenChange={(v) => {
                    if (!v) {
                        setCancelTarget(null);
                        setCancelReason('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Kontrak</AlertDialogTitle>
                        <AlertDialogDescription>
                            Konfirmasi untuk membatalkan kontrak ini. Status
                            akan menjadi Cancelled dan auto‑renew dimatikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Alasan pembatalan</Label>
                        <Textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Contoh: pembatalan oleh tenant, salah input, dll."
                            required
                            rows={3}
                            autoFocus
                            maxLength={200}
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Wajib diisi. Jelaskan secara singkat.</span>
                            <span>{cancelReason.length}/200</span>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={!cancelReason.trim()}
                            onClick={() => {
                                const c = cancelTarget;
                                if (!c) return;
                                router.post(
                                    route('management.contracts.cancel', {
                                        contract: c.id,
                                    }),
                                    { reason: cancelReason },
                                    {
                                        preserveScroll: true,
                                        onFinish: () => {
                                            setCancelTarget(null);
                                            setCancelReason('');
                                        },
                                    },
                                );
                            }}
                        >
                            Ya, Batalkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                    onSaved={() => {
                        // Refresh contracts table only
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
                    onSaved={() => {
                        router.reload({ only: ['contracts'] });
                    }}
                />
            </Can>
            {/* Toggle Auto‑renew Dialog */}
            <AlertDialog
                open={!!toggleTarget}
                onOpenChange={(v) => {
                    if (!v) {
                        setToggleTarget(null);
                        setToggleReason('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {toggleTarget?.auto_renew
                                ? 'Hentikan Auto‑renew'
                                : 'Nyalakan Auto‑renew'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {toggleTarget?.auto_renew
                                ? 'Kontrak tidak akan diperpanjang otomatis di akhir periode.'
                                : 'Kontrak akan diperpanjang otomatis di akhir periode.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {toggleTarget?.auto_renew && (
                        <div className="space-y-2 py-2">
                            <Label>Alasan penghentian</Label>
                            <Textarea
                                value={toggleReason}
                                onChange={(e) =>
                                    setToggleReason(e.target.value)
                                }
                                placeholder="Contoh: permintaan tenant, penyesuaian kontrak, dll."
                                required
                                rows={3}
                                maxLength={200}
                            />
                            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>{toggleReason.length}/200</span>
                            </div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={
                                Boolean(toggleTarget?.auto_renew) &&
                                !toggleReason.trim()
                            }
                            onClick={() => {
                                const c = toggleTarget;
                                if (!c) return;
                                const next = !c.auto_renew;
                                router.post(
                                    route('management.contracts.setAutoRenew', {
                                        contract: c.id,
                                    }),
                                    next
                                        ? { auto_renew: next }
                                        : {
                                              auto_renew: next,
                                              reason: toggleReason,
                                          },
                                    {
                                        preserveScroll: true,
                                        onFinish: () => {
                                            setToggleTarget(null);
                                            setToggleReason('');
                                        },
                                    },
                                );
                            }}
                        >
                            Konfirmasi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthLayout>
    );
}

// Panduan dialog
// ContractsGuideDialog moved to dialogs/contracts-guide.tsx
