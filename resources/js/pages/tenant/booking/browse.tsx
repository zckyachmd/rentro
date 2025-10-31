import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    Building2,
    CalendarCheck,
    Eye,
    HelpCircle,
    Info,
    ShieldCheck,
    Tag,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Can } from '@/components/acl';
import { DatePickerInput } from '@/components/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// no direct Dialog usage here — moved to ConfirmBookingDialog
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ensureXsrfToken } from '@/hooks/use-confirm-password';
import { AppLayout } from '@/layouts';
import ConfirmBookingDialog from '@/pages/tenant/booking/dialogs/confirm-dialog';
import BookingGuideDialog from '@/pages/tenant/booking/dialogs/guide-dialog';
import RoomDetailDialog from '@/pages/tenant/booking/dialogs/room-detail-dialog';
import type { PageProps } from '@/types';

type RoomItem = {
    id: string;
    number: string;
    name?: string | null;
    building?: string | null;
    type?: string | null;
    status: string;
    price_month: number;
    deposit: number;
    photo_url?: string | null;
    photo_urls?: string[];
    size_m2?: number | null;
    max_occupancy?: number | null;
    amenities?: string[];
};

type Paginator<T> = {
    data: T[];
};

export default function TenantRoomBrowse() {
    const { t } = useTranslation('tenant/booking');
    const { rooms, query, options } = usePage<
        PageProps<Record<string, unknown>>
    >().props as unknown as {
        rooms: Paginator<RoomItem>;
        query: { building?: string; type?: string };
        options: { buildings: string[]; types: string[] };
    };

    const SELECT_ALL = '__ALL__';
    const [building, setBuilding] = React.useState<string>(
        query?.building && String(query.building).length > 0
            ? String(query.building)
            : SELECT_ALL,
    );
    const [type, setType] = React.useState<string>(
        query?.type && String(query.type).length > 0
            ? String(query.type)
            : SELECT_ALL,
    );

    const [startDate, setStartDate] = React.useState<string>('');
    const [duration, setDuration] = React.useState<string>('6');
    const [promo, setPromo] = React.useState<string>('');

    const parsePromoPercent = React.useCallback((code: string): number => {
        const m = String(code || '')
            .trim()
            .match(/(\d{1,2})$/);
        const pct = m ? Number.parseInt(m[1]!, 10) : 0;
        return Number.isFinite(pct) ? Math.max(0, Math.min(50, pct)) : 0;
    }, []);

    React.useEffect(() => {
        if (!startDate) {
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
            setStartDate(local);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-select when there is only one option available
    React.useEffect(() => {
        try {
            if (
                building === SELECT_ALL &&
                Array.isArray(options?.buildings) &&
                options.buildings.length === 1
            ) {
                setBuilding(options.buildings[0] || '');
            }
            if (
                type === SELECT_ALL &&
                Array.isArray(options?.types) &&
                options.types.length === 1
            ) {
                setType(options.types[0] || '');
            }
        } catch {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options?.buildings, options?.types]);

    const applyFilter = () => {
        const params = new URLSearchParams();
        if (building && building !== SELECT_ALL)
            params.set('building', building);
        if (type && type !== SELECT_ALL) params.set('type', type);
        router.visit(
            `${route('tenant.rooms.index')}${params.toString() ? `?${params.toString()}` : ''}`,
        );
    };

    const resetFilter = () => {
        setBuilding(SELECT_ALL);
        setType(SELECT_ALL);
        router.visit(route('tenant.rooms.index'));
    };

    const [submittingId, setSubmittingId] = React.useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmRoom, setConfirmRoom] = React.useState<RoomItem | null>(null);
    const [notes, setNotes] = React.useState<string>('');
    const [guideOpen, setGuideOpen] = React.useState(false);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailRoom, setDetailRoom] = React.useState<RoomItem | null>(null);
    const planRef = React.useRef<HTMLDivElement | null>(null);
    const [planHighlight, setPlanHighlight] = React.useState(false);

    const focusPlan = React.useCallback(() => {
        try {
            planRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            setPlanHighlight(true);
            window.setTimeout(() => setPlanHighlight(false), 1600);
        } catch {
            // ignore
        }
    }, []);

    const book = async (roomId: string) => {
        if (!startDate || !duration) {
            toast.warning(
                t(
                    'errors.plan_incomplete',
                    'Lengkapi rencana sewa dulu (tanggal & durasi).',
                ),
            );
            return;
        }
        try {
            setSubmittingId(roomId);
            const token = await ensureXsrfToken();
            const meta = (() => {
                try {
                    const el = document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement | null;
                    return el?.content || '';
                } catch {
                    return '';
                }
            })();
            router.post(
                route('tenant.bookings.store'),
                {
                    // Send as string to avoid JS Number precision loss (snowflake IDs)
                    room_id: roomId,
                    start_date: startDate,
                    duration_count: Number(duration),
                    billing_period: 'monthly',
                    promo_code: promo || null,
                    notes: notes || null,
                },
                {
                    preserveScroll: true,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(token
                            ? { 'X-XSRF-TOKEN': token }
                            : meta
                              ? { 'X-CSRF-TOKEN': meta }
                              : {}),
                    },
                    onError: (errors) => {
                        const msg =
                            (errors && (errors as Record<string, string>)) ||
                            {};
                        const first =
                            msg.start_date ||
                            msg.duration_count ||
                            msg.room_id ||
                            msg.billing_period ||
                            msg.promo_code ||
                            msg.notes ||
                            t(
                                'errors.submit_failed',
                                'Gagal mengirim booking. Coba lagi.',
                            );
                        toast.error(first as string);
                    },
                    onFinish: () => {
                        setSubmittingId(null);
                        setConfirmOpen(false);
                        setConfirmRoom(null);
                        setNotes('');
                    },
                },
            );
        } catch {
            setSubmittingId(null);
            toast.error(
                t(
                    'errors.prepare_failed',
                    'Gagal mempersiapkan pengiriman. Periksa koneksi Anda.',
                ),
            );
        }
    };

    const formatIDR = (n?: number | null) =>
        new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 0,
        }).format(Number(n || 0));

    const items = React.useMemo(() => rooms?.data ?? [], [rooms?.data]);
    const hasPlan = startDate !== '' && Number(duration) > 0;
    const [page, setPage] = React.useState(1);
    const perPage = 9;
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    React.useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);
    const paged = React.useMemo(
        () => items.slice((page - 1) * perPage, page * perPage),
        [items, page],
    );

    return (
        <AppLayout
            pageTitle={t('browse_page_title', 'Browse Kamar')}
            pageDescription={t(
                'browse_page_desc',
                'Pilih kamar tersedia, atur rencana sewa, dan booking.',
            )}
            actions={
                <div className="flex items-center gap-2">
                    <Can all={['tenant.booking.view']}>
                        <Button asChild size="sm">
                            <Link href={route('tenant.bookings.index')}>
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                {t('back_to_bookings', 'Kembali ke Booking')}
                            </Link>
                        </Button>
                    </Can>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setGuideOpen(true)}
                    >
                        <HelpCircle className="mr-1 h-4 w-4" />
                        {t('guide', 'Panduan Booking')}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base font-semibold">
                                {t('plan_header_title', 'Rencana & Estimasi')}
                            </CardTitle>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground mt-0.5"
                                        aria-label={t(
                                            'plan_info_aria',
                                            'Info rencana sewa',
                                        )}
                                    >
                                        <Info className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t(
                                        'plan_info_tooltip',
                                        'Rencana dipakai untuk menghitung estimasi dan mempermudah Booking cepat pada setiap kamar.',
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">
                                    {t('common.filter')}
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">
                                            {t('common.building')}
                                        </Label>
                                        <Select
                                            value={building}
                                            onValueChange={setBuilding}
                                        >
                                            <SelectTrigger className="h-9 w-full">
                                                <SelectValue
                                                    placeholder={t(
                                                        'filter.building_placeholder',
                                                        'Pilih gedung',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={SELECT_ALL}>
                                                    {t('common.all')}
                                                </SelectItem>
                                                {(options?.buildings ?? []).map(
                                                    (b) => (
                                                        <SelectItem
                                                            key={b}
                                                            value={b}
                                                        >
                                                            {b}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">
                                            {t('common.type')}
                                        </Label>
                                        <Select
                                            value={type}
                                            onValueChange={setType}
                                        >
                                            <SelectTrigger className="h-9 w-full">
                                                <SelectValue
                                                    placeholder={t(
                                                        'filter.type_placeholder',
                                                        'Pilih tipe',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={SELECT_ALL}>
                                                    {t('common.all')}
                                                </SelectItem>
                                                {(options?.types ?? []).map(
                                                    (t) => (
                                                        <SelectItem
                                                            key={t}
                                                            value={t}
                                                        >
                                                            {t}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2 sm:col-span-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={applyFilter}
                                        >
                                            {t('common.apply')}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={resetFilter}
                                            disabled={
                                                building === SELECT_ALL &&
                                                type === SELECT_ALL
                                            }
                                        >
                                            {t('common.reset')}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div
                                ref={planRef}
                                className={`space-y-2 lg:col-span-2 ${planHighlight ? 'ring-primary/40 -m-2 rounded-md p-2 ring-2 transition' : ''}`}
                            >
                                <div className="text-sm font-medium">
                                    {t('plan.title', 'Rencana & Promo')}
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">
                                            {t('common.start')}
                                        </Label>
                                        <DatePickerInput
                                            value={startDate}
                                            onChange={(v) =>
                                                setStartDate(v || '')
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">
                                            {t(
                                                'plan.duration_label',
                                                'Durasi (bulan)',
                                            )}
                                        </Label>
                                        <Select
                                            value={duration}
                                            onValueChange={setDuration}
                                        >
                                            <SelectTrigger className="h-9 w-full">
                                                <SelectValue
                                                    placeholder={t(
                                                        'plan.duration_placeholder',
                                                        'Durasi',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['1', '3', '6', '12'].map(
                                                    (d) => (
                                                        <SelectItem
                                                            key={d}
                                                            value={d}
                                                        >
                                                            {d}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">
                                            {`${t('common.promo_code')} (${t('common.optional')})`}
                                        </Label>
                                        <Input
                                            value={promo}
                                            onChange={(e) =>
                                                setPromo(e.target.value)
                                            }
                                            placeholder={t(
                                                'plan.promo_placeholder',
                                                'PROMO10',
                                            )}
                                        />
                                        <p className="text-muted-foreground mt-1 text-[11px]">
                                            {t(
                                                'plan.promo_note',
                                                'Jika diisi, promo yang valid akan diterapkan ke estimasi saat booking dibuat.',
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {items.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="py-8 text-center">
                                <div className="text-lg font-medium">
                                    {t(
                                        'empty_browse_title',
                                        'Tidak ada kamar yang cocok',
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-1">
                                    {t(
                                        'empty_browse_desc',
                                        'Coba ubah filter gedung/tipe untuk melihat pilihan lainnya.',
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {paged.map((r) => {
                                const promoPct = promo
                                    ? parsePromoPercent(promo)
                                    : 0;
                                const priceAfter = Math.max(
                                    0,
                                    (r.price_month || 0) -
                                        Math.round(
                                            (r.price_month || 0) *
                                                (promoPct / 100),
                                        ),
                                );
                                const est = hasPlan
                                    ? Number(duration) * (r.price_month || 0) +
                                      (r.deposit || 0)
                                    : null;
                                const estPromo = hasPlan
                                    ? Number(duration) * priceAfter +
                                      (r.deposit || 0)
                                    : null;
                                return (
                                    <Card key={r.id} className="flex flex-col">
                                        <CardHeader className="pb-1">
                                            <CardTitle className="text-base font-semibold">
                                                {r.number}
                                                {r.name ? (
                                                    <span className="text-muted-foreground">
                                                        {' '}
                                                        • {r.name}
                                                    </span>
                                                ) : null}
                                            </CardTitle>
                                            <div className="flex flex-wrap gap-2 pt-0 text-xs">
                                                {r.building ? (
                                                    <span className="text-muted-foreground inline-flex items-center gap-1">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        {r.building}
                                                    </span>
                                                ) : null}
                                                {r.type ? (
                                                    <span className="text-muted-foreground inline-flex items-center gap-1">
                                                        <Tag className="h-3.5 w-3.5" />
                                                        {r.type}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="mt-0 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                                    <Banknote className="text-muted-foreground h-4 w-4" />
                                                    <div>
                                                        <div className="text-muted-foreground flex items-center gap-1 text-[11px] leading-3">
                                                            <span>
                                                                {t(
                                                                    'room.price_month_label',
                                                                    'Harga/bulan',
                                                                )}
                                                            </span>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Info className="h-3 w-3" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {t(
                                                                        'room.price_hint',
                                                                        'Tarif sewa per bulan (sebelum promo).',
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                        <div className="font-medium">
                                                            {promoPct > 0 ? (
                                                                <>
                                                                    <div className="text-muted-foreground line-through">
                                                                        Rp{' '}
                                                                        {formatIDR(
                                                                            r.price_month,
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>
                                                                            Rp{' '}
                                                                            {formatIDR(
                                                                                priceAfter,
                                                                            )}
                                                                        </span>
                                                                        <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                                                                            {t(
                                                                                'room.promo_preview_badge',
                                                                                'Promo (perkiraan) −{{pct}}%',
                                                                                {
                                                                                    pct: promoPct,
                                                                                },
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Rp{' '}
                                                                    {formatIDR(
                                                                        r.price_month,
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                                    <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                                    <div>
                                                        <div className="text-muted-foreground flex items-center gap-1 text-[11px] leading-3">
                                                            <span>
                                                                {t(
                                                                    'common.deposit',
                                                                )}
                                                            </span>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Info className="h-3 w-3" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {t(
                                                                        'room.deposit_hint',
                                                                        'Jaminan dikembalikan saat akhir sewa sesuai ketentuan.',
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                        <div className="font-medium">
                                                            Rp{' '}
                                                            {formatIDR(
                                                                r.deposit,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {est != null && (
                                                <div className="mt-2 text-sm">
                                                    <div>
                                                        {t(
                                                            'room.estimate_total_for',
                                                            'Perkiraan total {{months}} bln:',
                                                            {
                                                                months: Number(
                                                                    duration,
                                                                ),
                                                            },
                                                        )}{' '}
                                                        <span className="font-semibold">
                                                            Rp {formatIDR(est)}
                                                        </span>
                                                    </div>
                                                    {promoPct > 0 && (
                                                        <div className="text-foreground mt-0.5 text-[13px]">
                                                            <span className="text-muted-foreground line-through">
                                                                Rp{' '}
                                                                {formatIDR(est)}
                                                            </span>{' '}
                                                            <span className="font-semibold">
                                                                Rp{' '}
                                                                {formatIDR(
                                                                    estPromo ||
                                                                        0,
                                                                )}
                                                            </span>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <span className="text-muted-foreground ml-1 cursor-help underline-offset-2 hover:underline">
                                                                        {t(
                                                                            'room.estimate_after_promo',
                                                                            'Perkiraan total setelah promo',
                                                                        )}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {t(
                                                                        'room.promo_preview_hint',
                                                                        'Perkiraan promo berdasarkan kode yang dimasukkan. Diskon aktual mengikuti syarat promo saat booking.',
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {est == null && (
                                                <div className="text-muted-foreground mt-2 text-xs">
                                                    {t(
                                                        'room.fill_plan_hint',
                                                        'Isi rencana sewa untuk melihat estimasi total.',
                                                    )}
                                                </div>
                                            )}
                                            <div className="mt-4">
                                                <Can
                                                    all={[
                                                        'tenant.booking.create',
                                                    ]}
                                                >
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!hasPlan) {
                                                                toast.warning(
                                                                    t(
                                                                        'errors.plan_incomplete',
                                                                        'Lengkapi rencana sewa dulu (tanggal & durasi).',
                                                                    ),
                                                                );
                                                                return;
                                                            }
                                                            setConfirmRoom(r);
                                                            setConfirmOpen(
                                                                true,
                                                            );
                                                        }}
                                                        disabled={
                                                            submittingId ===
                                                            r.id
                                                        }
                                                    >
                                                        <CalendarCheck className="mr-1 h-4 w-4" />{' '}
                                                        {t(
                                                            'book_action',
                                                            'Booking',
                                                        )}
                                                    </Button>
                                                </Can>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="ml-2"
                                                    onClick={() => {
                                                        setDetailRoom(r);
                                                        setDetailOpen(true);
                                                    }}
                                                >
                                                    <Eye className="mr-1 h-4 w-4" />{' '}
                                                    {t('common.view_detail')}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                        {totalPages > 1 && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setPage((p) =>
                                                    Math.max(1, p - 1),
                                                );
                                            }}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: totalPages }).map(
                                        (_, i) => (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={page === i + 1}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setPage(i + 1);
                                                    }}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ),
                                    )}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setPage((p) =>
                                                    Math.min(totalPages, p + 1),
                                                );
                                            }}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </>
                )}
            </div>

            {/* Konfirmasi Booking */}
            <ConfirmBookingDialog
                open={confirmOpen}
                onOpenChange={(o) => {
                    setConfirmOpen(o);
                    if (!o) setConfirmRoom(null);
                }}
                room={confirmRoom}
                startDate={startDate}
                duration={duration}
                promo={promo}
                notes={notes}
                onNotesChange={setNotes}
                onConfirm={() => confirmRoom && book(confirmRoom.id)}
                loading={submittingId === confirmRoom?.id}
                onOpenGuide={() => setGuideOpen(true)}
                onEditPlan={() => {
                    setConfirmOpen(false);
                    setConfirmRoom(null);
                    window.setTimeout(() => focusPlan(), 50);
                }}
            />

            {/* Panduan Booking */}
            <BookingGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />

            {/* Detail Kamar */}
            <RoomDetailDialog
                open={detailOpen}
                onOpenChange={(o) => {
                    setDetailOpen(o);
                    if (!o) setDetailRoom(null);
                }}
                room={detailRoom}
                promo={promo}
                onBook={(roomId) => {
                    // reuse existing flow
                    const target = items.find((it) => it.id === roomId);
                    if (!target) return;
                    if (!hasPlan) {
                        toast.warning(
                            t(
                                'errors.plan_incomplete',
                                'Lengkapi rencana sewa dulu (tanggal & durasi).',
                            ),
                        );
                        return;
                    }
                    setDetailOpen(false);
                    setConfirmRoom(target);
                    setConfirmOpen(true);
                }}
                bookDisabled={submittingId === detailRoom?.id}
            />
        </AppLayout>
    );
}
