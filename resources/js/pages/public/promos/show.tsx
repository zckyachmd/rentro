import { Link, usePage } from '@inertiajs/react';
import { BadgePercent, CalendarDays, TicketPercent } from 'lucide-react';
import * as React from 'react';

import Breadcrumbs from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyInline } from '@/components/ui/copy-inline';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PublicLayout } from '@/layouts';
import type { PageProps } from '@/types';

type PromotionDetail = {
    id: string;
    name: string;
    slug: string | null;
    description: string;
    valid_from: string | null;
    valid_until: string | null;
    require_coupon: boolean;
    tags: string[];
    coupons?: string[];
    tnc?: string[];
    how?: string[];
};

type PromoRoom = {
    id: string;
    name: string;
    number: string | null;
    building?: string | null;
    floor?: string | null;
    type?: string | null;
    original_price?: string | null;
    promo_price?: string | null;
    discount_percent?: number;
};

export default function PromoShowPage() {
    const page = usePage<
        PageProps & { promotion: PromotionDetail; rooms?: PromoRoom[] }
    >();
    const p = page.props.promotion;
    const rooms = page.props.rooms ?? [];
    const roomsScroll = React.useRef<HTMLDivElement | null>(null);

    const todayISO = React.useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate(),
        ).padStart(2, '0')}`;
    }, []);

    const status: 'active' | 'upcoming' | 'expired' = React.useMemo(() => {
        const from = p.valid_from || null;
        const until = p.valid_until || null;
        if (from && from > todayISO) return 'upcoming';
        if (until && until < todayISO) return 'expired';
        return 'active';
    }, [p.valid_from, p.valid_until, todayISO]);

    const guide = React.useMemo(
        () => ({ tnc: p.tnc ?? [], how: p.how ?? [] }),
        [p.tnc, p.how],
    );

    return (
        <PublicLayout title={p.name} description={p.description}>
            <div className="mb-4">
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: route('home') },
                        { label: 'Promo', href: route('public.promos') },
                        { label: p.name },
                    ]}
                />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {/* Main */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="inline-flex items-center gap-2">
                                    <span className="bg-primary/15 text-primary inline-flex h-9 w-9 items-center justify-center rounded-full">
                                        <BadgePercent className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <CardTitle className="text-base">
                                            {p.name}
                                        </CardTitle>
                                        {(p.valid_from || p.valid_until) && (
                                            <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                                                <CalendarDays className="h-4 w-4" />
                                                <span>
                                                    {p.valid_from ??
                                                        'Mulai tidak ditentukan'}{' '}
                                                    —{' '}
                                                    {p.valid_until ??
                                                        'Selesai tidak ditentukan'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Badge
                                    className="capitalize"
                                    variant={
                                        status === 'active'
                                            ? 'default'
                                            : status === 'upcoming'
                                              ? 'secondary'
                                              : 'destructive'
                                    }
                                >
                                    {status === 'active'
                                        ? 'Aktif'
                                        : status === 'upcoming'
                                          ? 'Mendatang'
                                          : 'Berakhir'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {p.tags?.length ? (
                                <div>
                                    <div className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
                                        Tag
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {p.tags.map((t, i) => (
                                            <Badge
                                                key={`tag-${i}`}
                                                variant="secondary"
                                                aria-label={`Tag ${t}`}
                                            >
                                                {t}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {p.description ? (
                                <div>
                                    <div className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
                                        Deskripsi
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                        {p.description}
                                    </p>
                                </div>
                            ) : null}

                            {guide.tnc.length ? (
                                <>
                                    <div className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
                                        Syarat & Ketentuan
                                    </div>
                                    <ul className="list-disc pl-5 text-sm leading-relaxed">
                                        {guide.tnc.map((it, idx) => (
                                            <li key={`tnc-${idx}`}>{it}</li>
                                        ))}
                                    </ul>
                                </>
                            ) : null}

                            {p.require_coupon ? (
                                <div className="space-y-2">
                                    <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                        Kupon
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                                        <TicketPercent className="h-4 w-4" />
                                        <span>
                                            Gunakan kupon saat checkout:
                                        </span>
                                    </div>
                                    {(p.coupons?.length ?? 0) > 0 ? (
                                        <div
                                            className="flex flex-wrap items-center gap-2"
                                            aria-live="polite"
                                        >
                                            {p.coupons!.map((code, i) => (
                                                <span
                                                    key={`cpn-${i}`}
                                                    className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm"
                                                >
                                                    <span className="font-mono tracking-wide">
                                                        {code}
                                                    </span>
                                                    <span
                                                        className="bg-border mx-1 h-3 w-px"
                                                        aria-hidden
                                                    />
                                                    <CopyInline
                                                        value={code}
                                                        variant="icon"
                                                        size="sm"
                                                        aria-label="Salin kupon"
                                                        title="Salin kupon"
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            Kupon tersedia terbatas atau
                                            diberikan secara personal.
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="d:col-span-1 space-y-4">
                    {guide.how.length > 0 ? (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    Cara Penggunaan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="list-decimal pl-5 text-sm leading-relaxed">
                                    {guide.how.map((it, idx) => (
                                        <li key={`how-${idx}`}>{it}</li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>

            {/* Kamar yang Cocok — Full width */}
            {rooms.length > 0 ? (
                <div className="mt-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Kamar yang Cocok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded border text-xs"
                                    onClick={() => {
                                        const el = roomsScroll.current;
                                        if (!el) return;
                                        el.scrollBy({
                                            left: -320,
                                            behavior: 'smooth',
                                        });
                                    }}
                                    aria-label="Scroll kiri"
                                    aria-controls="promo-rooms-scroller"
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded border text-xs"
                                    onClick={() => {
                                        const el = roomsScroll.current;
                                        if (!el) return;
                                        el.scrollBy({
                                            left: 320,
                                            behavior: 'smooth',
                                        });
                                    }}
                                    aria-label="Scroll kanan"
                                    aria-controls="promo-rooms-scroller"
                                >
                                    ›
                                </button>
                            </div>
                            <ScrollArea
                                viewportRef={roomsScroll}
                                className="pb-2"
                                showHorizontal
                            >
                                <div
                                    id="promo-rooms-scroller"
                                    className="flex snap-x snap-mandatory gap-4"
                                >
                                    {rooms.map((r, idx) => (
                                        <Link
                                            key={r.id}
                                            href={`${route('public.catalog')}?highlight=${r.id}`}
                                            role="group"
                                            aria-roledescription="slide"
                                            aria-posinset={idx + 1}
                                            aria-setsize={rooms.length}
                                            className="focus-visible:ring-primary/50 focus-visible:ring-offset-background min-w-[260px] snap-start rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:min-w-[280px]"
                                            aria-label={`${r.name}${r.promo_price ? ` — ${r.promo_price}/bulan` : r.original_price ? ` — ${r.original_price}/bulan` : ''}`}
                                        >
                                            <Card className="focus-visible:ring-primary/50 h-full transition hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none">
                                                <div className="relative h-40 w-full overflow-hidden rounded-b-none">
                                                    <div className="bg-muted absolute inset-0" />
                                                    <div className="bg-background/80 absolute top-2 left-2 max-w-[calc(100%-1rem)] rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur">
                                                        {r.promo_price ? (
                                                            <span className="flex items-baseline gap-2">
                                                                {r.original_price && (
                                                                    <span className="text-muted-foreground text-[10px] line-through">
                                                                        {
                                                                            r.original_price
                                                                        }
                                                                        /bulan
                                                                    </span>
                                                                )}
                                                                <span className="text-xs font-semibold">
                                                                    {
                                                                        r.promo_price
                                                                    }
                                                                    <span className="text-muted-foreground text-[10px]">
                                                                        /bulan
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="whitespace-nowrap">
                                                                {
                                                                    r.original_price
                                                                }
                                                                <span className="text-muted-foreground text-[10px]">
                                                                    /bulan
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(r.type ||
                                                        r.building ||
                                                        (r.discount_percent &&
                                                            r.discount_percent >
                                                                0)) && (
                                                        <div className="bg-background/80 absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur">
                                                            <span className="mr-1">
                                                                {[
                                                                    r.type,
                                                                    r.building,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(
                                                                        ' • ',
                                                                    )}
                                                            </span>
                                                            {r.discount_percent &&
                                                            r.discount_percent >
                                                                0 ? (
                                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                                    −
                                                                    {
                                                                        r.discount_percent
                                                                    }
                                                                    %
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                                <CardHeader className="space-y-1">
                                                    <CardTitle className="line-clamp-1 text-base">
                                                        {r.name}
                                                    </CardTitle>
                                                    <div className="text-muted-foreground line-clamp-1 text-[11px]">
                                                        {r.floor ?? ''}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div className="mt-3 flex flex-wrap gap-1">
                                                        {[r.type, r.building]
                                                            .filter(Boolean)
                                                            .map((x, i) => (
                                                                <Badge
                                                                    key={`${r.id}-chip-${i}`}
                                                                    variant="outline"
                                                                >
                                                                    {
                                                                        x as string
                                                                    }
                                                                </Badge>
                                                            ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </PublicLayout>
    );
}
