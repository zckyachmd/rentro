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
                tags?: string[] | null;
                q?: string | null;
                sort?: string | null;
            };
            all_tags?: string[];
            paginator?: {
                total: number;
                from: number | null;
                to: number | null;
                current_page: number;
                last_page: number;
                per_page: number;
            } | null;
        }
    >();
    const promotions = React.useMemo(
        () => page.props.promotions ?? [],
        [page.props.promotions],
    );
    const filters = page.props.filters ?? {};
    const [q, setQ] = React.useState<string>((filters.q as string) || '');
    const [isLoading, setIsLoading] = React.useState(false);

    const todayISO = React.useMemo(() => {
        try {
            // Deterministic date in Asia/Jakarta to avoid SSR/CSR mismatch
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(new Date());
        } catch {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
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

    const daysLeft = React.useCallback(
        (p: PromotionLite): number | null => {
            if (!p.valid_until) return null;
            const end = new Date(p.valid_until + 'T00:00:00');
            // Derive today from Asia/Jakarta normalized todayISO
            const [y, m, d] = todayISO.split('-').map((n) => Number(n));
            const d0 = new Date(y, m - 1, d);
            const d1 = new Date(
                end.getFullYear(),
                end.getMonth(),
                end.getDate(),
            );
            const diff = Math.ceil((d1.getTime() - d0.getTime()) / 86_400_000);
            return diff >= 0 ? diff : 0;
        },
        [todayISO],
    );

    // Use server-provided master tag list so it doesn't shrink when filtering promos
    const allTags = React.useMemo(() => {
        const fromServer = page.props.all_tags;
        if (Array.isArray(fromServer) && fromServer.length) {
            return [...fromServer].sort((a, b) => a.localeCompare(b));
        }
        // Fallback to derive from current promotions
        const s = new Set<string>();
        for (const p of promotions) for (const t of p.tags || []) s.add(t);
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [promotions, page.props]);

    // Multi-select tags synced with query
    const [selectedTags, setSelectedTags] = React.useState<string[]>(
        React.useMemo(() => {
            const arr = (filters.tags as string[] | undefined) || [];
            const single = (filters.tag as string | undefined) || undefined;
            return Array.from(
                new Set([...(arr || []), ...(single ? [single] : [])]),
            );
        }, [filters.tags, filters.tag]),
    );

    const changeFilter = (next: {
        status?: string | null;
        tags?: string[] | null;
        q?: string | null;
        sort?: string | null;
        page?: number | null;
        per_page?: number | null;
    }) => {
        const has = (k: keyof typeof next) =>
            Object.prototype.hasOwnProperty.call(next, k);
        const status = (
            has('status') ? next.status : (filters.status ?? null)
        ) as string | null;
        const tags = (has('tags') ? next.tags : (filters.tags ?? null)) as
            | string[]
            | null;
        const sort = (has('sort') ? next.sort : (filters.sort ?? null)) as
            | string
            | null;
        const qv = (has('q') ? next.q : (filters.q ?? null)) as string | null;
        const perPage = (has('per_page') ? next.per_page : null) as
            | number
            | null;
        const pageNum = (has('page') ? next.page : null) as number | null;

        const params: {
            status?: string;
            tags?: string[];
            sort?: string;
            q?: string;
            per_page?: number;
            page?: number;
        } = {};
        if (status) params.status = status;
        if (tags && tags.length) params.tags = tags;
        if (sort) params.sort = sort;
        if (qv) params.q = String(qv);
        if (perPage) params.per_page = perPage;
        if (pageNum) params.page = pageNum;

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
                        <Select
                            value={String(page.props.paginator?.per_page ?? 6)}
                            onValueChange={(v) =>
                                changeFilter({ per_page: Number(v), page: 1 })
                            }
                        >
                            <SelectTrigger className="w-full sm:w-[100px]">
                                <SelectValue placeholder="Per halaman" />
                            </SelectTrigger>
                            <SelectContent>
                                {([6, 9, 12, 24, 48] as const).map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                        {n} / page
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {filters.status ||
                        (Array.isArray(filters.tags) && filters.tags.length) ||
                        filters.tag ||
                        filters.q ||
                        filters.sort ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setQ('');
                                    setSelectedTags([]);
                                    changeFilter({
                                        status: null,
                                        tags: null,
                                        q: null,
                                        sort: null,
                                        per_page: 6,
                                        page: 1,
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
                                    const active = selectedTags.includes(t);
                                    return (
                                        <Button
                                            key={t}
                                            size="sm"
                                            variant={
                                                active ? 'default' : 'outline'
                                            }
                                            className="h-7"
                                            onClick={() => {
                                                const next = active
                                                    ? selectedTags.filter(
                                                          (x) => x !== t,
                                                      )
                                                    : [...selectedTags, t];
                                                setSelectedTags(next);
                                                changeFilter({
                                                    tags: next.length
                                                        ? next
                                                        : null,
                                                });
                                            }}
                                            aria-pressed={active}
                                        >
                                            {t}
                                        </Button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}

                {/* Selection chips hidden per request; keep multi-select active via tag buttons */}

                <Separator />
            </div>

            <div className="text-muted-foreground mb-2 text-xs">
                {isLoading ? (
                    'Memuat...'
                ) : page.props.paginator ? (
                    <>
                        Menampilkan {page.props.paginator.from ?? 0}–
                        {page.props.paginator.to ?? 0} dari{' '}
                        {page.props.paginator.total ?? 0}
                    </>
                ) : (
                    `${promotions.length} promo ditemukan`
                )}
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
                        const statusVariant:
                            | 'default'
                            | 'secondary'
                            | 'destructive'
                            | 'outline' =
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

            {/* Pagination controls */}
            {page.props.paginator && page.props.paginator.last_page > 1 && (
                <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="text-muted-foreground text-sm">
                        Menampilkan {page.props.paginator.from ?? 0}
                        {'–'}
                        {page.props.paginator.to ?? 0} dari{' '}
                        {page.props.paginator.total}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                changeFilter({
                                    page: Math.max(
                                        1,
                                        (page.props.paginator?.current_page ??
                                            1) - 1,
                                    ),
                                })
                            }
                            disabled={
                                (page.props.paginator?.current_page ?? 1) <= 1
                            }
                        >
                            Sebelumnya
                        </Button>
                        <div className="px-2 text-sm tabular-nums">
                            Hal {page.props.paginator?.current_page ?? 1} dari{' '}
                            {page.props.paginator?.last_page ?? 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                changeFilter({
                                    page: Math.min(
                                        page.props.paginator?.last_page ?? 1,
                                        (page.props.paginator?.current_page ??
                                            1) + 1,
                                    ),
                                })
                            }
                            disabled={
                                (page.props.paginator?.current_page ?? 1) >=
                                (page.props.paginator?.last_page ?? 1)
                            }
                        >
                            Berikutnya
                        </Button>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
