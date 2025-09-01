import { useForm } from '@inertiajs/react';
import { GripVertical, Image as ImageIcon, Trash2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ImageDropzone from '@/components/ui/image-dropzone';
import {
    ImageSpotlight,
    type SpotlightItem,
} from '@/components/ui/image-spotlight';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { readXsrfCookie } from '@/hooks/use-confirm-password';
import { LeaveGuardDialog, useLeaveGuard } from '@/hooks/use-leave-guard';

type Option = { id: number | string; name: string };
type RoomTypeOption = Option & {
    price_cents?: number | null;
    deposit_cents?: number | null;
    size_m2?: number | null;
};
type FloorOption = { id: number; level: number | string; building_id: number };
type StatusOption = { value: string; label: string };
type AmenityOption = { id: number; name: string; icon?: string };
type GenderPolicyOption = { value: string; label: string };

type PeriodOption = { value: string; label: string };

const DEFAULT_GENDER_POLICIES: Readonly<GenderPolicyOption[]> = Object.freeze([
    { value: 'any', label: 'Bebas' },
    { value: 'male', label: 'Pria' },
    { value: 'female', label: 'Wanita' },
]);

const DEFAULT_BILLING_PERIODS: Readonly<PeriodOption[]> = Object.freeze([
    { value: 'monthly', label: 'Bulanan' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'daily', label: 'Harian' },
]);

export type RoomPhotoView = {
    id: string;
    url: string;
    is_cover?: boolean;
    ordering?: number;
};

export type RoomUpsertOptions = {
    buildings?: Option[];
    floors?: FloorOption[];
    types?: RoomTypeOption[];
    statuses?: StatusOption[];
    amenities?: AmenityOption[];
    gender_policies?: GenderPolicyOption[];
    billing_periods?: PeriodOption[];
};

export type RoomUpsertData = {
    id?: string;
    building_id?: string | number | null;
    floor_id?: string | number | null;
    room_type_id?: string | number | null;
    number?: string;
    name?: string | null;
    status?: string;
    max_occupancy?: number | string;
    price_rupiah?: number | string | null;
    deposit_rupiah?: number | string | null;
    size_m2?: number | string | null;
    notes?: string | null;
    photos?: RoomPhotoView[];
    amenities?: number[];
    gender_policy?: string | null;
    billing_period?: string | null;
};

type FormData = {
    building_id: string;
    floor_id: string;
    room_type_id: string;
    number: string;
    name: string;
    status: string;
    max_occupancy: string;
    price_rupiah: string;
    deposit_rupiah: string;
    size_m2: string;
    notes: string;
    photos: File[];
    amenities: string[];
    gender_policy: string;
    billing_period: string;
};

type StringKeys<T> = {
    [K in keyof T]-?: T[K] extends string ? K : never;
}[keyof T];

const formatIDR = (val?: string | number | null) => {
    if (val === null || val === undefined) return '';
    const n = typeof val === 'string' ? Number(val) : val;
    const num = Number.isFinite(n)
        ? (n as number)
        : Number(String(val).replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(num) || num <= 0) return '';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
        Math.trunc(num),
    );
};

const getXsrfToken = () => {
    const cookieVal =
        (typeof readXsrfCookie === 'function' ? readXsrfCookie() : '') || '';
    if (cookieVal) return cookieVal;
    const el = document.querySelector(
        'meta[name="csrf-token"]',
    ) as HTMLMetaElement | null;
    return el?.content || '';
};

export default function RoomUpsertForm({
    mode,
    options,
    room,
}: {
    mode: 'create' | 'edit';
    options?: RoomUpsertOptions;
    room?: RoomUpsertData;
}) {
    // =========================
    // 1) Sumber data opsi (tanpa useMemo — ringan & jelas)
    // =========================
    const buildings = options?.buildings ?? [];
    const floors = React.useMemo(
        () => (options?.floors ?? []) as FloorOption[],
        [options?.floors],
    );
    const types = (options?.types ?? []) as RoomTypeOption[];
    const statuses = options?.statuses ?? [];
    const amenities = (options?.amenities ?? []) as AmenityOption[];
    const genderPolicies = (options?.gender_policies ??
        DEFAULT_GENDER_POLICIES) as GenderPolicyOption[];
    const billingPeriods = (options?.billing_periods ??
        DEFAULT_BILLING_PERIODS) as PeriodOption[];

    // =========================
    // 2) Util kecil untuk default selection
    // =========================
    const toStr = (v: unknown) =>
        v === undefined || v === null ? '' : String(v);
    const pickSingleId = <T extends { id: number | string }>(arr: T[]) =>
        arr.length === 1 ? toStr(arr[0].id) : '';

    // =========================
    // 3) Default selection (auto pilih jika hanya 1 opsi)
    // =========================
    const defaultBuildingId = room?.building_id
        ? toStr(room.building_id)
        : pickSingleId(buildings);
    const defaultTypeId = room?.room_type_id
        ? toStr(room.room_type_id)
        : pickSingleId(types);

    let defaultFloorId = '';
    if (room?.floor_id) {
        defaultFloorId = toStr(room.floor_id);
    } else {
        const buildingKey = room?.building_id
            ? toStr(room.building_id)
            : defaultBuildingId;
        if (buildingKey) {
            const matched = floors.filter(
                (f) => toStr(f.building_id) === buildingKey,
            );
            defaultFloorId = pickSingleId(matched);
        } else {
            defaultFloorId = pickSingleId(floors);
        }
    }

    // =========================
    // 4) Form state (Inertia useForm)
    // =========================
    const {
        data,
        setData,
        post,
        transform,
        processing,
        errors,
        reset,
        clearErrors,
        isDirty,
    } = useForm<FormData>({
        building_id: defaultBuildingId,
        floor_id: defaultFloorId,
        room_type_id: defaultTypeId,
        number: room?.number ?? '',
        name: room?.name ?? '',
        status: room?.status ?? '',
        max_occupancy: room?.max_occupancy ? String(room.max_occupancy) : '1',
        price_rupiah: room?.price_rupiah ? String(room.price_rupiah) : '',
        deposit_rupiah: room?.deposit_rupiah ? String(room.deposit_rupiah) : '',
        size_m2: room?.size_m2 ? String(room.size_m2) : '',
        notes: room?.notes ?? '',
        photos: [] as File[],
        amenities: (room?.amenities ?? []).map((id) => String(id)),
        gender_policy: room?.gender_policy ?? genderPolicies[0]?.value ?? 'any',
        billing_period:
            room?.billing_period ?? billingPeriods[0]?.value ?? 'monthly',
    });

    // Autofill harga/deposit/luas dari tipe pada initial render bila sudah terpilih
    const didInitDefaults = React.useRef(false);
    React.useEffect(() => {
        if (didInitDefaults.current) return;
        if (!data.room_type_id) {
            didInitDefaults.current = true;
            return;
        }
        const t = types.find((tt) => String(tt.id) === data.room_type_id);
        if (t) {
            const price =
                t.price_cents != null
                    ? String(Math.round((t.price_cents as number) / 100))
                    : '';
            const deposit =
                t.deposit_cents != null
                    ? String(Math.round((t.deposit_cents as number) / 100))
                    : '';
            const size = t.size_m2 != null ? String(t.size_m2) : '';
            setData((prev) => ({
                ...prev,
                price_rupiah: prev.price_rupiah || price,
                deposit_rupiah: prev.deposit_rupiah || deposit,
                size_m2: prev.size_m2 || size,
            }));
        }
        didInitDefaults.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =========================
    // 6) Foto yang sudah ada (mode edit) & alat bantu
    // =========================
    const [photos, setPhotos] = React.useState<RoomPhotoView[]>(
        () => room?.photos ?? [],
    );
    React.useEffect(() => setPhotos(room?.photos ?? []), [room?.photos]);

    const initialPhotosRef = React.useRef<RoomPhotoView[]>(room?.photos ?? []);
    React.useEffect(() => {
        initialPhotosRef.current = room?.photos ?? [];
    }, [room?.photos]);

    const photosDirty = React.useMemo(() => {
        const initial = initialPhotosRef.current;
        const initIds = initial.map((p) => p.id).join(',');
        const currentIds = photos.map((p) => p.id).join(',');
        const initCover = initial.find((p) => p.is_cover)?.id ?? null;
        const currCover = photos.find((p) => p.is_cover)?.id ?? null;
        return initIds !== currentIds || initCover !== currCover;
    }, [photos]);

    // =========================
    // Leave guard & autosave draft
    // =========================
    const isFormDirty =
        photosDirty || (data.photos?.length ?? 0) > 0 || isDirty;
    const {
        open: leaveOpen,
        setOpen: setLeaveOpen,
        proceed: confirmLeave,
        cancel: cancelLeave,
        beginSkip,
        endSkip,
    } = useLeaveGuard({ enabled: isFormDirty });

    // =========================
    // Preview & DnD foto (UI state ringan)
    // =========================
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewIdx, setPreviewIdx] = React.useState(0);
    const previewItems: SpotlightItem[] = React.useMemo(
        () => (photos ?? []).map((p) => ({ url: p.url, is_cover: p.is_cover })),
        [photos],
    );

    const [dragIndex, setDragIndex] = React.useState<number | null>(null);
    const [overIndex, setOverIndex] = React.useState<number | null>(null);

    // =========================
    // Derivasi lantai sesuai gedung terpilih
    // =========================
    const filteredFloors = React.useMemo(
        () =>
            floors.filter(
                (f) =>
                    !data.building_id ||
                    String(f.building_id) === data.building_id,
            ),
        [floors, data.building_id],
    );

    // =========================
    // Callbacks util
    // =========================
    const onChange =
        <K extends StringKeys<FormData>>(field: K) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setData((prev) => ({ ...prev, [field]: e.target.value }));

    const toggleAmenity = (id: number) => {
        const sid = String(id);
        const curr = Array.isArray(data.amenities) ? data.amenities : [];
        const next = curr.includes(sid)
            ? curr.filter((x) => x !== sid)
            : [...curr, sid];
        setData('amenities', next);
    };

    const setAsCover = React.useCallback((pid: string) => {
        setPhotos((prev) =>
            prev.map((p) => ({ ...p, is_cover: p.id === pid })),
        );
    }, []);

    const deletePhoto = React.useCallback(
        (pid: string) => {
            const wasCover = photos.find((p) => p.id === pid)?.is_cover;
            setPhotos((prev) => {
                const next = prev.filter((p) => p.id !== pid);
                if (wasCover && next.length) {
                    return next.map((p, i) => ({ ...p, is_cover: i === 0 }));
                }
                return next;
            });
        },
        [photos],
    );

    const savePhotoChanges = React.useCallback(async (): Promise<boolean> => {
        if (!room?.id || !photosDirty) return true;
        try {
            const initial = initialPhotosRef.current;
            const initIds = new Set(initial.map((p) => p.id));
            const currIds = new Set(photos.map((p) => p.id));
            const deleted_ids = Array.from(initIds).filter(
                (id) => !currIds.has(id),
            );
            const ordered_ids = photos.map((p) => p.id);
            const cover_id = photos.find((p) => p.is_cover)?.id ?? null;

            const res = await fetch(
                route('management.rooms.photos.batch', room.id),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                    credentials: 'same-origin',
                    cache: 'no-store',
                    body: JSON.stringify({
                        deleted_ids,
                        ordered_ids,
                        cover_id,
                    }),
                },
            );
            if (!res.ok) throw new Error('failed');
            initialPhotosRef.current = photos;
            return true;
        } catch {
            return false;
        }
    }, [photos, room?.id, photosDirty]);

    // =========================
    // Submit handler
    // =========================
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        if (mode === 'edit') {
            const hasNewFiles = (data.photos?.length ?? 0) > 0;
            if (!isDirty && !photosDirty && !hasNewFiles) {
                toast.info('Tidak ada perubahan untuk disimpan.');
                return;
            }
        }

        if (mode === 'create') {
            beginSkip();
            post(route('management.rooms.store'), {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kamar berhasil dibuat. Lanjut kelola foto.');
                    reset();
                },
                onFinish: () => {
                    endSkip();
                },
                onError: (errs: Record<string, unknown>) => {
                    const keys = Object.keys(errs || {});
                    const photoKey = keys.find(
                        (k) => k === 'photos' || k.startsWith('photos.'),
                    );
                    if (!photoKey) return;
                    const val = errs[photoKey];
                    const msg = Array.isArray(val)
                        ? (val[0] as string)
                        : typeof val === 'string'
                          ? val
                          : undefined;
                    toast.error(msg || 'Gagal mengunggah foto.');
                },
            });
        } else if (mode === 'edit' && room?.id) {
            if (photosDirty) {
                const ok = await savePhotoChanges();
                if (!ok) return;
            }

            // Set transform to add _method: 'put'
            transform((current) => ({ ...current, _method: 'put' as const }));
            beginSkip();
            post(route('management.rooms.update', room.id), {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setData('photos', []);
                },
                onFinish: () => {
                    endSkip();
                },
                onError: (errs: Record<string, unknown>) => {
                    const keys = Object.keys(errs || {});
                    const photoKey = keys.find(
                        (k) => k === 'photos' || k.startsWith('photos.'),
                    );
                    if (!photoKey) return;
                    const val = errs[photoKey];
                    const msg = Array.isArray(val)
                        ? (val[0] as string)
                        : typeof val === 'string'
                          ? val
                          : undefined;
                    toast.error(msg || 'Gagal mengunggah foto.');
                },
            });
            // Reset transform ke identitas setelah post
            transform(
                (current) =>
                    ({
                        ...(current as unknown as Omit<
                            typeof current,
                            '_method'
                        >),
                    }) as unknown as FormData,
            );
        }
    };

    return (
        <>
            <form className="grid gap-6" onSubmit={onSubmit}>
                {/* Identitas Kamar */}
                <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">
                        Identitas Kamar
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Nomor</Label>
                            <Input
                                value={data.number}
                                onChange={onChange('number')}
                                placeholder="cth: 201"
                                disabled={processing}
                                className="h-9"
                            />
                            <InputError message={errors.number} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Nama</Label>
                            <Input
                                value={data.name}
                                onChange={onChange('name')}
                                placeholder="cth: Kamar 201"
                                disabled={processing}
                                className="h-9"
                            />
                            <InputError message={errors.name} />
                        </div>
                    </div>
                    <Separator className="my-3" />
                </div>

                {/* Lokasi & Klasifikasi */}
                <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">
                        Lokasi & Klasifikasi
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Gedung</Label>
                            <Select
                                value={data.building_id}
                                onValueChange={(v) => {
                                    setData('building_id', v);
                                    const matchFloors = floors.filter(
                                        (f) => String(f.building_id) === v,
                                    );
                                    setData(
                                        'floor_id',
                                        matchFloors.length === 1
                                            ? String(matchFloors[0].id)
                                            : '',
                                    );
                                }}
                                disabled={processing}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih gedung" />
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
                            <InputError message={errors.building_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Lantai</Label>
                            <Select
                                value={data.floor_id}
                                onValueChange={(v) => setData('floor_id', v)}
                                disabled={processing}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih lantai" />
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
                            <InputError message={errors.floor_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Tipe Kamar</Label>
                            <Select
                                value={data.room_type_id}
                                onValueChange={(v) => {
                                    setData('room_type_id', v);
                                    const t = types.find(
                                        (tt) => String(tt.id) === v,
                                    );
                                    const price =
                                        t?.price_cents != null
                                            ? String(
                                                  Math.round(
                                                      (t!
                                                          .price_cents as number) /
                                                          100,
                                                  ),
                                              )
                                            : '';
                                    const deposit =
                                        t?.deposit_cents != null
                                            ? String(
                                                  Math.round(
                                                      (t!
                                                          .deposit_cents as number) /
                                                          100,
                                                  ),
                                              )
                                            : '';
                                    const size =
                                        t?.size_m2 != null
                                            ? String(t!.size_m2)
                                            : '';
                                    setData((prev) => ({
                                        ...prev,
                                        price_rupiah: price,
                                        deposit_rupiah: deposit,
                                        size_m2: size,
                                    }));
                                }}
                                disabled={processing}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih tipe" />
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
                            <InputError message={errors.room_type_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(v) => setData('status', v)}
                                disabled={processing}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(statuses ?? []).map((s) => (
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
                            <InputError message={errors.status} />
                        </div>
                    </div>
                    <Separator className="my-3" />
                </div>

                {/* Kebijakan & Penagihan */}
                <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">
                        Kebijakan & Penagihan
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Kebijakan Gender</Label>
                            <Select
                                value={data.gender_policy}
                                onValueChange={(v) =>
                                    setData('gender_policy', v)
                                }
                                disabled={processing}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih kebijakan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {genderPolicies.map((g) => (
                                            <SelectItem
                                                key={g.value}
                                                value={g.value}
                                            >
                                                {g.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.gender_policy} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Periode Penagihan</Label>
                            <Select
                                value={data.billing_period}
                                onValueChange={(v) =>
                                    setData('billing_period', v)
                                }
                                disabled={processing}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Pilih periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {billingPeriods.map((p) => (
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
                            <InputError message={errors.billing_period} />
                        </div>
                    </div>
                    <Separator className="my-3" />
                </div>

                {/* Kapasitas, Harga, Deposit, Luas */}
                <div className="grid gap-4 md:grid-cols-12">
                    <div className="col-span-12 grid gap-2 md:col-span-3">
                        <Label>Kapasitas (orang)</Label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="cth: 1"
                            value={data.max_occupancy}
                            onChange={onChange('max_occupancy')}
                            className="h-9"
                            disabled={processing}
                        />
                        <div className="min-h-[20px] text-xs text-muted-foreground" />
                        <div className="min-h-[20px]">
                            <InputError message={errors.max_occupancy} />
                        </div>
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-6 md:col-span-3">
                        <Label>Harga (Rp/bulan)</Label>
                        <Input
                            type="number"
                            min={0}
                            placeholder="Otomatis setelah pilih tipe"
                            value={data.price_rupiah}
                            onChange={onChange('price_rupiah')}
                            className="h-9"
                            disabled={processing || !data.room_type_id}
                        />
                        <div className="min-h-[20px] text-xs text-muted-foreground">
                            {formatIDR(data.price_rupiah) ? (
                                <span>
                                    Pratinjau:{' '}
                                    <span className="font-medium">
                                        Rp {formatIDR(data.price_rupiah)}
                                    </span>{' '}
                                    / bulan
                                </span>
                            ) : null}
                        </div>
                        <div className="min-h-[20px]">
                            <InputError message={errors.price_rupiah} />
                        </div>
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-6 md:col-span-3">
                        <Label>Deposit (Rp)</Label>
                        <Input
                            type="number"
                            min={0}
                            placeholder="Otomatis setelah pilih tipe"
                            value={data.deposit_rupiah}
                            onChange={(e) =>
                                setData('deposit_rupiah', e.target.value)
                            }
                            className="h-9"
                            disabled={processing || !data.room_type_id}
                        />
                        <div className="min-h-[20px] text-xs text-muted-foreground">
                            {formatIDR(data.deposit_rupiah) ? (
                                <span>
                                    Pratinjau:{' '}
                                    <span className="font-medium">
                                        Rp {formatIDR(data.deposit_rupiah)}
                                    </span>
                                </span>
                            ) : null}
                        </div>
                        <div className="min-h-[20px]">
                            <InputError
                                message={
                                    (
                                        errors as unknown as Record<
                                            string,
                                            string
                                        >
                                    ).deposit_rupiah
                                }
                            />
                        </div>
                    </div>

                    <div className="col-span-12 grid gap-2 md:col-span-3">
                        <Label>Luas (m²)</Label>
                        <Input
                            type="number"
                            min={0}
                            step="0.1"
                            placeholder="Otomatis setelah pilih tipe"
                            value={data.size_m2}
                            onChange={(e) => setData('size_m2', e.target.value)}
                            className="h-9"
                            disabled={processing || !data.room_type_id}
                        />
                        <div className="min-h-[20px] text-xs text-muted-foreground" />
                        <div className="min-h-[20px]">
                            <InputError
                                message={
                                    (
                                        errors as unknown as Record<
                                            string,
                                            string
                                        >
                                    ).size_m2
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Ringkasan angka harga, deposit, luas */}
                <p className="-mt-12 text-xs text-muted-foreground">
                    Catatan: Harga, Deposit dan Luas kamar terisi otomatis dari{' '}
                    <span className="font-medium">Tipe Kamar</span>. Anda tetap
                    bisa mengubahnya (override) jika diperlukan.
                </p>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">
                        Catatan
                    </div>
                    <Textarea
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder="Informasi tambahan terkait kamar (opsional)"
                        disabled={processing}
                    />
                    <InputError message={errors.notes} />
                    <Separator className="my-3" />
                </div>

                {/* Fasilitas */}
                <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">
                        Fasilitas Kamar
                    </div>
                    {amenities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Belum ada data fasilitas. Tambahkan terlebih dahulu
                            di manajemen fasilitas.
                        </p>
                    ) : (
                        <ScrollArea className="max-h-[60vh] rounded-md border md:h-40 lg:h-28">
                            <div className="grid gap-2 p-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {amenities.map((a) => {
                                    const sid = String(a.id);
                                    const checked = (
                                        data.amenities ?? []
                                    ).includes(sid);
                                    const inputId = `amenity-${a.id}`;
                                    return (
                                        <div
                                            key={a.id}
                                            className={`flex items-center gap-2 rounded-md border p-2 text-sm transition hover:bg-muted ${checked ? 'border-primary' : 'border-input'}`}
                                        >
                                            <Checkbox
                                                id={inputId}
                                                checked={checked}
                                                onCheckedChange={() =>
                                                    toggleAmenity(a.id)
                                                }
                                                disabled={processing}
                                            />
                                            <Label
                                                htmlFor={inputId}
                                                className="cursor-pointer truncate"
                                            >
                                                {a.name}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                    <InputError message={errors.amenities} />
                    <Separator className="my-3" />
                </div>

                {/* Foto Saat Ini (mode edit) */}
                {mode === 'edit' && (photos?.length ?? 0) > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-foreground">
                                Foto Saat Ini
                            </div>
                            {photosDirty ? (
                                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                    <span>Perubahan belum disimpan</span>
                                </div>
                            ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {(photos ?? []).map((p, idx) => (
                                <div
                                    key={p.id}
                                    className={`group relative overflow-hidden rounded-md border bg-card shadow-sm ${overIndex === idx ? 'ring-2 ring-primary' : ''}`}
                                    draggable
                                    onDragStart={() => setDragIndex(idx)}
                                    onDragEnter={() => setOverIndex(idx)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnd={() => {
                                        setDragIndex(null);
                                        setOverIndex(null);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (
                                            dragIndex === null ||
                                            dragIndex === idx
                                        ) {
                                            setDragIndex(null);
                                            setOverIndex(null);
                                            return;
                                        }
                                        const next = [...photos];
                                        const [moved] = next.splice(
                                            dragIndex,
                                            1,
                                        );
                                        next.splice(idx, 0, moved);
                                        setDragIndex(null);
                                        setOverIndex(null);
                                        setPhotos(next);
                                    }}
                                >
                                    <div className="relative aspect-square">
                                        <img
                                            src={p.url}
                                            alt="foto kamar"
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onClick={() => {
                                                setPreviewIdx(idx);
                                                setPreviewOpen(true);
                                            }}
                                        />
                                        {p.is_cover ? (
                                            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                Cover
                                            </span>
                                        ) : null}
                                        <div className="pointer-events-none absolute inset-x-1 top-1 flex items-center justify-end gap-1">
                                            <div className="pointer-events-auto flex gap-1">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-7 w-7"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAsCover(p.id);
                                                    }}
                                                    title="Jadikan cover"
                                                >
                                                    <ImageIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-7 w-7"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deletePhoto(p.id);
                                                    }}
                                                    title="Hapus foto"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                                            <GripVertical className="h-3.5 w-3.5" />
                                            <span>Seret untuk urutan</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ImageSpotlight
                            open={previewOpen}
                            onOpenChange={setPreviewOpen}
                            items={previewItems}
                            index={previewIdx}
                            onIndexChange={setPreviewIdx}
                        />
                    </div>
                ) : null}

                {/* Upload Foto Baru */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">
                        Tambah Foto
                    </div>
                    <ImageDropzone
                        files={data.photos}
                        onFilesChange={(files) => setData('photos', files)}
                        disabled={processing}
                        reorderable
                        enableCover={mode === 'create'}
                    />
                    <p className="text-xs text-muted-foreground">
                        Foto baru akan diunggah setelah simpan.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (mode === 'create') {
                                reset();
                                clearErrors();
                            } else {
                                reset();
                                clearErrors();
                                setPhotos(initialPhotosRef.current);
                            }
                        }}
                        disabled={processing}
                    >
                        Reset
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {mode === 'create' ? 'Simpan' : 'Simpan Perubahan'}
                    </Button>
                </div>
            </form>

            <LeaveGuardDialog
                open={leaveOpen}
                onOpenChange={setLeaveOpen}
                onConfirm={confirmLeave}
                onCancel={cancelLeave}
                title="Keluar tanpa menyimpan?"
                description={
                    <>
                        Anda memiliki perubahan yang belum disimpan (form/foto).
                        Jika keluar, perubahan akan hilang.
                    </>
                }
                confirmText="Keluar Halaman"
                cancelText="Batal"
            />
        </>
    );
}
