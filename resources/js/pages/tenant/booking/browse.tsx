import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    Building2,
    HelpCircle,
    Info,
    ShieldCheck,
    Tag,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { DatePickerInput } from '@/components/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import RoomDetailDialog from '@/pages/tenant/booking/dialogs/room-detail-dialog';
import BookingGuideDialog from '@/pages/tenant/booking/guide-dialog';
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

    const book = async (roomId: string) => {
        if (!startDate || !duration) {
            toast.warning('Lengkapi rencana sewa dulu (tanggal & durasi).');
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
                            'Gagal mengirim booking. Coba lagi.';
                        toast.error(first);
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
                'Gagal mempersiapkan pengiriman. Periksa koneksi Anda.',
            );
        }
    };

    const formatIDR = (n?: number | null) =>
        new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 0,
        }).format(Number(n || 0));

    const items = React.useMemo(() => rooms?.data ?? [], [rooms?.data]);
    const hasPlan = startDate !== '' && Number(duration) > 0;

    return (
        <AppLayout
            pageTitle="Browse Kamar"
            pageDescription="Pilih kamar tersedia, atur rencana sewa, dan booking."
            actions={
                <div className="flex items-center gap-2">
                    <Button asChild size="sm">
                        <Link href={route('tenant.bookings.index')}>
                            <ArrowLeft className="mr-1 h-4 w-4" /> Kembali ke
                            Booking
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGuideOpen(true)}
                    >
                        <HelpCircle className="mr-1 h-4 w-4" /> Panduan Booking
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <CardTitle className="text-base font-medium">
                                    Cari Kamar
                                </CardTitle>
                                <p className="text-muted-foreground text-sm">
                                    Gunakan filter dan rencana sewa untuk
                                    melihat estimasi biaya sebelum booking.
                                </p>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground mt-0.5"
                                        aria-label="Info rencana sewa"
                                    >
                                        <Info className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Rencana dipakai untuk menghitung estimasi
                                    dan mempermudah Booking cepat pada setiap
                                    kamar.
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">
                                    Filter
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">
                                            Gedung
                                        </Label>
                                        <Select
                                            value={building}
                                            onValueChange={setBuilding}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih gedung" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={SELECT_ALL}>
                                                    Semua
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
                                            Tipe
                                        </Label>
                                        <Select
                                            value={type}
                                            onValueChange={setType}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih tipe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={SELECT_ALL}>
                                                    Semua
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
                                            Terapkan
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
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 lg:col-span-2">
                                <div className="text-sm font-medium">
                                    Rencana Sewa
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">
                                            Tanggal Mulai
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
                                            Durasi (bulan)
                                        </Label>
                                        <Select
                                            value={duration}
                                            onValueChange={setDuration}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Durasi" />
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
                                            Kode Promo (opsional)
                                        </Label>
                                        <Input
                                            value={promo}
                                            onChange={(e) =>
                                                setPromo(e.target.value)
                                            }
                                            placeholder="PROMO10"
                                        />
                                        <p className="text-muted-foreground mt-1 text-[11px]">
                                            Jika diisi, promo yang valid akan
                                            diterapkan ke estimasi saat booking
                                            dibuat.
                                        </p>
                                    </div>
                                </div>
                                {null}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {items.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="py-8 text-center">
                                <div className="text-lg font-medium">
                                    Tidak ada kamar yang cocok
                                </div>
                                <p className="text-muted-foreground mt-1">
                                    Coba ubah filter gedung/tipe untuk melihat
                                    pilihan lainnya.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((r) => {
                            const est = hasPlan
                                ? Number(duration) * (r.price_month || 0) +
                                  (r.deposit || 0)
                                : null;
                            return (
                                <Card key={r.id} className="flex flex-col">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-semibold">
                                            {r.number}
                                            {r.name ? (
                                                <span className="text-muted-foreground">
                                                    {' '}
                                                    • {r.name}
                                                </span>
                                            ) : null}
                                        </CardTitle>
                                        <div className="flex flex-wrap gap-2 pt-1 text-xs">
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
                                        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                                <Banknote className="text-muted-foreground h-4 w-4" />
                                                <div>
                                                    <div className="text-muted-foreground flex items-center gap-1 text-[11px] leading-3">
                                                        <span>Harga/bulan</span>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Info className="h-3 w-3" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Tarif sewa per
                                                                bulan (sebelum
                                                                promo).
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <div className="font-medium">
                                                        Rp{' '}
                                                        {formatIDR(
                                                            r.price_month,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                                <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                                <div>
                                                    <div className="text-muted-foreground flex items-center gap-1 text-[11px] leading-3">
                                                        <span>Deposit</span>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Info className="h-3 w-3" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Jaminan
                                                                dikembalikan
                                                                saat akhir sewa
                                                                sesuai
                                                                ketentuan.
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <div className="font-medium">
                                                        Rp{' '}
                                                        {formatIDR(r.deposit)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {est != null ? (
                                            <div className="mt-2 text-sm">
                                                Perkiraan total {duration} bln:{' '}
                                                <span className="font-semibold">
                                                    Rp {formatIDR(est)}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground mt-2 text-xs">
                                                Isi rencana sewa untuk melihat
                                                estimasi total.
                                            </div>
                                        )}
                                        <div className="mt-4">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (!hasPlan) {
                                                        toast.warning(
                                                            'Lengkapi rencana sewa dulu (tanggal & durasi).',
                                                        );
                                                        return;
                                                    }
                                                    setConfirmRoom(r);
                                                    setConfirmOpen(true);
                                                }}
                                                disabled={submittingId === r.id}
                                            >
                                                Booking
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="ml-2"
                                                onClick={() => {
                                                    setDetailRoom(r);
                                                    setDetailOpen(true);
                                                }}
                                            >
                                                Detail
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Konfirmasi Booking */}
            <Dialog
                open={confirmOpen}
                onOpenChange={(o) =>
                    !o ? (setConfirmOpen(false), setConfirmRoom(null)) : null
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Booking</DialogTitle>
                        <DialogDescription>
                            Periksa kembali detail berikut sebelum melanjutkan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/60 text-muted-foreground mb-2 rounded-md p-2 text-xs">
                        Booking akan masuk status{' '}
                        <span className="font-medium">On Hold</span> untuk
                        diverifikasi. Lihat progress di menu{' '}
                        <span className="font-medium">Booking Saya</span> atau
                        baca
                        <button
                            type="button"
                            className="text-primary ml-1 underline-offset-2 hover:underline"
                            onClick={() => setGuideOpen(true)}
                        >
                            panduan
                        </button>
                        .
                    </div>
                    <div className="space-y-1 text-sm">
                        <div>
                            Kamar:{' '}
                            <span className="font-medium">
                                {confirmRoom?.number}
                                {confirmRoom?.name
                                    ? ` • ${confirmRoom.name}`
                                    : ''}
                            </span>
                        </div>
                        <div className="text-muted-foreground">
                            {(confirmRoom?.building || confirmRoom?.type) && (
                                <>
                                    {confirmRoom?.building || '-'} •{' '}
                                    {confirmRoom?.type || '-'}
                                </>
                            )}
                        </div>
                        <div className="pt-1">
                            Mulai:{' '}
                            <span className="font-medium">{startDate}</span>
                        </div>
                        <div>
                            Durasi:{' '}
                            <span className="font-medium">
                                {duration} bulan
                            </span>
                        </div>
                        <div className="pt-1">
                            Harga/bulan:{' '}
                            <span className="font-medium">
                                Rp {formatIDR(confirmRoom?.price_month)}
                            </span>
                        </div>
                        <div>
                            Deposit:{' '}
                            <span className="font-medium">
                                Rp {formatIDR(confirmRoom?.deposit)}
                            </span>
                        </div>
                        <div className="pt-1">
                            Perkiraan total:{' '}
                            <span className="font-semibold">
                                Rp{' '}
                                {formatIDR(
                                    (Number(duration) || 0) *
                                        (confirmRoom?.price_month || 0) +
                                        (confirmRoom?.deposit || 0),
                                )}
                            </span>
                        </div>
                        {promo ? (
                            <div>
                                Kode Promo:{' '}
                                <span className="font-medium">{promo}</span>
                            </div>
                        ) : null}
                        <div className="pt-2">
                            <Label className="text-muted-foreground text-xs">
                                Catatan (opsional)
                            </Label>
                            <textarea
                                rows={3}
                                className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-2 py-1 text-sm outline-none focus-visible:ring-2"
                                placeholder="Catatan untuk pengelola"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                maxLength={2000}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setConfirmOpen(false);
                                setConfirmRoom(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={() => confirmRoom && book(confirmRoom.id)}
                            disabled={submittingId === confirmRoom?.id}
                        >
                            Konfirmasi Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                onBook={(roomId) => {
                    // reuse existing flow
                    const target = items.find((it) => it.id === roomId);
                    if (!target) return;
                    if (!hasPlan) {
                        toast.warning(
                            'Lengkapi rencana sewa dulu (tanggal & durasi).',
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
