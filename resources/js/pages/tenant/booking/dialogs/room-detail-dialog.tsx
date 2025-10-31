import {
    Building2,
    CalendarCheck,
    Layers,
    Ruler,
    ShieldCheck,
    Tag,
    Users,
    X,
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
    promo,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: RoomDetail | null;
    onBook?: (roomId: string) => void;
    bookDisabled?: boolean;
    promo?: string | null;
}) {
    const { t } = useTranslation();
    const { t: tTenant } = useTranslation('tenant/booking');
    const [data, setData] = React.useState<RoomDetail | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const title = React.useMemo(() => {
        if (!data)
            return t('common.room', 'Kamar') + ' ' + (room?.number || '');
        const postfix = data.name ? ` • ${data.name}` : '';
        return `${t('common.room', 'Kamar')} ${data.number}${postfix}`;
    }, [data, room?.number, t]);

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
                if (!abort)
                    setError(
                        tTenant(
                            'errors.fetch_room_failed',
                            'Gagal memuat detail kamar.',
                        ),
                    );
            } finally {
                if (!abort) setLoading(false);
            }
        })();
        return () => {
            abort = true;
        };
    }, [open, room, room?.id, tTenant]);

    const [amenExpanded, setAmenExpanded] = React.useState(false);
    const promoPct = React.useMemo(() => {
        const m = String(promo || '')
            .trim()
            .match(/(\d{1,2})$/);
        const pct = m ? Number.parseInt(m[1]!, 10) : 0;
        return Number.isFinite(pct) ? Math.max(0, Math.min(50, pct)) : 0;
    }, [promo]);
    const amenAll = (data?.amenities ?? []).map((a) =>
        typeof a === 'string' ? { name: a } : { name: a.name, icon: a.icon },
    );
    const amenities = amenExpanded ? amenAll : amenAll.slice(0, 8);

    // Prefer fetched data when valid (> 0), otherwise fall back to list item values
    const basePrice = React.useMemo(() => {
        const a = Number(data?.price_month ?? 0);
        const b = Number(room?.price_month ?? 0);
        return a > 0 ? a : b;
    }, [data?.price_month, room?.price_month]);
    const baseDeposit = React.useMemo(() => {
        const a = Number(data?.deposit ?? 0);
        const b = Number(room?.deposit ?? 0);
        return a > 0 ? a : b;
    }, [data?.deposit, room?.deposit]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl md:max-w-2xl">
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
                                            aria-label={t(
                                                'datatable.prev',
                                                'Sebelumnya',
                                            )}
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
                                            aria-label={t(
                                                'datatable.next',
                                                'Berikutnya',
                                            )}
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
                                        aria-label={`${t('attachment.image_alt', 'Lampiran')} ${idx + 1}`}
                                    >
                                        <img
                                            src={p}
                                            alt={`${t('attachment.image_alt', 'Lampiran')} ${idx + 1}`}
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
                    <div className="grid gap-4 md:grid-cols-[1fr_420px]">
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
                                        <Users className="h-3.5 w-3.5" />
                                        {t('room.max_occupancy')}:{' '}
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
                            <div className="text-sm">
                                {tTenant(
                                    'room.price_month_label',
                                    'Harga/bulan',
                                )}
                            </div>
                            <div className="text-2xl leading-6 font-semibold">
                                {promoPct > 0 ? (
                                    <>
                                        <div className="text-muted-foreground text-base line-through">
                                            Rp {formatIDR(basePrice)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>
                                                Rp{' '}
                                                {formatIDR(
                                                    Math.max(
                                                        0,
                                                        basePrice -
                                                            Math.round(
                                                                basePrice *
                                                                    (promoPct /
                                                                        100),
                                                            ),
                                                    ),
                                                )}
                                            </span>
                                            <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                                                {tTenant(
                                                    'room.promo_preview_badge',
                                                    'Promo (perkiraan) −{{pct}}%',
                                                    { pct: promoPct },
                                                )}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>Rp {formatIDR(basePrice)}</>
                                )}
                            </div>
                            {promo ? (
                                <div className="text-xs">
                                    <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 font-medium">
                                        {t('common.promo_code')}: {promo}
                                    </span>
                                </div>
                            ) : null}
                            <div className="text-muted-foreground text-xs">
                                {t(
                                    'management/booking:price_note',
                                    'Belum termasuk listrik/air (jika berlaku). Promo akan diterapkan saat booking jika valid.',
                                )}
                            </div>
                            <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
                                <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                <div className="text-sm">
                                    {t('common.deposit')}:{' '}
                                    <span className="font-medium">
                                        Rp {formatIDR(baseDeposit)}
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
                        <X className="mr-1 h-4 w-4" /> {t('common.close')}
                    </Button>
                    {data && onBook ? (
                        <Button
                            type="button"
                            onClick={() => onBook(data.id)}
                            disabled={!!bookDisabled || loading}
                        >
                            <CalendarCheck className="mr-1 h-4 w-4" />{' '}
                            {tTenant('book_action', 'Booking')}
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
