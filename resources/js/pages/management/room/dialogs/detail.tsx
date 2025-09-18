'use client';

import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Pencil,
} from 'lucide-react';
import * as React from 'react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ImageSpotlight, SpotlightItem } from '@/components/ui/image-spotlight';
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

    React.useEffect(() => {
        let ignore = false;
        const controller = new AbortController();
        async function load() {
            if (!open || !roomId) return;
            setLoading(true);
            setError(null);
            setData(null);
            try {
                const res = await fetch(
                    route('management.rooms.show', roomId),
                    {
                        headers: { Accept: 'application/json' },
                        signal: controller.signal,
                    },
                );
                if (!res.ok) throw new Error('Failed to load room');
                const json = (await res.json()) as RoomDetail;
                if (!ignore) setData(json);
            } catch {
                if (!ignore) setError('Gagal memuat detail kamar');
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        load();
        return () => {
            ignore = true;
            controller.abort();
        };
    }, [open, roomId]);

    const prev = React.useCallback(
        () => setCurrent((i) => Math.max(0, i - 1)),
        [],
    );
    const next = React.useCallback(
        () => setCurrent((i) => Math.min(photoCount - 1, i + 1)),
        [photoCount],
    );
    const selectThumb = React.useCallback((i: number) => setCurrent(i), []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                <DialogHeader className="px-5 pb-4 pt-6 sm:px-6">
                    <DialogTitle>Detail Kamar</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto overscroll-contain">
                    <div className="space-y-6 px-5 py-6 sm:px-6">
                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-[240px] w-full" />
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-6 w-2/3" />
                            </div>
                        ) : error ? (
                            <div className="rounded-md border p-4 text-sm text-destructive">
                                {error}
                            </div>
                        ) : data ? (
                            <div className="space-y-6">
                                <section className="rounded-xl border bg-muted/10">
                                    <div className="flex flex-col gap-4 p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold">
                                                {data.number} —{' '}
                                                {data.name ?? '-'}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={goEdit}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />{' '}
                                                Edit
                                            </Button>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Status
                                                </div>
                                                <div>
                                                    <Badge
                                                        variant={
                                                            statusVariant[
                                                                (
                                                                    data.status ||
                                                                    ''
                                                                ).toLowerCase()
                                                            ] ?? 'outline'
                                                        }
                                                    >
                                                        {data.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Penghuni Maks.
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.max_occupancy}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Periode Tagih
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {periodLabel(
                                                        data.billing_period,
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Gedung
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.building?.name ?? '-'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Lantai
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.floor?.level ?? '-'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Tipe
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.type?.name ?? '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-xl border bg-muted/10">
                                    <div className="flex flex-col gap-4 p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold">
                                                Foto Kamar
                                            </div>
                                            {currentPhoto ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setPreviewOpen(true);
                                                        setPreviewIdx(current);
                                                    }}
                                                >
                                                    <ImageIcon className="mr-2 h-4 w-4" />{' '}
                                                    Pratinjau
                                                </Button>
                                            ) : null}
                                        </div>
                                        <div>
                                            <AspectRatio
                                                ratio={4 / 3}
                                                className="overflow-hidden rounded-lg border bg-background/80"
                                            >
                                                {currentPhoto ? (
                                                    <img
                                                        src={currentPhoto.url}
                                                        alt={`Room ${data.number}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <ImageIcon className="h-5 w-5" />{' '}
                                                            Tidak ada foto
                                                        </div>
                                                    </div>
                                                )}
                                                {photoCount > 1 ? (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="secondary"
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/70"
                                                            onClick={prev}
                                                            title="Sebelumnya"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="secondary"
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/70"
                                                            onClick={next}
                                                            title="Berikutnya"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                        <div className="pointer-events-none absolute bottom-2 left-0 right-0 mx-auto flex w-fit items-center gap-1 rounded bg-black/40 px-2 py-0.5">
                                                            <span className="text-xs text-white">
                                                                {current + 1} /{' '}
                                                                {photoCount}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : null}
                                            </AspectRatio>
                                        </div>
                                        {photoCount > 1 ? (
                                            <div className="flex items-center gap-2 overflow-x-auto">
                                                {photos.map((p, i) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border ${i === current ? 'ring-2 ring-primary' : ''}`}
                                                        onClick={() =>
                                                            selectThumb(i)
                                                        }
                                                        title={`Foto ${i + 1}`}
                                                    >
                                                        <img
                                                            src={p.url}
                                                            alt={`Thumb ${i + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        {p.is_cover ? (
                                                            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                                                                Cover
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                </section>

                                <section className="rounded-xl border bg-muted/10">
                                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                                        <div>
                                            <div className="text-sm font-semibold">
                                                Fasilitas
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                                                {data.amenities.length ? (
                                                    data.amenities.map((a) => (
                                                        <div
                                                            key={a.id}
                                                            className="rounded border bg-background px-2 py-1"
                                                        >
                                                            {a.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted-foreground">
                                                        Tidak ada fasilitas
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold">
                                                Keterangan
                                            </div>
                                            <div className="mt-2 rounded border bg-background p-3 text-sm text-muted-foreground">
                                                {data.notes ?? '-'}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                                Tidak ada data kamar.
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="border-t bg-background/95 px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={closeDialog}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
            <ImageSpotlight
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                items={previewItems}
                index={previewIdx}
                onIndexChange={setPreviewIdx}
            />
        </Dialog>
    );
}
