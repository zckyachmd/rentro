import { useForm } from '@inertiajs/react';
import { GripVertical, Image as ImageIcon, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { ensureXsrfToken } from '@/hooks/use-confirm-password';
import { LeaveGuardDialog, useLeaveGuard } from '@/hooks/use-leave-guard';
import { createAbort, postJson } from '@/lib/api';
import { formatIDR } from '@/lib/format';
import type {
    AmenityOption,
    FloorOption,
    GenderPolicyOption,
    RoomForm,
    RoomPhotoView,
    RoomTypeOption,
    RoomUpsertOptions,
    StringKeys,
} from '@/types/management';

export default function RoomUpsertForm({
    mode,
    options,
    room,
}: {
    mode: 'create' | 'edit';
    options?: RoomUpsertOptions;
    room?: import('@/types/management').RoomUpsert;
}) {
    const { t: tRoom } = useTranslation('management/room');
    const { t } = useTranslation();
    // =========================
    // 1) Sumber data opsi (tanpa useMemo — ringan & jelas)
    // =========================
    const buildings = options?.buildings ?? [];
    const floors = React.useMemo(
        () => (options?.floors ?? []) as FloorOption[],
        [options?.floors],
    );
    const types = React.useMemo(
        () => (options?.types ?? []) as RoomTypeOption[],
        [options?.types],
    );
    const statuses = options?.statuses ?? [];
    const amenities = (options?.amenities ?? []) as AmenityOption[];
    const genderPolicies = (options?.gender_policies ??
        []) as GenderPolicyOption[];

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
    } = useForm<RoomForm>({
        building_id: defaultBuildingId,
        floor_id: defaultFloorId,
        room_type_id: defaultTypeId,
        number: room?.number ?? '',
        name: room?.name ?? '',
        status: room?.status ?? '',
        max_occupancy: room?.max_occupancy ? String(room.max_occupancy) : '1',
        price_rupiah: room?.price_rupiah ? String(room.price_rupiah) : '',
        price_weekly_rupiah: room?.price_weekly_rupiah
            ? String(room.price_weekly_rupiah)
            : '',
        price_daily_rupiah: room?.price_daily_rupiah
            ? String(room.price_daily_rupiah)
            : '',
        deposit_rupiah: room?.deposit_rupiah ? String(room.deposit_rupiah) : '',
        deposit_weekly_rupiah: room?.deposit_weekly_rupiah
            ? String(room.deposit_weekly_rupiah)
            : '',
        deposit_daily_rupiah: room?.deposit_daily_rupiah
            ? String(room.deposit_daily_rupiah)
            : '',
        size_m2: room?.size_m2 ? String(room.size_m2) : '',
        notes: room?.notes ?? '',
        photos: [] as File[],
        amenities: (room?.amenities ?? []).map((id) => String(id)),
        gender_policy: room?.gender_policy ?? genderPolicies[0]?.value ?? '',
    });

    // =========================
    // 5) Tipe terpilih untuk placeholder "Mengikuti tipe"
    // =========================
    const selectedType = React.useMemo(
        () => types.find((tt) => String(tt.id) === data.room_type_id),
        [types, data.room_type_id],
    );
    const typeMonthly = selectedType?.prices?.monthly ?? null;
    const typeWeekly = selectedType?.prices?.weekly ?? null;
    const typeDaily = selectedType?.prices?.daily ?? null;
    const typeDepMonthly = selectedType?.deposits?.monthly ?? null;
    const typeDepWeekly = selectedType?.deposits?.weekly ?? null;
    const typeDepDaily = selectedType?.deposits?.daily ?? null;

    const didInitDefaults = React.useRef(false);

    React.useEffect(() => {
        if (didInitDefaults.current) return;
        if (!data.room_type_id) {
            didInitDefaults.current = true;
            return;
        }
        const t = types.find((tt) => String(tt.id) === data.room_type_id);
        if (t) {
            const monthly = t.prices?.monthly ?? null;
            const weekly = t.prices?.weekly ?? null;
            const daily = t.prices?.daily ?? null;
            const depMonthly = t.deposits?.monthly ?? null;
            const depWeekly = t.deposits?.weekly ?? null;
            const depDaily = t.deposits?.daily ?? null;
            const price =
                monthly != null
                    ? String(Math.round((monthly as number) / 100))
                    : '';
            const priceW =
                weekly != null
                    ? String(Math.round((weekly as number) / 100))
                    : '';
            const priceD =
                daily != null
                    ? String(Math.round((daily as number) / 100))
                    : '';
            const deposit =
                depMonthly != null
                    ? String(Math.round((depMonthly as number) / 100))
                    : '';
            const depositW =
                depWeekly != null
                    ? String(Math.round((depWeekly as number) / 100))
                    : '';
            const depositD =
                depDaily != null
                    ? String(Math.round((depDaily as number) / 100))
                    : '';
            setData((prev) => ({
                ...prev,
                price_rupiah: prev.price_rupiah || price,
                price_weekly_rupiah: prev.price_weekly_rupiah || priceW,
                price_daily_rupiah: prev.price_daily_rupiah || priceD,
                deposit_rupiah: prev.deposit_rupiah || deposit,
                deposit_weekly_rupiah: prev.deposit_weekly_rupiah || depositW,
                deposit_daily_rupiah: prev.deposit_daily_rupiah || depositD,
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
        <K extends StringKeys<RoomForm>>(field: K) =>
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

            const ctrl = createAbort();
            await postJson(
                route('management.rooms.photos.batch', room.id),
                {
                    deleted_ids,
                    ordered_ids,
                    cover_id,
                },
                { signal: ctrl.signal },
            );
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
                return;
            }
        }

        const token = await ensureXsrfToken();

        if (mode === 'create') {
            beginSkip();
            post(route('management.rooms.store'), {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': token || '',
                },
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                },
                onFinish: () => {
                    endSkip();
                },
            });
        } else if (mode === 'edit' && room?.id) {
            if (photosDirty) {
                const ok = await savePhotoChanges();
                if (!ok) return;
            }

            transform((current) => ({ ...current, _method: 'put' as const }));
            beginSkip();
            post(route('management.rooms.update', room.id), {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': token || '',
                },
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setData('photos', []);
                },
                onFinish: () => {
                    endSkip();
                },
            });

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
                <div className="space-y-2">
                    <div className="text-foreground text-sm font-medium">
                        {tRoom('form.identity.title')}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {tRoom('form.identity.desc')}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label>
                                {tRoom('form.number_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                value={data.number}
                                onChange={onChange('number')}
                                placeholder={t(
                                    'management/room:form.number_placeholder',
                                )}
                                disabled={processing}
                                className="h-10 text-sm"
                            />

                            {!errors.number ? (
                                <p className="text-muted-foreground text-xs">
                                    {tRoom('form.number_hint')}
                                </p>
                            ) : (
                                <InputError message={errors.number} />
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label>{tRoom('form.name_label')}</Label>
                            <Input
                                value={data.name}
                                onChange={onChange('name')}
                                placeholder={t(
                                    'management/room:form.name_placeholder',
                                )}
                                disabled={processing}
                                className="h-10 text-sm"
                            />

                            {!errors.name ? (
                                <p className="text-muted-foreground text-xs">
                                    {tRoom('form.name_hint')}
                                </p>
                            ) : (
                                <InputError message={errors.name} />
                            )}
                        </div>
                    </div>
                    <Separator className="my-3" />
                </div>

                {/* Lokasi & Klasifikasi */}
                <div className="space-y-2">
                    <div className="text-foreground text-sm font-medium">
                        {tRoom('form.location.title')}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {tRoom('form.location.desc')}
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-1">
                            <Label>
                                {tRoom('form.building_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
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
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue
                                        placeholder={t(
                                            'management/room:form.building_placeholder',
                                        )}
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
                            <InputError message={errors.building_id} />
                        </div>

                        <div className="grid gap-1">
                            <Label>
                                {tRoom('form.floor_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={data.floor_id}
                                onValueChange={(v) => setData('floor_id', v)}
                                disabled={processing}
                            >
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue
                                        placeholder={t(
                                            'management/room:form.floor_placeholder',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {filteredFloors.map((f) => (
                                            <SelectItem
                                                key={f.id}
                                                value={String(f.id)}
                                            >
                                                {t(
                                                    'management/room:form.floor_option',
                                                    { level: f.level },
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.floor_id} />
                        </div>

                        <div className="grid gap-1">
                            <Label>
                                {tRoom('form.type_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={data.room_type_id}
                                onValueChange={(v) => {
                                    setData('room_type_id', v);
                                    const t = types.find(
                                        (tt) => String(tt.id) === v,
                                    );
                                    const monthly = t?.prices?.monthly ?? null;
                                    const weekly = t?.prices?.weekly ?? null;
                                    const daily = t?.prices?.daily ?? null;
                                    const depMonthly =
                                        t?.deposits?.monthly ?? null;
                                    const depWeekly =
                                        t?.deposits?.weekly ?? null;
                                    const depDaily = t?.deposits?.daily ?? null;
                                    const price =
                                        monthly != null
                                            ? String(
                                                  Math.round(
                                                      (monthly as number) / 100,
                                                  ),
                                              )
                                            : '';
                                    const priceW =
                                        weekly != null
                                            ? String(
                                                  Math.round(
                                                      (weekly as number) / 100,
                                                  ),
                                              )
                                            : '';
                                    const priceD =
                                        daily != null
                                            ? String(
                                                  Math.round(
                                                      (daily as number) / 100,
                                                  ),
                                              )
                                            : '';
                                    const deposit =
                                        depMonthly != null
                                            ? String(
                                                  Math.round(
                                                      (depMonthly as number) /
                                                          100,
                                                  ),
                                              )
                                            : '';
                                    const depositW =
                                        depWeekly != null
                                            ? String(
                                                  Math.round(
                                                      (depWeekly as number) /
                                                          100,
                                                  ),
                                              )
                                            : '';
                                    const depositD =
                                        depDaily != null
                                            ? String(
                                                  Math.round(
                                                      (depDaily as number) /
                                                          100,
                                                  ),
                                              )
                                            : '';
                                    setData((prev) => ({
                                        ...prev,
                                        price_rupiah: price,
                                        price_weekly_rupiah: priceW,
                                        price_daily_rupiah: priceD,
                                        deposit_rupiah: deposit,
                                        deposit_weekly_rupiah: depositW,
                                        deposit_daily_rupiah: depositD,
                                    }));
                                }}
                                disabled={processing}
                            >
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue
                                        placeholder={t(
                                            'management/room:form.type_placeholder',
                                        )}
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
                            <InputError message={errors.room_type_id} />
                        </div>

                        <div className="grid gap-1">
                            <Label>
                                {tRoom('form.status_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={data.status}
                                onValueChange={(v) => setData('status', v)}
                                disabled={processing}
                            >
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue
                                        placeholder={t(
                                            'management/room:form.status_placeholder',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {(statuses ?? []).map((s) => (
                                            <SelectItem
                                                key={s.value}
                                                value={s.value}
                                            >
                                                {t(
                                                    `room.status.${String(s.value).toLowerCase()}`,
                                                    {
                                                        ns: 'enum',
                                                        defaultValue: s.label,
                                                    },
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>
                    </div>
                </div>

                {/* Kapasitas, Harga, Deposit, Luas */}
                <div className="space-y-2">
                    <div className="text-foreground text-sm font-medium">
                        {tRoom('form.capacity.title')}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {tRoom('form.capacity.desc')}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Kiri: Kapasitas + Harga */}
                        <div className="grid gap-2">
                            <Label>
                                {tRoom('form.capacity_label')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="number"
                                min={1}
                                placeholder={t(
                                    'management/room:form.capacity_placeholder',
                                )}
                                value={data.max_occupancy}
                                onChange={onChange('max_occupancy')}
                                className="h-10 text-sm"
                                disabled={processing}
                            />
                            {errors.max_occupancy ? (
                                <InputError message={errors.max_occupancy} />
                            ) : (
                                <p className="text-muted-foreground text-xs">
                                    {tRoom('form.capacity_hint')}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>{tRoom('form.price_month_label')}</Label>
                            <Input
                                type="number"
                                min={0}
                                placeholder={t(
                                    'management/room:form.price_month_placeholder',
                                )}
                                value={data.price_rupiah}
                                onChange={onChange('price_rupiah')}
                                className="h-10 text-sm"
                                disabled={processing || !data.room_type_id}
                            />
                            <div className="text-muted-foreground flex min-h-[18px] items-center gap-2 text-xs">
                                {formatIDR(data.price_rupiah) && (
                                    <span>
                                        {tRoom('form.preview')}{' '}
                                        <span className="font-medium">
                                            {formatIDR(data.price_rupiah)}
                                        </span>{' '}
                                        {tRoom('form.per_month')}
                                    </span>
                                )}
                                {!data.price_rupiah &&
                                data.room_type_id &&
                                typeMonthly != null ? (
                                    <span className="rounded border px-1.5 py-0.5 text-[10px]">
                                        {tRoom('form.follow_type')}
                                    </span>
                                ) : null}
                            </div>
                            {errors.price_rupiah && (
                                <InputError message={errors.price_rupiah} />
                            )}
                        </div>

                        {/* Kanan: Luas + Deposit */}
                        <div className="grid gap-2">
                            <Label>{tRoom('form.size_label')}</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder={t(
                                    'management/room:form.size_placeholder',
                                )}
                                value={data.size_m2}
                                onChange={(e) =>
                                    setData('size_m2', e.target.value)
                                }
                                className="h-10 text-sm"
                                disabled={processing || !data.room_type_id}
                            />
                            {(errors as unknown as Record<string, string>)
                                .size_m2 ? (
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
                            ) : (
                                <p className="text-muted-foreground text-xs">
                                    Luas lantai dalam meter persegi.
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>{tRoom('form.deposit_month_label')}</Label>
                            <Input
                                type="number"
                                min={0}
                                placeholder={t(
                                    'management/room:form.deposit_month_placeholder',
                                )}
                                value={data.deposit_rupiah}
                                onChange={(e) =>
                                    setData('deposit_rupiah', e.target.value)
                                }
                                className="h-10 text-sm"
                                disabled={processing || !data.room_type_id}
                            />
                            <div className="text-muted-foreground flex min-h-[18px] items-center gap-2 text-xs">
                                {formatIDR(data.deposit_rupiah) ? (
                                    <span>
                                        {tRoom('form.preview')}{' '}
                                        <span className="font-medium">
                                            {formatIDR(data.deposit_rupiah)}
                                        </span>
                                    </span>
                                ) : null}
                                {!data.deposit_rupiah &&
                                data.room_type_id &&
                                typeDepMonthly != null ? (
                                    <span className="rounded border px-1.5 py-0.5 text-[10px]">
                                        {tRoom('form.follow_type')}
                                    </span>
                                ) : null}
                            </div>
                            {(errors as unknown as Record<string, string>)
                                .deposit_rupiah && (
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
                            )}
                        </div>
                    </div>
                </div>
                <Separator className="my-3" />

                {/* Harga & Deposit (Mingguan/Harian) */}
                <div className="space-y-2">
                    <div className="text-foreground text-sm font-medium">
                        {tRoom('form.weekday.title')}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="grid gap-2">
                            <Label>{tRoom('form.price_week_label')}</Label>
                            <Input
                                type="number"
                                min={0}
                                placeholder={t(
                                    'management/room:form.price_week_placeholder',
                                )}
                                value={data.price_weekly_rupiah}
                                onChange={onChange('price_weekly_rupiah')}
                                className="h-10 text-sm"
                                disabled={processing || !data.room_type_id}
                            />
                            <div className="text-muted-foreground flex min-h-[18px] items-center gap-2 text-xs">
                                {formatIDR(data.price_weekly_rupiah) ? (
                                    <span>
                                        {tRoom('form.preview')}{' '}
                                        <span className="font-medium">
                                            {formatIDR(
                                                data.price_weekly_rupiah,
                                            )}
                                        </span>{' '}
                                        {tRoom('form.per_week')}
                                    </span>
                                ) : null}
                                {!data.price_weekly_rupiah &&
                                data.room_type_id &&
                                typeWeekly != null ? (
                                    <span className="rounded border px-1.5 py-0.5 text-[10px]">
                                        {tRoom('form.follow_type')}
                                    </span>
                                ) : null}
                            </div>
                            {(errors as unknown as Record<string, string>)
                                .price_weekly_rupiah ? (
                                <InputError
                                    message={
                                        (
                                            errors as unknown as Record<
                                                string,
                                                string
                                            >
                                        ).price_weekly_rupiah
                                    }
                                />
                            ) : null}
                        </div>

                        <div className="grid gap-2">
                            <Label>{tRoom('form.price_day_label')}</Label>
                            <Input
                                type="number"
                                min={0}
                                placeholder={t(
                                    'management/room:form.price_day_placeholder',
                                )}
                                value={data.price_daily_rupiah}
                                onChange={onChange('price_daily_rupiah')}
                                className="h-10 text-sm"
                                disabled={processing || !data.room_type_id}
                            />
                            <div className="text-muted-foreground flex min-h-[18px] items-center gap-2 text-xs">
                                {formatIDR(data.price_daily_rupiah) ? (
                                    <span>
                                        {tRoom('form.preview')}{' '}
                                        <span className="font-medium">
                                            {formatIDR(data.price_daily_rupiah)}
                                        </span>{' '}
                                        {tRoom('form.per_day')}
                                    </span>
                                ) : null}
                                {!data.price_daily_rupiah &&
                                data.room_type_id &&
                                typeDaily != null ? (
                                    <span className="rounded border px-1.5 py-0.5 text-[10px]">
                                        {tRoom('form.follow_type')}
                                    </span>
                                ) : null}
                            </div>
                            {(errors as unknown as Record<string, string>)
                                .price_daily_rupiah ? (
                                <InputError
                                    message={
                                        (
                                            errors as unknown as Record<
                                                string,
                                                string
                                            >
                                        ).price_daily_rupiah
                                    }
                                />
                            ) : null}
                        </div>

                        <div className="grid gap-2">
                            <Label>{tRoom('form.deposit_week_label')}</Label>
                            <Input
                                type="number"
                                min={0}
                                placeholder={tRoom(
                                    'form.deposit_week_placeholder',
                                )}
                                value={data.deposit_weekly_rupiah}
                                onChange={(e) =>
                                    setData(
                                        'deposit_weekly_rupiah',
                                        e.target.value,
                                    )
                                }
                                className="h-10 text-sm"
                                disabled={processing || !data.room_type_id}
                            />
                            <div className="text-muted-foreground flex min-h-[18px] items-center gap-2 text-xs">
                                {formatIDR(data.deposit_weekly_rupiah) ? (
                                    <span>
                                        {tRoom('form.preview')}{' '}
                                        <span className="font-medium">
                                            {formatIDR(
                                                data.deposit_weekly_rupiah,
                                            )}
                                        </span>
                                    </span>
                                ) : null}
                                {!data.deposit_weekly_rupiah &&
                                data.room_type_id &&
                                typeDepWeekly != null ? (
                                    <span className="rounded border px-1.5 py-0.5 text-[10px]">
                                        {tRoom('form.follow_type')}
                                    </span>
                                ) : null}
                            </div>
                            {(errors as unknown as Record<string, string>)
                                .deposit_weekly_rupiah ? (
                                <InputError
                                    message={
                                        (
                                            errors as unknown as Record<
                                                string,
                                                string
                                            >
                                        ).deposit_weekly_rupiah
                                    }
                                />
                            ) : null}
                        </div>

                        <div className="grid gap-2">
                            <Label>{tRoom('form.deposit_day_label')}</Label>
                            <Input
                                type="number"
                                min={0}
                                placeholder={tRoom(
                                    'form.deposit_day_placeholder',
                                )}
                                value={data.deposit_daily_rupiah}
                                onChange={(e) =>
                                    setData(
                                        'deposit_daily_rupiah',
                                        e.target.value,
                                    )
                                }
                                className="h-10 text-sm"
                                disabled={processing || !data.room_type_id}
                            />
                            <div className="text-muted-foreground flex min-h-[18px] items-center gap-2 text-xs">
                                {formatIDR(data.deposit_daily_rupiah) ? (
                                    <span>
                                        {tRoom('form.preview')}{' '}
                                        <span className="font-medium">
                                            {formatIDR(
                                                data.deposit_daily_rupiah,
                                            )}
                                        </span>
                                    </span>
                                ) : null}
                                {!data.deposit_daily_rupiah &&
                                data.room_type_id &&
                                typeDepDaily != null ? (
                                    <span className="rounded border px-1.5 py-0.5 text-[10px]">
                                        {tRoom('form.follow_type')}
                                    </span>
                                ) : null}
                            </div>
                            {(errors as unknown as Record<string, string>)
                                .deposit_daily_rupiah ? (
                                <InputError
                                    message={
                                        (
                                            errors as unknown as Record<
                                                string,
                                                string
                                            >
                                        ).deposit_daily_rupiah
                                    }
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
                <Separator className="my-3" />

                {/* Fasilitas */}
                <div className="space-y-2">
                    <div className="text-foreground text-sm font-medium">
                        {t('common.amenities', 'Amenities')} (
                        {tRoom('form.notes.placeholder')})
                    </div>
                    {amenities.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            {tRoom('form.amenities_empty')}
                        </p>
                    ) : (
                        <ScrollArea className="h-40 rounded-md border sm:h-48 lg:h-56">
                            <div className="grid gap-1.5 p-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {amenities.map((a) => {
                                    const sid = String(a.id);
                                    const checked = (
                                        data.amenities ?? []
                                    ).includes(sid);
                                    const inputId = `amenity-${a.id}`;
                                    return (
                                        <div
                                            key={a.id}
                                            className={`hover:bg-muted flex items-center gap-2 rounded-md border p-2 text-sm transition ${checked ? 'border-primary' : 'border-input'}`}
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
                </div>

                {/* Foto Kamar */}
                <div className="space-y-2">
                    <div className="text-foreground text-sm font-medium">
                        {t('common.photos')}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {t('common.photos_hint')}
                    </p>
                    {/* Foto Saat Ini (mode edit) */}
                    {mode === 'edit' && (photos?.length ?? 0) > 0 ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-foreground text-sm font-medium">
                                    {tRoom('form.photos.current')}
                                </div>
                                {photosDirty ? (
                                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                        <span>
                                            {t(
                                                'common.unsaved_changes',
                                                'Perubahan belum disimpan',
                                            )}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                {(photos ?? []).map((p, idx) => (
                                    <div
                                        key={p.id}
                                        className={`group bg-card relative overflow-hidden rounded-md border shadow-sm ${overIndex === idx ? 'ring-primary ring-2' : ''}`}
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
                                                alt={`${t('common.room', 'Room')} photo`}
                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onClick={() => {
                                                    setPreviewIdx(idx);
                                                    setPreviewOpen(true);
                                                }}
                                            />
                                            {p.is_cover ? (
                                                <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                    {t(
                                                        'management/room:form.photos.cover',
                                                        'Cover',
                                                    )}
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
                                                        title={t(
                                                            'management/room:form.photos.make_cover',
                                                        )}
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
                                                        title={t(
                                                            'management/room:form.photos.delete_photo',
                                                        )}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                                                <GripVertical className="h-3.5 w-3.5" />
                                                <span>
                                                    {t(
                                                        'management/room:form.photos.drag_hint',
                                                    )}
                                                </span>
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
                        <ImageDropzone
                            files={data.photos}
                            onFilesChange={(files) => setData('photos', files)}
                            disabled={processing}
                            reorderable
                            enableCover={mode === 'create'}
                        />
                        <InputError message={errors.photos} />
                    </div>

                    {/* Catatan */}
                    <div className="space-y-2">
                        <div className="text-foreground text-sm font-medium">
                            {tRoom('form.notes.title')}
                        </div>
                        <Textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder={tRoom('form.notes.placeholder')}
                            disabled={processing}
                        />
                        <InputError message={errors.notes} />
                    </div>

                    <Separator className="my-3" />
                </div>

                {/* Kebijakan Penghuni */}
                <div className="space-y-2">
                    <div className="text-foreground text-sm font-medium">
                        {tRoom('form.policy.title')}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {tRoom('form.policy.desc')}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label>
                                {tRoom('form.gender_policy')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <RadioGroup
                                value={data.gender_policy}
                                onValueChange={(v) =>
                                    setData('gender_policy', v)
                                }
                                className="flex flex-col gap-2"
                                disabled={processing}
                            >
                                {genderPolicies.map((g) => (
                                    <div
                                        key={g.value}
                                        className="flex items-center gap-2"
                                    >
                                        <RadioGroupItem
                                            id={`gender-${g.value}`}
                                            value={g.value}
                                        />
                                        <Label htmlFor={`gender-${g.value}`}>
                                            {t(
                                                `gender_policy.${String(g.value).toLowerCase()}`,
                                                {
                                                    ns: 'enum',
                                                    defaultValue: g.label,
                                                },
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <InputError message={errors.gender_policy} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
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
                        {tRoom('form.reset')}
                    </Button>
                    <Button type="submit" size="sm" disabled={processing}>
                        {mode === 'create'
                            ? tRoom('form.save')
                            : tRoom('form.save_changes')}
                    </Button>
                </div>
            </form>

            <LeaveGuardDialog
                open={leaveOpen}
                onOpenChange={setLeaveOpen}
                onConfirm={confirmLeave}
                onCancel={cancelLeave}
                title={tRoom('form.leave.title')}
                description={<>{tRoom('form.leave.desc')}</>}
                confirmText={tRoom('form.leave.confirm')}
                cancelText={t('common.cancel')}
            />
        </>
    );
}
