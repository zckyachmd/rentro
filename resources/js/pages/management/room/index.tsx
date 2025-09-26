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
import RoomDetailDialog from '@/features/room/dialogs/detail-dialog';
import { createColumns } from '@/features/room/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import AppLayout from '@/layouts/app-layout';
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

    // filter setters are inline where used; removed unused updateFilter helper
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
        'daily' | 'weekly' | 'monthly'
    >((qinit.price_period ?? 'monthly') as 'daily' | 'weekly' | 'monthly');

    React.useEffect(() => {
        try {
            const saved = localStorage.getItem('rentro:rooms:price_period');
            if (
                saved &&
                (saved === 'daily' || saved === 'weekly' || saved === 'monthly')
            ) {
                if (saved !== pricePeriod) {
                    setPricePeriod(saved as 'daily' | 'weekly' | 'monthly');
                    const dir: 'asc' | 'desc' =
                        q.dir === 'desc' ? 'desc' : 'asc';
                    safeOnQueryChange({
                        price_period: saved as 'daily' | 'weekly' | 'monthly',
                        sort: 'price',
                        dir,
                        page: 1,
                    });
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

    const resetFilter = React.useCallback(() => {
        setFilters({
            building_id: '',
            floor_id: '',
            type_id: '',
            status: '',
            gender_policy: '',
            q: '',
        });
        safeOnQueryChange({
            page: 1,
            q: null,
            building_id: null,
            floor_id: null,
            type_id: null,
            status: null,
            gender_policy: null,
        });
    }, [safeOnQueryChange]);

    const lang = i18n.language;
    const tableColumns = React.useMemo(() => {
        void lang;
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
            displayPeriod: pricePeriod,
        });
    }, [pricePeriod, lang]);

    const applyFilters = () => {
        const trimmedQ = (filters.q || '').trim();
        const hasAnyFilter = Boolean(
            filters.building_id ||
                filters.floor_id ||
                filters.type_id ||
                filters.status ||
                filters.gender_policy ||
                trimmedQ,
        );
        const hadQ =
            'q' in (q as Record<string, unknown>) &&
            Boolean((q as Record<string, unknown>).q);

        if (!hasAnyFilter && !hadQ) return;

        const payload: Record<string, unknown> = {
            page: 1,
            building_id: filters.building_id || undefined,
            floor_id: filters.floor_id || undefined,
            type_id: filters.type_id || undefined,
            status: filters.status || undefined,
            gender_policy: filters.gender_policy || undefined,
            price_period: pricePeriod,
            sort: q.sort ?? undefined,
            dir: q.dir ?? undefined,
        };
        if (trimmedQ) {
            payload.q = trimmedQ;
        } else if (hadQ) {
            payload.q = null;
        }

        safeOnQueryChange(payload);
    };

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
                titleIcon="BedDouble"
                actions={headerActions}
            >
                <div className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Filter className="h-4 w-4" /> {tRoom('filter')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-12">
                            <div className="md:col-span-4">
                                <Label>{tRoom('period_label')}</Label>
                                <Select
                                    value={pricePeriod}
                                    onValueChange={(v) => {
                                        const period = v as
                                            | 'daily'
                                            | 'weekly'
                                            | 'monthly';
                                        setPricePeriod(period);
                                        safeOnQueryChange({
                                            page: 1,
                                            price_period: period,
                                            sort: 'price',
                                            dir:
                                                q.dir === 'desc'
                                                    ? 'desc'
                                                    : 'asc',
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue
                                            placeholder={tRoom(
                                                'period.monthly',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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
                                <Label>{tRoom('building')}</Label>
                                <Select
                                    value={filters.building_id}
                                    onValueChange={(v) => {
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
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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
                                <Label>{tRoom('floor')}</Label>
                                <Select
                                    value={filters.floor_id}
                                    onValueChange={(v) => {
                                        setFilters((f) => ({
                                            ...f,
                                            floor_id: v,
                                        }));
                                        safeOnQueryChange({
                                            page: 1,
                                            floor_id: v,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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
                                <Label>{tRoom('type')}</Label>
                                <Select
                                    value={filters.type_id}
                                    onValueChange={(v) => {
                                        setFilters((f) => ({
                                            ...f,
                                            type_id: v,
                                        }));
                                        safeOnQueryChange({
                                            page: 1,
                                            type_id: v,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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
                                <Label>{tRoom('status')}</Label>
                                <Select
                                    value={filters.status}
                                    onValueChange={(v) => {
                                        setFilters((f) => ({
                                            ...f,
                                            status: v,
                                        }));
                                        safeOnQueryChange({
                                            page: 1,
                                            status: v,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-9">
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
                                <Label>{tRoom('form.gender_policy')}</Label>
                                <Select
                                    value={filters.gender_policy}
                                    onValueChange={(v) => {
                                        setFilters((f) => ({
                                            ...f,
                                            gender_policy: v,
                                        }));
                                        safeOnQueryChange({
                                            page: 1,
                                            gender_policy: v,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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
                        <CardContent className="pt-6">
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
