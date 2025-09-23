'use client';

import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Pencil,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

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
import { createAbort, getJson } from '@/lib/api';
import type { RoomDetail, RoomItem } from '@/types/management';

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

export default function RoomDetailDialog({
    open,
    item,
    onOpenChange,
}: {
    open: boolean;
    item: RoomItem | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation();
    const roomId = item?.id ?? null;

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [data, setData] = React.useState<RoomDetail | null>(null);

    const photos = React.useMemo(() => data?.photos ?? [], [data?.photos]);
    const amenities = React.useMemo(
        () => data?.amenities ?? [],
        [data?.amenities],
    );
    const photoCount = photos.length;
    const [current, setCurrent] = React.useState(0);
    const currentPhoto = React.useMemo(
        () => photos[current] ?? null,
        [photos, current],
    );
    const goEdit = React.useCallback(() => {
        if (data?.id) {
            router.visit(route('management.rooms.edit', { room: data.id }));
        }
    }, [data?.id]);
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
        const controller = createAbort();
        (async () => {
            if (!open || !roomId) return;
            setLoading(true);
            setError(null);
            setData(null);
            try {
                const res = await getJson<{ room: RoomDetail }>(
                    route('management.rooms.show', { room: roomId }),
                    { signal: controller.signal },
                );
                setData(res?.room ?? null);
            } catch {
                setError(t('management.room.detail_error'));
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [open, roomId, t]);

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
            <DialogContent className="flex w-[95vw] max-w-[calc(100%-1.5rem)] flex-col gap-0 p-0 sm:max-w-3xl">
                <DialogHeader className="px-5 pt-6 pb-4 sm:px-6">
                    <DialogTitle>{t('management.room.detail_title')}</DialogTitle>
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
                            <div className="text-destructive rounded-md border p-4 text-sm">
                                {error}
                            </div>
                        ) : data ? (
                            <div className="space-y-6">
                                <section className="bg-muted/10 rounded-xl border">
                                    <div className="flex flex-col gap-4 p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="text-lg font-bold tracking-tight">
                                                    <span className="font-mono">
                                                        {data.number}
                                                    </span>
                                                    {data.name ? (
                                                        <span className="text-muted-foreground ml-2 text-base font-medium">
                                                            — {data.name}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={goEdit}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />{' '}
                                                {t('common.edit')}
                                            </Button>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-4">
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {t('common.status')}
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
                                                        {t(
                                                            `room.status.${String(data.status || '').toLowerCase()}`,
                                                            { defaultValue: data.status },
                                                        )}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {t('room.max_occupancy')}
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.max_occupancy}
                                                </div>
                                            </div>
                                            {/* Periode Tagih dihapus dari detail kamar (dikendalikan di kontrak) */}
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {t('common.price')}
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.price_monthly_rupiah ??
                                                        '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {t('management.room.building')}
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.building?.name ?? '-'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {t('management.room.floor')}
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.floor?.level ?? '-'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {t('management.room.type')}
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {data.type?.name ?? '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-muted/10 rounded-xl border">
                                    <div className="flex flex-col gap-4 p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold">
                                                {t('common.photos')}
                                            </div>
                                        </div>
                                        <div>
                                            <AspectRatio
                                                ratio={4 / 3}
                                                className="bg-background/80 overflow-hidden rounded-lg border"
                                            >
                                                {currentPhoto ? (
                                                    <img
                                                        src={currentPhoto.url}
                                                        alt={`${t('common.room')} ${data.number}`}
                                                        className="h-full w-full cursor-zoom-in object-cover"
                                                        title={t('common.click_to_preview')}
                                                        onClick={() => {
                                                            setPreviewOpen(
                                                                true,
                                                            );
                                                            setPreviewIdx(
                                                                current,
                                                            );
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                                                        <div className="flex items-center gap-2">
                                                            <ImageIcon className="h-5 w-5" />{' '}
                                                            {t('management.room.no_photos')}
                                                        </div>
                                                    </div>
                                                )}
                                                {photoCount > 1 ? (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="secondary"
                                                            className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/70"
                                                            onClick={prev}
                                                            title={t('datatable.prev')}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="secondary"
                                                            className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/70"
                                                            onClick={next}
                                                            title={t('datatable.next')}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                        <div className="pointer-events-none absolute right-0 bottom-2 left-0 mx-auto flex w-fit items-center gap-1 rounded bg-black/40 px-2 py-0.5">
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
                                                        className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border ${i === current ? 'ring-primary ring-2' : ''}`}
                                                        onClick={() =>
                                                            selectThumb(i)
                                                        }
                                                        
                                                    >
                                                        <img
                                                            src={p.url}
                                                            alt={`${t('common.photo')} ${i + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        {p.is_cover ? (
                                                            <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                                                                {t('management.room.form.photos.cover')}
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                </section>

                                <section className="bg-muted/10 rounded-xl border">
                                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                                        <div>
                                            <div className="text-sm font-semibold">
                                                {t('common.amenities')}
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                                                {amenities.length ? (
                                                    amenities.map((a) => (
                                                        <div
                                                            key={a.id}
                                                            className="bg-background rounded border px-2 py-1"
                                                        >
                                                            {a.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted-foreground">
                                                        {t('common.no_amenities')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold">
                                                {t('management.room.notes')}
                                            </div>
                                            <div className="bg-background text-muted-foreground mt-2 rounded border p-3 text-sm">
                                                {data.notes ?? '-'}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="text-muted-foreground rounded-md border p-6 text-center text-sm">
                                {t('management.room.no_data')}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="bg-background/95 border-t px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={closeDialog}
                    >
                        {t('common.close')}
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
