import { router, usePage } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { ensureXsrfToken } from '@/hooks/use-confirm-password';
import { AppLayout } from '@/layouts';
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
};

type Paginator<T> = {
    data: T[];
};

export default function TenantRoomBrowse() {
    const { rooms, query } = usePage<PageProps<any>>().props as unknown as {
        rooms: Paginator<RoomItem>;
        query: { building?: string; type?: string };
    };

    const [building, setBuilding] = React.useState<string>(
        query?.building || '',
    );
    const [type, setType] = React.useState<string>(query?.type || '');

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

    const applyFilter = () => {
        const params = new URLSearchParams();
        if (building) params.set('building', building);
        if (type) params.set('type', type);
        router.visit(
            `${route('tenant.rooms.index')}${params.toString() ? `?${params.toString()}` : ''}`,
        );
    };

    const resetFilter = () => {
        setBuilding('');
        setType('');
        router.visit(route('tenant.rooms.index'));
    };

    const [submittingId, setSubmittingId] = React.useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmRoom, setConfirmRoom] = React.useState<RoomItem | null>(null);
    const [notes, setNotes] = React.useState<string>('');

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
        >
            <div className="space-y-4">
                <Card>
                    <CardContent className="pt-6">
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
                                        <Input
                                            value={building}
                                            onChange={(e) =>
                                                setBuilding(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    applyFilter();
                                            }}
                                            placeholder="Mis. Gedung A"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">
                                            Tipe
                                        </Label>
                                        <Input
                                            value={type}
                                            onChange={(e) =>
                                                setType(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    applyFilter();
                                            }}
                                            placeholder="Mis. Standard"
                                        />
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
                                            disabled={!building && !type}
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
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) =>
                                                setStartDate(e.target.value)
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
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    Gunakan rencana ini untuk tombol Booking
                                    cepat pada setiap kamar.
                                </p>
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
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {r.building ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {r.building}
                                                </Badge>
                                            ) : null}
                                            {r.type ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {r.type}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="text-sm">
                                            Harga/bulan:{' '}
                                            <span className="font-medium">
                                                Rp {formatIDR(r.price_month)}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-sm">
                                            Deposit:{' '}
                                            <span className="font-medium">
                                                Rp {formatIDR(r.deposit)}
                                            </span>
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
        </AppLayout>
    );
}
