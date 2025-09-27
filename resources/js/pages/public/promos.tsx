import { Link, router, usePage } from '@inertiajs/react';
import {
    BadgePercent,
    CalendarDays,
    Search,
    TicketPercent,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PublicLayout } from '@/layouts';
import type { PageProps } from '@/types';

type PromotionLite = {
    id: string;
    name: string;
    slug: string | null;
    description: string;
    valid_from: string | null;
    valid_until: string | null;
    require_coupon: boolean;
    tags: string[];
    coupons?: string[];
};

export default function PromosPage() {
    const page = usePage<
        PageProps & {
            promotions: PromotionLite[];
            filters?: {
                status?: string | null;
                tag?: string | null;
                q?: string | null;
                sort?: string | null;
            };
        }
    >();
    const promotions = React.useMemo(() => page.props.promotions ?? [], [page.props.promotions]);
    const filters = page.props.filters ?? {};
    const [q, setQ] = React.useState<string>((filters.q as string) || '');
    const [isLoading, setIsLoading] = React.useState(false);

    const todayISO = React.useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const getStatus = React.useCallback(
        (p: PromotionLite): 'active' | 'upcoming' | 'expired' => {
            const t = todayISO;
            const from = p.valid_from || null;
            const until = p.valid_until || null;
            if (from && from > t) return 'upcoming';
            if (until && until < t) return 'expired';
            return 'active';
        },
        [todayISO],
    );

    const daysLeft = React.useCallback((p: PromotionLite): number | null => {
        if (!p.valid_until) return null;
        const end = new Date(p.valid_until + 'T00:00:00');
        const today = new Date();
        const d0 = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
        );
        const d1 = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const diff = Math.ceil((d1.getTime() - d0.getTime()) / 86_400_000);
        return diff >= 0 ? diff : 0;
    }, []);

    const allTags = React.useMemo(() => {
        const s = new Set<string>();
        for (const p of promotions) for (const t of p.tags || []) s.add(t);
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [promotions]);

    const changeFilter = (next: {
        status?: string | null;
        tag?: string | null;
        q?: string | null;
        sort?: string | null;
    }) => {
        const has = (k: keyof typeof next) =>
            Object.prototype.hasOwnProperty.call(next, k);
        const status = (
            has('status') ? next.status : (filters.status ?? null)
        ) as string | null;
        const tag = (has('tag') ? next.tag : (filters.tag ?? null)) as
            | string
            | null;
        const sort = (has('sort') ? next.sort : (filters.sort ?? null)) as
            | string
            | null;
        const qv = (has('q') ? next.q : (filters.q ?? null)) as string | null;

        const params: Record<string, string> = {};
        if (status) params.status = status;
        if (tag) params.tag = tag;
        if (sort) params.sort = sort;
        if (qv) params.q = String(qv);

        router.get(route('public.promos'), params, {
            preserveScroll: true,
            replace: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <PublicLayout
            title="Promo"
            description="Dapatkan penawaran menarik untuk penyewaan kamar."
        >
            {/* Filters */}
            <div className="mb-6 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Tabs
                        value={(filters.status as string) || 'active'}
                        onValueChange={(v) => changeFilter({ status: v })}
                    >
                        <ScrollArea className="w-full sm:w-auto" showHorizontal>
                            <TabsList className="min-w-max">
                                <TabsTrigger value="active">Aktif</TabsTrigger>
                                <TabsTrigger value="upcoming">
                                    Mendatang
                                </TabsTrigger>
                                <TabsTrigger value="expired">
                                    Berakhir
                                </TabsTrigger>
                            </TabsList>
                        </ScrollArea>
                    </Tabs>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                            <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') changeFilter({ q });
                                }}
                                placeholder="Cari promo..."
                                className="w-full pl-8 sm:w-[220px]"
                            />
                        </div>
                        <Select
                            value={(filters.sort as string) || 'priority'}
                            onValueChange={(v) =>
                                changeFilter({
                                    sort: v === 'priority' ? null : v,
                                })
                            }
                        >
                            <SelectTrigger className="w-full sm:w-[170px]">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="priority">
                                    Prioritas
                                </SelectItem>
                                <SelectItem value="ending">
                                    Segera berakhir
                                </SelectItem>
                                <SelectItem value="latest">Terbaru</SelectItem>
                            </SelectContent>
                        </Select>
                        {filters.status ||
                        filters.tag ||
                        filters.q ||
                        filters.sort ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setQ('');
                                    changeFilter({
                                        status: null,
                                        tag: null,
                                        q: null,
                                        sort: null,
                                    });
                                }}
                            >
                                Reset
                            </Button>
                        ) : null}
                    </div>
                </div>

                {allTags.length > 0 ? (
                    <div className="flex items-center gap-2 py-1">
                        <span className="text-muted-foreground mr-1 shrink-0 text-xs tracking-wide uppercase">
                            Tag:
                        </span>
                        <ScrollArea className="w-full" showHorizontal>
                            <div className="flex flex-nowrap gap-2">
                                {allTags.map((t) => {
                                    const active = filters.tag === t;
                                    return (
                                        <Button
                                            key={t}
                                            size="sm"
                                            variant={
                                                active ? 'default' : 'outline'
                                            }
                                            className="h-7"
                                            onClick={() =>
                                                changeFilter({
                                                    tag: active ? null : t,
                                                })
                                            }
                                        >
                                            {t}
                                        </Button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}

                <Separator />
            </div>

            <div className="text-muted-foreground mb-2 text-xs">
                {isLoading
                    ? 'Memuat...'
                    : `${promotions.length} promo ditemukan`}
            </div>
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={`sk-${i}`} className="rounded-lg border p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <Skeleton className="h-9 w-9 rounded-md" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-56" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-20 rounded" />
                            </div>
                            <div className="mt-4 space-y-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/5" />
                                <div className="flex gap-2 pt-1">
                                    <Skeleton className="h-5 w-12 rounded" />
                                    <Skeleton className="h-5 w-16 rounded" />
                                    <Skeleton className="h-5 w-10 rounded" />
                                </div>
                            </div>
                            <div className="mt-4 border-t pt-3">
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : promotions.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16">
                    <BadgePercent className="h-10 w-10 opacity-70" />
                    <div className="text-center">
                        <div className="text-base font-medium">
                            Belum ada promo
                        </div>
                        <div className="text-sm">
                            Silakan kembali lagi nanti.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {promotions.map((p) => {
                        const hasPeriod = p.valid_from || p.valid_until;
                        const st = getStatus(p);
                        const days = daysLeft(p);
                        const isAlmost =
                            st === 'active' && days !== null && days <= 3;
                        const statusLabel =
                            st === 'expired'
                                ? 'Berakhir'
                                : st === 'upcoming'
                                  ? 'Mendatang'
                                  : isAlmost
                                    ? 'Hampir berakhir'
                                    : 'Aktif';
                        const statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
                            st === 'expired'
                                ? 'destructive'
                                : isAlmost
                                  ? 'destructive'
                                  : st === 'upcoming'
                                    ? 'secondary'
                                    : 'default';
                        const clickable = !!p.slug;
                        const Wrapper: React.FC<React.PropsWithChildren> = ({
                            children,
                        }) =>
                            clickable ? (
                                <Link
                                    href={route('public.promos.show', p.slug!)}
                                    className="group focus-visible:ring-primary/40 block focus:outline-none focus-visible:ring-2"
                                    aria-label={`Lihat detail promo ${p.name}`}
                                    preserveScroll
                                >
                                    {children}
                                </Link>
                            ) : (
                                <div className="block">{children}</div>
                            );
                        return (
                            <Wrapper key={p.id}>
                                <Card
                                    className={`flex h-full flex-col rounded-lg border transition-all ${clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}`}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <span className="bg-primary/10 text-primary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                                                    <BadgePercent className="h-4 w-4" />
                                                </span>
                                                <div className="min-w-0">
                                                    <CardTitle className="line-clamp-1 text-base group-hover:underline">
                                                        {p.name}
                                                    </CardTitle>
                                                    {hasPeriod ? (
                                                        <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                                                            <CalendarDays className="h-4 w-4" />
                                                            <span className="line-clamp-1">
                                                                {p.valid_from ??
                                                                    'Mulai tidak ditentukan'}{' '}
                                                                —{' '}
                                                                {p.valid_until ??
                                                                    'Selesai tidak ditentukan'}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <Badge
                                                variant={statusVariant}
                                                className="shrink-0 capitalize"
                                            >
                                                {statusLabel}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-1 flex-col gap-2">
                                        {p.description ? (
                                            <p className="text-muted-foreground line-clamp-2 text-sm">
                                                {p.description}
                                            </p>
                                        ) : null}
                                        {p.tags?.length ? (
                                            <ScrollArea
                                                className="-mx-1"
                                                showHorizontal
                                            >
                                                <div
                                                    className="flex flex-nowrap gap-1.5 px-1 pt-0.5"
                                                    aria-label="Tags"
                                                >
                                                    {p.tags.map((t, i) => (
                                                        <Badge
                                                            key={`${p.id}-tag-${i}`}
                                                            variant="secondary"
                                                            aria-label={`Tag ${t}`}
                                                        >
                                                            {t}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        ) : null}
                                        {p.require_coupon ? (
                                            <div className="pt-0.5">
                                                <Badge
                                                    variant="outline"
                                                    className="inline-flex items-center gap-1 text-[11px]"
                                                >
                                                    <TicketPercent className="h-3.5 w-3.5" />
                                                    <span>Butuh kupon</span>
                                                </Badge>
                                            </div>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            </Wrapper>
                        );
                    })}
                </div>
            )}
        </PublicLayout>
    );
}
