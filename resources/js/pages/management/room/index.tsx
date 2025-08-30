import { Link } from '@inertiajs/react';
import {
    BedDouble,
    Building2,
    ChevronDown,
    Filter,
    Layers,
    Plus,
    RefreshCw,
    Tags,
    Wrench,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DataTableServer,
    type PaginatorMeta,
    type QueryBag,
} from '@/components/ui/data-table-server';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import {
    createColumns,
    type Building,
    type Floor,
    type RoomItem,
    type RoomType,
} from '@/pages/management/room/columns';

// Helpers untuk resolve route (fallback plain path ketika Ziggy tidak tersedia)
function r(name: string, params?: Record<string, unknown>) {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.route) {
        // @ts-ignore
        return window.route(name, params);
    }
    switch (name) {
        case 'management.rooms.index':
            return '/management/rooms';
        case 'management.buildings.index':
            return '/management/buildings';
        case 'management.floors.index':
            return '/management/floors';
        case 'management.room-types.index':
            return '/management/room-types';
        case 'management.amenities.index':
            return '/management/amenities';
        default:
            return '#';
    }
}

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

export default function RoomIndex(props: RoomsPageProps) {
    const paginator = props.rooms as RoomsPaginator | undefined;
    const rooms: RoomItem[] = paginator?.data ?? [];
    const query = props.query ?? {};
    const opt = props.options ?? {};

    const [q, setQ] = React.useState<string>(String(query.q ?? ''));
    const [buildingId, setBuildingId] = React.useState<string>(
        String(query.building_id ?? ''),
    );
    const [floorId, setFloorId] = React.useState<string>(
        String(query.floor_id ?? ''),
    );
    const [typeId, setTypeId] = React.useState<string>(
        String(query.type_id ?? ''),
    );
    const [status, setStatus] = React.useState<string>(
        String(query.status ?? ''),
    );

    const [openDialog, setOpenDialog] = React.useState<boolean>(false);
    const [dialogMode, setDialogMode] = React.useState<'create' | 'edit'>(
        'create',
    );

    // --- DataTableServer integration ---
    function useDebounced<P extends unknown[]>(
        fn: (...args: P) => void,
        delay = 300,
    ) {
        const fnRef = React.useRef(fn);
        const tRef = React.useRef<number | null>(null);
        React.useEffect(() => {
            fnRef.current = fn;
        }, [fn]);
        const clear = React.useCallback(() => {
            if (tRef.current) {
                window.clearTimeout(tRef.current);
                tRef.current = null;
            }
        }, []);
        const debounced = React.useCallback(
            (...args: P) => {
                clear();
                tRef.current = window.setTimeout(
                    () => fnRef.current(...args),
                    delay,
                );
            },
            [clear, delay],
        );
        React.useEffect(() => clear, [clear]);
        return debounced as typeof fn;
    }

    const initial: QueryBag | undefined = props.query
        ? {
              search: (props.query as any).search,
              page: (props.query as any).page,
              perPage:
                  (props.query as any).per_page ?? (props.query as any).perPage,
              sort: ((props.query as any).sort as string | null) ?? null,
              dir: ((props.query as any).dir as 'asc' | 'desc' | null) ?? null,
          }
        : undefined;

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );
    const [processing, setProcessing] = React.useState(false);

    const {
        q: qbag,
        onQueryChange,
        handleSortChange,
    } = useServerTable({
        paginator,
        initial,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const debouncedSearch = useDebounced((value: string | undefined) => {
        onQueryChange({ page: 1, q: value, search: value });
    }, 350);

    type SafePayload = Partial<
        Omit<QueryBag, 'search' | 'sort' | 'dir'> & {
            // core datatable keys
            search?: string | null;
            sort?: string | null;
            dir?: 'asc' | 'desc' | null;
            page?: number;

            // filters used by backend
            building_id?: string | number;
            floor_id?: string | number;
            type_id?: string | number;
            status?: string;

            // alias for search
            q?: string;
        }
    >;

    const safeOnQueryChange = React.useCallback(
        (payload: SafePayload) => {
            if (processing) return;
            const next: Record<string, unknown> = {
                ...(payload as Record<string, unknown>),
            };
            // prune null/undefined for all keys
            Object.keys(next).forEach((k) => {
                if (
                    next[k] === null ||
                    next[k] === undefined ||
                    next[k] === ''
                ) {
                    delete next[k];
                }
            });
            onQueryChange(next);
        },
        [onQueryChange, processing],
    );

    // Remove submitFilter, and update resetFilter to clear state and push to server
    const resetFilter = React.useCallback(() => {
        setQ('');
        setBuildingId('');
        setFloorId('');
        setTypeId('');
        setStatus('');
        safeOnQueryChange({
            page: 1,
            q: undefined,
            search: undefined,
            building_id: undefined,
            floor_id: undefined,
            type_id: undefined,
            status: undefined,
        });
    }, [safeOnQueryChange]);

    return (
        <AuthLayout
            pageTitle="Kamar"
            pageDescription="Manajemen kamar kost, lengkap dengan filter & aksi cepat."
        >
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <BedDouble className="h-6 w-6" />
                        <div>
                            <h2 className="text-lg font-semibold leading-none">
                                Kamar
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Kelola semua kamar, harga, status, dan
                                fasilitas.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline">
                                    Kelola Master Data
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={r('management.buildings.index')}
                                        className="flex items-center gap-2"
                                    >
                                        <Building2 className="h-4 w-4" /> Gedung
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={r('management.floors.index')}
                                        className="flex items-center gap-2"
                                    >
                                        <Layers className="h-4 w-4" /> Lantai
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={r('management.room-types.index')}
                                        className="flex items-center gap-2"
                                    >
                                        <Tags className="h-4 w-4" /> Tipe Kamar
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={r('management.amenities.index')}
                                        className="flex items-center gap-2"
                                    >
                                        <Wrench className="h-4 w-4" /> Fasilitas
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            type="button"
                            onClick={() => {
                                setDialogMode('create');
                                setOpenDialog(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Tambah Kamar
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Filter className="h-4 w-4" /> Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-3">
                            <Label htmlFor="q">Cari</Label>
                            <Input
                                id="q"
                                className="h-9"
                                value={q}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setQ(v);
                                    debouncedSearch(v);
                                }}
                                placeholder="Nomor / nama kamar"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Label>Gedung</Label>
                            <Select
                                value={buildingId}
                                onValueChange={(v) => {
                                    setBuildingId(v);
                                    setFloorId('');
                                    safeOnQueryChange({
                                        page: 1,
                                        building_id: v,
                                        floor_id: undefined,
                                    });
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Semua gedung" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(opt.buildings ?? []).map((b) => (
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
                                value={floorId}
                                onValueChange={(v) => {
                                    setFloorId(v);
                                    safeOnQueryChange({ page: 1, floor_id: v });
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(opt.floors ?? [])
                                            .filter(
                                                (f) =>
                                                    !buildingId ||
                                                    String(f.building_id) ===
                                                        buildingId,
                                            )
                                            .map((f) => (
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
                                value={typeId}
                                onValueChange={(v) => {
                                    setTypeId(v);
                                    safeOnQueryChange({ page: 1, type_id: v });
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(opt.types ?? []).map((t) => (
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
                                value={status}
                                onValueChange={(v) => {
                                    setStatus(v);
                                    safeOnQueryChange({ page: 1, status: v });
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(
                                            opt.statuses ?? [
                                                {
                                                    value: 'vacant',
                                                    label: 'Kosong',
                                                },
                                                {
                                                    value: 'reserved',
                                                    label: 'Dipesan',
                                                },
                                                {
                                                    value: 'occupied',
                                                    label: 'Terisi',
                                                },
                                                {
                                                    value: 'maintenance',
                                                    label: 'Perbaikan',
                                                },
                                                {
                                                    value: 'inactive',
                                                    label: 'Nonaktif',
                                                },
                                            ]
                                        ).map((s) => (
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
                            <Button
                                type="button"
                                onClick={() => {
                                    safeOnQueryChange({
                                        page: 1,
                                        q,
                                        search: q,
                                        building_id: buildingId || undefined,
                                        floor_id: floorId || undefined,
                                        type_id: typeId || undefined,
                                        status: status || undefined,
                                        sort: qbag.sort ?? undefined,
                                        dir: qbag.dir ?? undefined,
                                    });
                                }}
                            >
                                Terapkan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilter}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">
                            Daftar Kamar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTableServer<RoomItem, unknown>
                            columns={createColumns({
                                onDetail: (r) => {
                                    /* TODO: buka drawer detail */
                                },
                                onEdit: (r) => {
                                    setDialogMode('edit');
                                    setOpenDialog(true); /* TODO: prefill */
                                },
                                onDelete: (r) => {
                                    /* TODO: konfirmasi & hapus */
                                },
                            })}
                            rows={rooms}
                            paginator={paginator as any}
                            sort={qbag.sort}
                            dir={qbag.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText="Belum ada data kamar."
                        />
                    </CardContent>
                </Card>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'create'
                                ? 'Tambah Kamar'
                                : 'Edit Kamar'}
                        </DialogTitle>
                        <DialogDescription>
                            Lengkapi detail kamar di bawah ini, lalu simpan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="dlg-number">Nomor Kamar</Label>
                            <Input
                                id="dlg-number"
                                className="h-9"
                                placeholder="cth: 201"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Gedung</Label>
                            <Select
                                value={buildingId}
                                onValueChange={(v) => {
                                    setBuildingId(v);
                                    setFloorId('');
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih gedung" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(opt.buildings ?? []).map((b) => (
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

                        <div className="space-y-2">
                            <Label>Lantai</Label>
                            <Select value={floorId} onValueChange={setFloorId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih lantai" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(opt.floors ?? [])
                                            .filter(
                                                (f) =>
                                                    !buildingId ||
                                                    String(f.building_id) ===
                                                        buildingId,
                                            )
                                            .map((f) => (
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

                        <div className="space-y-2">
                            <Label>Tipe Kamar</Label>
                            <Select value={typeId} onValueChange={setTypeId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(opt.types ?? []).map((t) => (
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

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(
                                            opt.statuses ?? [
                                                {
                                                    value: 'vacant',
                                                    label: 'Kosong',
                                                },
                                                {
                                                    value: 'reserved',
                                                    label: 'Dipesan',
                                                },
                                                {
                                                    value: 'occupied',
                                                    label: 'Terisi',
                                                },
                                                {
                                                    value: 'maintenance',
                                                    label: 'Perbaikan',
                                                },
                                                {
                                                    value: 'inactive',
                                                    label: 'Nonaktif',
                                                },
                                            ]
                                        ).map((s) => (
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

                        <div className="space-y-2">
                            <Label htmlFor="dlg-max">Kapasitas</Label>
                            <Input
                                id="dlg-max"
                                className="h-9"
                                type="number"
                                min={1}
                                placeholder="1"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dlg-price">Harga (Rp/bulan)</Label>
                            <Input
                                id="dlg-price"
                                className="h-9"
                                type="number"
                                min={0}
                                placeholder="1500000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dlg-deposit">Deposit (Rp)</Label>
                            <Input
                                id="dlg-deposit"
                                className="h-9"
                                type="number"
                                min={0}
                                placeholder="500000"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-6">
                            <Switch id="dlg-shared" />
                            <Label htmlFor="dlg-shared">Kamar sharing?</Label>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="dlg-notes">Catatan</Label>
                            <Textarea
                                id="dlg-notes"
                                placeholder="Catatan tambahan (opsional)"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenDialog(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                /* TODO: submit to store/update */ setOpenDialog(
                                    false,
                                );
                            }}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthLayout>
    );
}
