import { router } from '@inertiajs/react';
import { Filter, Plus } from 'lucide-react';
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
import RoomDetailDialog from '@/pages/management/room/dialogs/detail-dialog';
import { createColumns } from '@/pages/management/room/tables/columns';
import type {
    RoomFilters as Filters,
    RoomQueryInit as QueryInit,
    RoomItem,
    RoomsPageProps,
    RoomSafePayload as SafePayload,
} from '@/types/management';

export default function RoomIndex(props: RoomsPageProps) {
    const { t: tRoom } = useTranslation('management/room');
    const { t, i18n } = useTranslation();
    const { rooms: paginator, query = {}, options: opt = {} } = props;
    const rooms: RoomItem[] = (paginator?.data ?? []) as RoomItem[];
    const {
        buildings: buildingsOpt = [],
        floors: floorsOpt = [],
        types: typesOpt = [],
        statuses: statusesOpt,
    } = opt;

    const buildings = React.useMemo(() => buildingsOpt, [buildingsOpt]);
    const floors = React.useMemo(() => floorsOpt, [floorsOpt]);
    const types = React.useMemo(() => typesOpt, [typesOpt]);
    const statuses = React.useMemo(() => statusesOpt ?? [], [statusesOpt]);

    const [filters, setFilters] = React.useState<Filters>({
        building_id: String(query.building_id ?? ''),
        floor_id: String(query.floor_id ?? ''),
        type_id: String(query.type_id ?? ''),
        status: String(query.status ?? ''),
        gender_policy: String(query.gender_policy ?? ''),
        q: String(query.q ?? ''),
    });

    const filteredFloors = React.useMemo(
        () =>
            floors.filter(
                (f) =>
                    !filters.building_id ||
                    String(f.building_id) === filters.building_id,
            ),
        [floors, filters.building_id],
    );

    const qinit = (query as QueryInit) || {};
    const initial: QueryBag | undefined = Object.keys(qinit).length
        ? {
              search: qinit.search,
              page: qinit.page,
              perPage: qinit.per_page ?? qinit.perPage,
              sort: qinit.sort ?? null,
              dir: qinit.dir ?? null,
              ...(qinit.q ? { q: qinit.q } : {}),
              ...(qinit.building_id ? { building_id: qinit.building_id } : {}),
              ...(qinit.floor_id ? { floor_id: qinit.floor_id } : {}),
              ...(qinit.type_id ? { type_id: qinit.type_id } : {}),
              ...(qinit.status ? { status: qinit.status } : {}),
              ...(qinit.gender_policy
                  ? { gender_policy: qinit.gender_policy }
                  : {}),
          }
        : undefined;

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );
    const [processing, setProcessing] = React.useState(false);
    const [deletingRoom, setDeletingRoom] = React.useState<RoomItem | null>(
        null,
    );
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailItem, setDetailItem] = React.useState<RoomItem | null>(null);

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator,
        initial,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const [pricePeriod, setPricePeriod] = React.useState<
        'daily' | 'weekly' | 'monthly' | 'all'
    >(
        ((qinit.price_period as string | undefined) ?? 'all') as
            | 'daily'
            | 'weekly'
            | 'monthly'
            | 'all',
    );

    React.useEffect(() => {
        try {
            const saved = localStorage.getItem('rentro:rooms:price_period');
            if (
                saved &&
                (saved === 'daily' ||
                    saved === 'weekly' ||
                    saved === 'monthly' ||
                    saved === 'all')
            ) {
                if (saved !== pricePeriod) {
                    setPricePeriod(
                        saved as 'daily' | 'weekly' | 'monthly' | 'all',
                    );
                    if (saved === 'all') {
                        safeOnQueryChange({
                            price_period: null,
                            sort: 'number',
                            dir: 'asc',
                            page: 1,
                        });
                    } else {
                        const dir: 'asc' | 'desc' =
                            q.dir === 'desc' ? 'desc' : 'asc';
                        safeOnQueryChange({
                            price_period: saved as
                                | 'daily'
                                | 'weekly'
                                | 'monthly',
                            sort: 'price',
                            dir,
                            page: 1,
                        });
                    }
                }
            }
        } catch {
            /* noop */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        try {
            localStorage.setItem('rentro:rooms:price_period', pricePeriod);
        } catch {
            /* noop */
        }
    }, [pricePeriod]);

    // Hydrate sort/dir from localStorage once
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem('rentro:rooms:sort');
            if (raw) {
                const saved = JSON.parse(raw) as Partial<{
                    sort: string | null;
                    dir: 'asc' | 'desc' | null;
                }>;
                const sort = saved.sort ?? null;
                const dir = saved.dir ?? null;
                if (sort || dir) {
                    safeOnQueryChange({
                        sort: sort ?? undefined,
                        dir: dir ?? undefined,
                        page: 1,
                    });
                }
            }
        } catch {
            /* noop */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist sort/dir to localStorage whenever it changes
    React.useEffect(() => {
        try {
            localStorage.setItem(
                'rentro:rooms:sort',
                JSON.stringify({
                    sort: q.sort ?? null,
                    dir: (q.dir as 'asc' | 'desc' | null) ?? null,
                }),
            );
        } catch {
            /* noop */
        }
    }, [q.sort, q.dir]);

    React.useEffect(() => {
        try {
            const raw = localStorage.getItem('rentro:rooms:filters');
            if (raw) {
                const saved = JSON.parse(raw) as Partial<Filters>;
                const hasAny = Object.values(saved || {}).some(Boolean);
                if (hasAny) {
                    setFilters((f) => ({
                        ...f,
                        ...saved,
                        building_id: String(
                            saved.building_id ?? f.building_id ?? '',
                        ),
                        floor_id: String(saved.floor_id ?? f.floor_id ?? ''),
                        type_id: String(saved.type_id ?? f.type_id ?? ''),
                        status: String(saved.status ?? f.status ?? ''),
                        gender_policy: String(
                            saved.gender_policy ?? f.gender_policy ?? '',
                        ),
                        q: String(saved.q ?? f.q ?? ''),
                    }));
                    safeOnQueryChange({ ...saved, page: 1 });
                }
            }
        } catch {
            /* noop */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        try {
            localStorage.setItem(
                'rentro:rooms:filters',
                JSON.stringify(filters),
            );
        } catch {
            /* noop */
        }
    }, [filters]);

    const safeOnQueryChange = React.useCallback(
        (payload: SafePayload) => {
            const merged: Record<string, unknown> = {
                building_id: filters.building_id || undefined,
                floor_id: filters.floor_id || undefined,
                type_id: filters.type_id || undefined,
                status: filters.status || undefined,
                gender_policy: filters.gender_policy || undefined,
                price_period: pricePeriod,
                ...(payload as Record<string, unknown>),
            };
            if ('search' in merged)
                delete (merged as Record<string, unknown>)['search'];
            Object.keys(merged).forEach((k) => {
                if (merged[k] === undefined) {
                    delete merged[k];
                }
            });
            onQueryChange(merged);
        },
        [onQueryChange, filters, pricePeriod],
    );

    // resetFilter removed; selects auto-apply changes immediately

    const lang = i18n.language;
    const tableColumns = React.useMemo(() => {
        void lang;
        const periodForColumns =
            pricePeriod === 'all'
                ? undefined
                : (pricePeriod as 'daily' | 'weekly' | 'monthly');
        return createColumns({
            onDetail: (room) => {
                setDetailItem(room);
                setDetailOpen(true);
            },
            onEdit: (room) => {
                router.visit(route('management.rooms.edit', { room: room.id }));
            },
            onDelete: (room) => {
                setDeletingRoom(room);
            },
            displayPeriod: periodForColumns,
        });
    }, [pricePeriod, lang]);

    const headerActions = (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                onClick={() => router.visit(route('management.rooms.create'))}
            >
                <Plus className="mr-2 h-4 w-4" /> {tRoom('add')}
            </Button>
        </div>
    );

    return (
        <>
            <AppLayout
                pageTitle={tRoom('title')}
                pageDescription={tRoom('desc')}
                actions={headerActions}
            >
                <div className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Filter className="h-4 w-4" />{' '}
                                {t('common.filter')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-12">
                            <div className="md:col-span-4">
                                <Label className="text-muted-foreground mb-2 block text-xs">
                                    {tRoom('period_label')}
                                </Label>
                                <Select
                                    value={pricePeriod}
                                    onValueChange={(v) => {
                                        if (v === 'all') {
                                            setPricePeriod('all');
                                            try {
                                                localStorage.setItem(
                                                    'rentro:rooms:price_period',
                                                    'all',
                                                );
                                            } catch {
                                                /* ignore */
                                            }
                                            safeOnQueryChange({
                                                page: 1,
                                                price_period: null,
                                                sort: 'number',
                                                dir: 'asc',
                                            });
                                        } else {
                                            const period = v as
                                                | 'daily'
                                                | 'weekly'
                                                | 'monthly';
                                            setPricePeriod(period);
                                            try {
                                                localStorage.setItem(
                                                    'rentro:rooms:price_period',
                                                    period,
                                                );
                                            } catch {
                                                /* ignore */
                                            }
                                            safeOnQueryChange({
                                                page: 1,
                                                price_period: period,
                                                sort: 'price',
                                                dir:
                                                    q.dir === 'desc'
                                                        ? 'desc'
                                                        : 'asc',
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-full">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                {t('common.all')}
                                            </SelectItem>
                                            <SelectItem value="daily">
                                                {tRoom('period.daily')}
                                            </SelectItem>
                                            <SelectItem value="weekly">
                                                {tRoom('period.weekly')}
                                            </SelectItem>
                                            <SelectItem value="monthly">
                                                {tRoom('period.monthly')}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-4">
                                <Label className="text-muted-foreground mb-2 block text-xs">
                                    {tRoom('building')}
                                </Label>
                                <Select
                                    value={filters.building_id || 'all'}
                                    onValueChange={(v) => {
                                        if (v === 'all') {
                                            setFilters((f) => ({
                                                ...f,
                                                building_id: '',
                                                floor_id: '',
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                building_id: null,
                                                floor_id: null,
                                            });
                                        } else {
                                            setFilters((f) => ({
                                                ...f,
                                                building_id: v,
                                                floor_id: '',
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                building_id: v,
                                                floor_id: null,
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-full">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                {t('common.all')}
                                            </SelectItem>
                                            {buildings.map((b) => (
                                                <SelectItem
                                                    key={b.id}
                                                    value={String(b.id)}
                                                >
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-4">
                                <Label className="text-muted-foreground mb-2 block text-xs">
                                    {tRoom('floor')}
                                </Label>
                                <Select
                                    value={filters.floor_id || 'all'}
                                    onValueChange={(v) => {
                                        if (v === 'all') {
                                            setFilters((f) => ({
                                                ...f,
                                                floor_id: '',
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                floor_id: null,
                                            });
                                        } else {
                                            setFilters((f) => ({
                                                ...f,
                                                floor_id: v,
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                floor_id: v,
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-full">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                {t('common.all')}
                                            </SelectItem>
                                            {filteredFloors.map((f) => (
                                                <SelectItem
                                                    key={f.id}
                                                    value={String(f.id)}
                                                >
                                                    {tRoom(
                                                        'form.floor_option',
                                                        { level: f.level },
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-4">
                                <Label className="text-muted-foreground mb-2 block text-xs">
                                    {tRoom('type')}
                                </Label>
                                <Select
                                    value={filters.type_id || 'all'}
                                    onValueChange={(v) => {
                                        if (v === 'all') {
                                            setFilters((f) => ({
                                                ...f,
                                                type_id: '',
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                type_id: null,
                                            });
                                        } else {
                                            setFilters((f) => ({
                                                ...f,
                                                type_id: v,
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                type_id: v,
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-full">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                {t('common.all')}
                                            </SelectItem>
                                            {types.map((t) => (
                                                <SelectItem
                                                    key={t.id}
                                                    value={String(t.id)}
                                                >
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-4">
                                <Label className="text-muted-foreground mb-2 block text-xs">
                                    {tRoom('status')}
                                </Label>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(v) => {
                                        if (v === 'all') {
                                            setFilters((f) => ({
                                                ...f,
                                                status: '',
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                status: null,
                                            });
                                        } else {
                                            setFilters((f) => ({
                                                ...f,
                                                status: v,
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                status: v,
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-full">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                {t('common.all')}
                                            </SelectItem>
                                            {statuses.map((s) => (
                                                <SelectItem
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {t(
                                                        `room.status.${String(s.value).toLowerCase()}`,
                                                        {
                                                            ns: 'enum',
                                                            defaultValue:
                                                                s.label,
                                                        },
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-4">
                                <Label className="text-muted-foreground mb-2 block text-xs">
                                    {tRoom('form.gender_policy')}
                                </Label>
                                <Select
                                    value={filters.gender_policy || 'all'}
                                    onValueChange={(v) => {
                                        if (v === 'all') {
                                            setFilters((f) => ({
                                                ...f,
                                                gender_policy: '',
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                gender_policy: null,
                                            });
                                        } else {
                                            setFilters((f) => ({
                                                ...f,
                                                gender_policy: v,
                                            }));
                                            safeOnQueryChange({
                                                page: 1,
                                                gender_policy: v,
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-full">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                {t('common.all')}
                                            </SelectItem>
                                            {(
                                                [
                                                    'any',
                                                    'male',
                                                    'female',
                                                ] as const
                                            ).map((g) => (
                                                <SelectItem key={g} value={g}>
                                                    {t(`gender_policy.${g}`, {
                                                        ns: 'enum',
                                                    })}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Apply/Reset removed — selects auto-apply on change */}
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <Card>
                        <CardContent>
                            <DataTableServer<RoomItem, unknown>
                                columns={tableColumns}
                                rows={rooms}
                                paginator={paginator ?? null}
                                search={
                                    ((q as QueryBag & { q?: string | null })
                                        .q ?? '') as string
                                }
                                onSearchChange={(v) =>
                                    safeOnQueryChange({
                                        page: 1,
                                        q: v || null,
                                    } as SafePayload)
                                }
                                searchKey="number"
                                searchPlaceholder={tRoom('search_placeholder')}
                                sort={q.sort}
                                dir={q.dir}
                                onSortChange={handleSortChange}
                                onQueryChange={safeOnQueryChange}
                                loading={processing}
                                emptyText={tRoom('empty')}
                                showColumn
                            />
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
            {deletingRoom && (
                <AlertDialog
                    open={!!deletingRoom}
                    onOpenChange={(open) => !open && setDeletingRoom(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {tRoom('delete_title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {(() => {
                                    const label = deletingRoom
                                        ? deletingRoom.name
                                            ? `${deletingRoom.number} — ${deletingRoom.name}`
                                            : String(deletingRoom.number)
                                        : '';
                                    return tRoom('delete_desc', {
                                        label,
                                    });
                                })()}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                {t('common.cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (!deletingRoom) return;
                                    router.delete(
                                        route('management.rooms.destroy', {
                                            room: deletingRoom.id,
                                        }),
                                        {
                                            onFinish: () =>
                                                setDeletingRoom(null),
                                        },
                                    );
                                }}
                            >
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <RoomDetailDialog
                open={detailOpen}
                item={detailItem}
                onOpenChange={(open) => {
                    if (!open) setDetailItem(null);
                    setDetailOpen(open);
                }}
            />
        </>
    );
}
