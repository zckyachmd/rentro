import { Link, usePage } from '@inertiajs/react';
import { CalendarCheck, CheckCircle2, Hash, XCircle, CircleSlash } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/layouts';
import type { PageProps } from '@/types';

type BookingItem = {
    id: string;
    number: string;
    status: string;
    start_date: string;
    duration: number;
    period: string;
    promo_code?: string | null;
    room?: {
        number?: string | null;
        name?: string | null;
        building?: string | null;
        type?: string | null;
    } | null;
    estimate?: { total: number } | null;
};

type Paginator<T> = { data: T[] };

export default function TenantBookingsIndex() {
    const { bookings } = usePage<PageProps<any>>().props as unknown as {
        bookings: Paginator<BookingItem>;
    };
    const items = bookings?.data || [];

    const formatIDR = (n?: number | null) =>
        new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
            Number(n || 0),
        );

    const StatusBadge = ({ status }: { status: string }) => {
        const key = String(status || '').toLowerCase();
        if (key === 'requested') {
            return (
                <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 inline-flex items-center gap-1">
                    <CalendarCheck className="h-3 w-3" /> On Hold
                </Badge>
            );
        }
        if (key === 'approved') {
            return (
                <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Approved
                </Badge>
            );
        }
        if (key === 'rejected') {
            return (
                <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/20 inline-flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Rejected
                </Badge>
            );
        }
        if (key === 'cancelled') {
            return (
                <Badge className="bg-zinc-500/15 text-zinc-700 hover:bg-zinc-500/20 inline-flex items-center gap-1">
                    <CircleSlash className="h-3 w-3" /> Cancelled
                </Badge>
            );
        }
        return (
            <Badge className="inline-flex items-center gap-1 capitalize">
                <CalendarCheck className="h-3 w-3" /> {status}
            </Badge>
        );
    };

    return (
        <AppLayout pageTitle="Booking" pageDescription="Daftar booking Anda.">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        Booking Saya
                    </CardTitle>
                    <Link
                        href={route('tenant.rooms.index')}
                        className="text-primary text-sm hover:underline"
                    >
                        Browse Kamar
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((b) => (
                        <Card key={b.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center justify-between text-sm">
                                    <span className="inline-flex items-center gap-2">
                                        <Hash className="h-4 w-4" /> {b.number}
                                    </span>
                                    <StatusBadge status={b.status} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1.5">
                                <div className="text-sm">
                                    Kamar: <span className="font-medium">{b.room?.number || '-'}</span>
                                    {b.room?.name ? (
                                        <span className="text-muted-foreground"> • {b.room.name}</span>
                                    ) : null}
                                </div>
                                {(b.room?.building || b.room?.type) && (
                                    <div className="text-muted-foreground text-xs">
                                        {(b.room?.building || '-') + ' • ' + (b.room?.type || '-')}
                                    </div>
                                )}
                                <div className="text-sm pt-1">Mulai: <span className="font-medium">{b.start_date}</span></div>
                                <div className="text-sm">Durasi: <span className="font-medium">{b.duration} bulan</span></div>
                                <div className="text-sm">Estimasi: <span className="font-semibold">Rp {formatIDR(b.estimate?.total)}</span></div>
                                <div className="pt-2">
                                    <Link
                                        href={route('tenant.bookings.show', { booking: b.id })}
                                        className="text-primary text-sm hover:underline"
                                    >
                                        Lihat detail
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
