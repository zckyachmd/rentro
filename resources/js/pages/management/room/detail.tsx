'use client';

import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Loader2,
    Pencil,
    X,
} from 'lucide-react';
import * as React from 'react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ImageSpotlight, SpotlightItem } from '@/components/ui/image-spotlight';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoomItem } from '@/pages/management/room/columns';

type RoomDetail = {
    id: string;
    number: string;
    name?: string | null;
    status: string;
    max_occupancy: number;
    price_rupiah?: string | null;
    deposit_rupiah?: string | null;
    area_sqm?: number | null;
    gender_policy?: string | null;
    billing_period?: string | null;
    notes?: string | null;
    building?: { id: number; name: string } | null;
    floor?: { id: number; level: number | string; building_id: number } | null;
    type?: { id: string; name: string } | null;
    photos: {
        id: string;
        url: string;
        is_cover?: boolean;
        ordering?: number;
    }[];
    amenities: { id: number; name: string }[];
};

const statusVariant: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    vacant: 'secondary',
    reserved: 'outline',
    occupied: 'default',
    maintenance: 'destructive',
    inactive: 'outline',
};

const genderLabel = (v?: string | null) =>
    v === 'male' ? 'Pria' : v === 'female' ? 'Wanita' : 'Bebas';
const periodLabel = (v?: string | null) =>
    v === 'weekly' ? 'Mingguan' : v === 'daily' ? 'Harian' : 'Bulanan';

export default function RoomDetailDialog({
    open,
    item,
    onOpenChange,
}: {
    open: boolean;
    item: RoomItem | null;
    onOpenChange: (open: boolean) => void;
}) {
    const roomId = item?.id ?? null;

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [data, setData] = React.useState<RoomDetail | null>(null);

    const photos = React.useMemo(() => data?.photos ?? [], [data?.photos]);
    const photoCount = photos.length;
    const [current, setCurrent] = React.useState(0);
    const currentPhoto = React.useMemo(
        () => photos[current] ?? null,
        [photos, current],
    );
    const editRoute = React.useMemo(
        () => (data ? route('management.rooms.edit', { room: data.id }) : null),
        [data],
    );
    const goEdit = React.useCallback(() => {
        if (editRoute) router.visit(editRoute);
    }, [editRoute]);
    const closeDialog = React.useCallback(
        () => onOpenChange(false),
        [onOpenChange],
    );

    const previewItems: SpotlightItem[] = React.useMemo(
        () => photos.map((p) => ({ url: p.url, is_cover: p.is_cover })),
        [photos],
    );
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewIdx, setPreviewIdx] = React.useState(0);

    const coverIndex = React.useMemo(() => {
        if (!photoCount) return 0;
        const idx = photos.findIndex((p) => p.is_cover);
        return idx >= 0 ? idx : 0;
    }, [photos, photoCount]);

    React.useEffect(() => {
        if (!photoCount) {
            setCurrent(0);
        } else if (current >= photoCount) {
            setCurrent(photoCount - 1);
        } else if (!photos[current]) {
            setCurrent(coverIndex);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [photoCount, photos, coverIndex]);

    const next = React.useCallback(() => {
        if (!photoCount) return;
        setCurrent((c) => (((c + 1) % photoCount) + photoCount) % photoCount);
    }, [photoCount]);

    const prev = React.useCallback(() => {
        if (!photoCount) return;
        setCurrent((c) => (((c - 1) % photoCount) + photoCount) % photoCount);
    }, [photoCount]);

    const openPreview = React.useCallback(() => {
        if (!photoCount) return;
        setPreviewIdx(current);
        setPreviewOpen(true);
    }, [photoCount, current]);

    const selectThumb = React.useCallback(
        (i: number) => {
            if (i < 0 || i >= photoCount) return;
            setCurrent(i);
        },
        [photoCount],
    );

    React.useEffect(() => {
        if (!open || !roomId) return;
        const ctrl = new AbortController();
        setLoading(true);
        setError(null);
        setData(null);
        const url = route('management.rooms.show', { room: roomId });
        fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            signal: ctrl.signal,
        })
            .then(async (res) => {
                if (!res.ok)
                    throw new Error(`Gagal memuat detail (${res.status})`);
                const j = (await res.json()) as { room: RoomDetail };
                setData(j.room);
            })
            .catch((e) => {
                if (e?.name === 'AbortError') return;
                setError(e?.message ?? 'Gagal memuat detail');
            })
            .finally(() => setLoading(false));
        return () => ctrl.abort();
    }, [open, roomId]);

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) {
                    setData(null);
                    setError(null);
                    setLoading(false);
                }
                onOpenChange(o);
            }}
        >
            <DialogContent className="grid max-h-[90vh] max-w-[98vw] grid-rows-[auto,1fr,auto] p-0 sm:max-w-5xl">
                <DialogHeader className="px-6 pb-2 pt-6">
                    <DialogTitle className="text-base sm:text-lg">
                        Detail Kamar
                    </DialogTitle>
                </DialogHeader>

                <Separator />

                <div className="min-h-0 px-6 py-4">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Sedang memuat…</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <Skeleton className="h-64 w-full rounded-md md:h-72 lg:h-80" />
                                        <div className="mt-3 grid grid-cols-6 gap-2">
                                            {Array.from({ length: 6 }).map(
                                                (_, i) => (
                                                    <Skeleton
                                                        key={i}
                                                        className="h-14 w-full rounded"
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">
                                            Informasi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {Array.from({ length: 6 }).map(
                                            (_, i) => (
                                                <div
                                                    key={i}
                                                    className="space-y-2"
                                                >
                                                    <Skeleton className="h-3 w-24" />
                                                    <Skeleton className="h-4 w-40" />
                                                </div>
                                            ),
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-sm text-destructive">{error}</div>
                    ) : data ? (
                        <ScrollArea className="h-full pr-2">
                            <div className="space-y-5 px-1 sm:px-2">
                                {/* Meta badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant={
                                            statusVariant[data.status] ??
                                            'outline'
                                        }
                                        className="capitalize"
                                    >
                                        {data.status}
                                    </Badge>
                                    {data.gender_policy ? (
                                        <Badge variant="outline">
                                            {genderLabel(data.gender_policy)}
                                        </Badge>
                                    ) : null}
                                    {data.type?.name ? (
                                        <Badge variant="secondary">
                                            {data.type.name}
                                        </Badge>
                                    ) : null}
                                    {data.building?.name ? (
                                        <Badge variant="outline">
                                            {data.building.name}
                                        </Badge>
                                    ) : null}
                                    {data.floor?.level !== undefined &&
                                    data.floor?.level !== null ? (
                                        <Badge variant="outline">
                                            Lt {data.floor.level}
                                        </Badge>
                                    ) : null}
                                </div>

                                {/* Main grid */}
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Photos column */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">
                                                Foto
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {photoCount === 0 ? (
                                                <div className="flex items-center gap-2 rounded border p-3 text-sm text-muted-foreground">
                                                    <ImageIcon className="h-4 w-4" />{' '}
                                                    Tidak ada foto.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {/* Main slider with fixed ratio */}
                                                    <div className="relative max-h-64 overflow-hidden rounded-md border sm:max-h-72 lg:max-h-80">
                                                        <AspectRatio
                                                            ratio={4 / 3}
                                                        >
                                                            <img
                                                                key={
                                                                    currentPhoto?.id
                                                                }
                                                                src={
                                                                    currentPhoto?.url
                                                                }
                                                                alt={`Foto ${current + 1}`}
                                                                className="absolute inset-0 h-full w-full cursor-zoom-in object-cover"
                                                                onClick={
                                                                    openPreview
                                                                }
                                                            />
                                                            {currentPhoto?.is_cover ? (
                                                                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                                                                    Cover
                                                                </span>
                                                            ) : null}
                                                            {photoCount > 1 ? (
                                                                <>
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        variant="secondary"
                                                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/70"
                                                                        onClick={
                                                                            prev
                                                                        }
                                                                        title="Sebelumnya"
                                                                    >
                                                                        <ChevronLeft className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        variant="secondary"
                                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/70"
                                                                        onClick={
                                                                            next
                                                                        }
                                                                        title="Berikutnya"
                                                                    >
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    </Button>
                                                                    <div className="pointer-events-none absolute bottom-2 left-0 right-0 mx-auto flex w-fit items-center gap-1 rounded bg-black/40 px-2 py-0.5">
                                                                        <span className="text-xs text-white">
                                                                            {current +
                                                                                1}{' '}
                                                                            /{' '}
                                                                            {
                                                                                photoCount
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : null}
                                                        </AspectRatio>
                                                    </div>
                                                    {/* Thumbnails */}
                                                    {photoCount > 1 ? (
                                                        <div className="flex items-center gap-2 overflow-x-auto">
                                                            {photos.map(
                                                                (p, i) => (
                                                                    <button
                                                                        key={
                                                                            p.id
                                                                        }
                                                                        type="button"
                                                                        className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border ${i === current ? 'ring-2 ring-primary' : ''}`}
                                                                        onClick={() =>
                                                                            selectThumb(
                                                                                i,
                                                                            )
                                                                        }
                                                                        title={`Foto ${i + 1}`}
                                                                    >
                                                                        <img
                                                                            src={
                                                                                p.url
                                                                            }
                                                                            alt={`Thumb ${i + 1}`}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                        {p.is_cover ? (
                                                                            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                                                                                Cover
                                                                            </span>
                                                                        ) : null}
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Info column */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">
                                                Informasi
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="space-y-1">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Nomor
                                                    </dt>
                                                    <dd className="text-sm font-medium">
                                                        {data.number}
                                                    </dd>
                                                </div>
                                                <div className="space-y-1">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Nama
                                                    </dt>
                                                    <dd className="text-sm">
                                                        {data.name ?? '-'}
                                                    </dd>
                                                </div>
                                                <div className="space-y-1">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Kapasitas
                                                    </dt>
                                                    <dd className="text-sm">
                                                        {data.max_occupancy}{' '}
                                                        orang
                                                    </dd>
                                                </div>
                                                <div className="space-y-1">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Luas
                                                    </dt>
                                                    <dd className="text-sm">
                                                        {data.area_sqm
                                                            ? `${data.area_sqm} m²`
                                                            : '-'}
                                                    </dd>
                                                </div>
                                                <div className="space-y-1">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Harga
                                                    </dt>
                                                    <dd className="text-sm">
                                                        {data.price_rupiah ??
                                                            '-'}
                                                    </dd>
                                                </div>
                                                <div className="space-y-1">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Deposit
                                                    </dt>
                                                    <dd className="text-sm">
                                                        {data.deposit_rupiah ??
                                                            '-'}
                                                    </dd>
                                                </div>
                                                <div className="space-y-1">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Penagihan
                                                    </dt>
                                                    <dd className="text-sm">
                                                        {periodLabel(
                                                            data.billing_period,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="space-y-1">
                                                    <dt className="text-xs text-muted-foreground">
                                                        Kebijakan Gender
                                                    </dt>
                                                    <dd className="text-sm">
                                                        {genderLabel(
                                                            data.gender_policy,
                                                        )}
                                                    </dd>
                                                </div>
                                                {/* Kamar mandi tidak diturunkan dari tipe lagi; gunakan amenities */}
                                            </dl>

                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">
                                                    Fasilitas
                                                </div>
                                                {data.amenities.length === 0 ? (
                                                    <div className="rounded border p-3 text-sm text-muted-foreground">
                                                        -
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {data.amenities.map(
                                                            (a) => (
                                                                <Badge
                                                                    key={a.id}
                                                                    variant="outline"
                                                                >
                                                                    {a.name}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">
                                                    Catatan
                                                </div>
                                                <div className="whitespace-pre-wrap rounded border p-3 text-sm">
                                                    {data.notes?.trim()
                                                        ? data.notes
                                                        : '-'}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </ScrollArea>
                    ) : null}
                </div>

                <Separator />

                <DialogFooter className="px-6 py-4">
                    {data ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={goEdit}
                            className="gap-2"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        onClick={closeDialog}
                        className="gap-2"
                    >
                        <X className="h-4 w-4" />
                        Tutup
                    </Button>
                </DialogFooter>

                <ImageSpotlight
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    items={previewItems}
                    index={previewIdx}
                    onIndexChange={setPreviewIdx}
                />
            </DialogContent>
        </Dialog>
    );
}
