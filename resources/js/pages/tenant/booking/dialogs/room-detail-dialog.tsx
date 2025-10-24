import {
    Building2,
    Layers,
    Ruler,
    ShieldCheck,
    Tag,
    Users,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import LazyIcon from '@/components/lazy-icon';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type RoomDetail = {
    id: string;
    number: string;
    name?: string | null;
    building?: string | null;
    type?: string | null;
    floor?: string | null;
    price_month: number;
    deposit: number;
    photo_url?: string | null;
    photo_urls?: string[];
    size_m2?: number | null;
    max_occupancy?: number | null;
    amenities?: Array<string | { name: string; icon?: string | null }>;
};

function formatIDR(n?: number | null) {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
        Number(n || 0),
    );
}

export default function RoomDetailDialog({
    open,
    onOpenChange,
    room,
    onBook,
    bookDisabled,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: RoomDetail | null;
    onBook?: (roomId: string) => void;
    bookDisabled?: boolean;
}) {
    const { t } = useTranslation();
    const [data, setData] = React.useState<RoomDetail | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const title = React.useMemo(() => {
        if (!data) return 'Detail Kamar';
        const postfix = data.name ? ` • ${data.name}` : '';
        return `Kamar ${data.number}${postfix}`;
    }, [data]);

    const photos = data?.photo_urls?.length
        ? data.photo_urls
        : data?.photo_url
          ? [data.photo_url]
          : [];
    const [activeIdx, setActiveIdx] = React.useState<number>(0);
    React.useEffect(() => {
        setActiveIdx(0);
    }, [data?.id]);

    React.useEffect(() => {
        let abort = false;
        if (!open || !room?.id) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }
        (async () => {
            try {
                setLoading(true);
                setError(null);
                setData(null);
                const url = route('tenant.rooms.show', { room: room.id });
                const res = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const json = (await res.json()) as { room?: RoomDetail };
                if (!abort) {
                    if (json?.room) setData(json.room);
                    else throw new Error('Invalid payload');
                }
            } catch {
                if (!abort) setError('Gagal memuat detail kamar.');
            } finally {
                if (!abort) setLoading(false);
            }
        })();
        return () => {
            abort = true;
        };
    }, [open, room, room?.id]);

    const [amenExpanded, setAmenExpanded] = React.useState(false);
    const amenAll = (data?.amenities ?? []).map((a) =>
        typeof a === 'string' ? { name: a } : { name: a.name, icon: a.icon },
    );
    const amenities = amenExpanded ? amenAll : amenAll.slice(0, 8);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Lihat informasi kamar secara ringkas sebelum booking.
                    </DialogDescription>
                </DialogHeader>

                {!data && (
                    <div className="text-muted-foreground text-sm">
                        {loading ? 'Memuat detail kamar…' : error || ''}
                    </div>
                )}
                {data && photos.length > 0 ? (
                    <div className="space-y-2">
                        <div className="overflow-hidden rounded-md">
                            <AspectRatio ratio={16 / 9}>
                                <img
                                    src={
                                        photos[
                                            Math.min(
                                                activeIdx,
                                                photos.length - 1,
                                            )
                                        ]
                                    }
                                    alt={title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                                {photos.length > 1 ? (
                                    <>
                                        <button
                                            type="button"
                                            className="bg-background/70 absolute top-1/2 left-2 -translate-y-1/2 rounded-full px-2 py-1 text-sm shadow"
                                            onClick={() =>
                                                setActiveIdx(
                                                    (i) =>
                                                        (i -
                                                            1 +
                                                            photos.length) %
                                                        photos.length,
                                                )
                                            }
                                            aria-label="Sebelumnya"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            type="button"
                                            className="bg-background/70 absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-2 py-1 text-sm shadow"
                                            onClick={() =>
                                                setActiveIdx(
                                                    (i) =>
                                                        (i + 1) % photos.length,
                                                )
                                            }
                                            aria-label="Berikutnya"
                                        >
                                            ›
                                        </button>
                                    </>
                                ) : null}
                            </AspectRatio>
                        </div>
                        {photos.length > 1 ? (
                            <div className="flex gap-2 overflow-x-auto">
                                {photos.map((p, idx) => (
                                    <button
                                        key={`${p}-${idx}`}
                                        type="button"
                                        onClick={() => setActiveIdx(idx)}
                                        className={[
                                            'relative h-16 w-24 shrink-0 overflow-hidden rounded-md border',
                                            activeIdx === idx
                                                ? 'ring-primary ring-2'
                                                : 'hover:opacity-90',
                                        ].join(' ')}
                                        aria-label={`Foto ${idx + 1}`}
                                    >
                                        <img
                                            src={p}
                                            alt={`Foto ${idx + 1}`}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {data && (
                    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {data?.building ? (
                                    <Badge
                                        variant="secondary"
                                        className="inline-flex items-center gap-1"
                                    >
                                        <Building2 className="h-3.5 w-3.5" />{' '}
                                        {data.building}
                                    </Badge>
                                ) : null}
                                {data?.type ? (
                                    <Badge
                                        variant="outline"
                                        className="inline-flex items-center gap-1"
                                    >
                                        <Tag className="h-3.5 w-3.5" />{' '}
                                        {data.type}
                                    </Badge>
                                ) : null}
                                {data?.floor ? (
                                    <Badge
                                        variant="outline"
                                        className="inline-flex items-center gap-1"
                                    >
                                        <Layers className="h-3.5 w-3.5" />{' '}
                                        {data.floor}
                                    </Badge>
                                ) : null}
                                {data?.size_m2 ? (
                                    <Badge
                                        variant="outline"
                                        className="inline-flex items-center gap-1"
                                    >
                                        <Ruler className="h-3.5 w-3.5" />{' '}
                                        {data.size_m2} m²
                                    </Badge>
                                ) : null}
                                {data?.max_occupancy ? (
                                    <Badge
                                        variant="outline"
                                        className="inline-flex items-center gap-1"
                                    >
                                        <Users className="h-3.5 w-3.5" /> Maks{' '}
                                        {data.max_occupancy}
                                    </Badge>
                                ) : null}
                            </div>

                            {amenities.length > 0 ? (
                                <div>
                                    <div className="text-sm font-medium">
                                        {t('common.amenities')}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        {amenities.map((a, idx) => (
                                            <Badge
                                                key={`${a.name}-${idx}`}
                                                variant="outline"
                                                className="inline-flex items-center gap-1 text-xs"
                                            >
                                                {a.icon ? (
                                                    <LazyIcon
                                                        name={a.icon}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                ) : null}
                                                {a.name}
                                            </Badge>
                                        ))}
                                        {amenAll.length > 8 ? (
                                            <button
                                                type="button"
                                                className="text-primary ml-1 text-xs hover:underline"
                                                onClick={() =>
                                                    setAmenExpanded((v) => !v)
                                                }
                                            >
                                                {amenExpanded
                                                    ? t('datatable.hide_all')
                                                    : t('datatable.show_all')}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-2 rounded-md border p-3">
                            <div className="text-sm">Harga/bulan</div>
                            <div className="text-2xl leading-6 font-semibold">
                                Rp {formatIDR(data?.price_month)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                                Belum termasuk listrik/air (jika berlaku). Promo
                                akan diterapkan saat booking jika valid.
                            </div>
                            <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
                                <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                <div className="text-sm">
                                    Deposit:{' '}
                                    <span className="font-medium">
                                        Rp {formatIDR(data?.deposit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                    {data && onBook ? (
                        <Button
                            type="button"
                            onClick={() => onBook(data.id)}
                            disabled={!!bookDisabled || loading}
                        >
                            Booking
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
