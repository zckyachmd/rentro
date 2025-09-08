import { router } from '@inertiajs/react';
import { Filter, Plus } from 'lucide-react';
import React from 'react';

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
    type PaginatorMeta,
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
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import {
    createColumns,
    type Building,
    type Floor,
    type RoomItem,
    type RoomType,
} from '@/pages/management/room/columns';
import RoomDetailDialog from '@/pages/management/room/detail';

type RoomsPaginator = { data: RoomItem[] } & PaginatorMeta;

interface RoomsPageProps {
    rooms?: RoomsPaginator;
    query?: {
        q?: string;
        building_id?: string | number | null;
        floor_id?: string | number | null;
        type_id?: string | number | null;
        status?: string | null;
        gender_policy?: string | null;
    };
    options?: {
        buildings?: Building[];
        floors?: Floor[];
        types?: RoomType[];
        statuses?: { value: string; label: string }[];
    };
}

type Filters = {
    building_id: string;
    floor_id: string;
    type_id: string;
    status: string;
    gender_policy: string;
    q: string;
};

export default function RoomIndex(props: RoomsPageProps) {
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

    const updateFilter = React.useCallback(
        (key: keyof Filters, value: string) =>
            setFilters((f) => ({ ...f, [key]: value })),
        [],
    );
    const filteredFloors = React.useMemo(
        () =>
            floors.filter(
                (f) =>
                    !filters.building_id ||
                    String(f.building_id) === filters.building_id,
            ),
        [floors, filters.building_id],
    );

    type QueryInit = Partial<{
        search: string;
        page: number;
        per_page: number;
        perPage: number;
        sort: string | null;
        dir: 'asc' | 'desc' | null;
        q: string;
        building_id: string | number | null;
        floor_id: string | number | null;
        type_id: string | number | null;
        status: string | null;
        gender_policy: string | null;
    }>;

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

    type SafePayload = Partial<
        Omit<QueryBag, 'search' | 'sort' | 'dir'> & {
            search?: string | null;
            sort?: string | null;
            dir?: 'asc' | 'desc' | null;
            page?: number;
            building_id?: string | number | null;
            floor_id?: string | number | null;
            type_id?: string | number | null;
            status?: string | null;
            gender_policy?: string | null;
            q?: string | null;
        }
    >;

    const safeOnQueryChange = React.useCallback(
        (payload: SafePayload) => {
            const merged: Record<string, unknown> = {
                building_id: filters.building_id || undefined,
                floor_id: filters.floor_id || undefined,
                type_id: filters.type_id || undefined,
                status: filters.status || undefined,
                gender_policy: filters.gender_policy || undefined,
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
        [onQueryChange, filters],
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

    const tableColumns = React.useMemo(
        () =>
            createColumns({
                onDetail: (room) => {
                    setDetailItem(room);
                    setDetailOpen(true);
                },
                onEdit: (room) => {
                    router.visit(
                        route('management.rooms.edit', { room: room.id }),
                    );
                },
                onDelete: (room) => {
                    setDeletingRoom(room);
                },
            }),
        [],
    );

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
                <Plus className="mr-2 h-4 w-4" /> Tambah Kamar
            </Button>
        </div>
    );

    return (
        <>
            <AuthLayout
                pageTitle="Kamar"
                pageDescription="Manajemen kamar kost, lengkap dengan filter & aksi cepat."
                titleIcon="BedDouble"
                actions={headerActions}
            >
                <div className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Filter className="h-4 w-4" /> Filter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-12">
                            <div className="md:col-span-3">
                                <Label htmlFor="room-search">Cari</Label>
                                <Input
                                    id="room-search"
                                    className="h-9"
                                    value={filters.q}
                                    onChange={(e) =>
                                        updateFilter('q', e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            applyFilters();
                                        }
                                    }}
                                    placeholder="Cari nomor/nama kamar"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Label>Gedung</Label>
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
                                        <SelectValue placeholder="Semua gedung" />
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
                            <div className="md:col-span-2">
                                <Label>Lantai</Label>
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
                                        <SelectValue placeholder="Semua" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {filteredFloors.map((f) => (
                                                <SelectItem
                                                    key={f.id}
                                                    value={String(f.id)}
                                                >
                                                    Lantai {f.level}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Tipe</Label>
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
                                        <SelectValue placeholder="Semua" />
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
                            <div className="md:col-span-2">
                                <Label>Status</Label>
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

                    {/* Table */}
                    <Card>
                        <CardContent>
                            <DataTableServer<RoomItem, unknown>
                                columns={tableColumns}
                                rows={rooms}
                                paginator={paginator ?? null}
                                sort={q.sort}
                                dir={q.dir}
                                onSortChange={handleSortChange}
                                onQueryChange={safeOnQueryChange}
                                loading={processing}
                                emptyText="Tidak ada kamar."
                                showColumn={false}
                            />
                        </CardContent>
                    </Card>
                </div>
            </AuthLayout>
            {deletingRoom && (
                <AlertDialog
                    open={!!deletingRoom}
                    onOpenChange={(open) => !open && setDeletingRoom(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Kamar</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus kamar "
                                {deletingRoom?.name || `#${deletingRoom?.id}`}"
                                beserta semua fotonya? Tindakan ini tidak dapat
                                dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
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
                                Hapus
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
