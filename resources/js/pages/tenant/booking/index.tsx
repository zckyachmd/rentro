import { Link, usePage } from '@inertiajs/react';
import { CalendarCheck, Hash } from 'lucide-react';

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
    room?: { number?: string | null; name?: string | null; building?: string | null; type?: string | null } | null;
    estimate?: { total: number } | null;
};

type Paginator<T> = { data: T[] };

export default function TenantBookingsIndex() {
    const { bookings } = usePage<PageProps<any>>().props as unknown as {
        bookings: Paginator<BookingItem>;
    };
    const items = bookings?.data || [];

    return (
        <AppLayout pageTitle="Booking" pageDescription="Daftar booking Anda.">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">Booking Saya</CardTitle>
                    <Link href={route('tenant.rooms.index')} className="text-primary text-sm hover:underline">Browse Kamar</Link>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((b) => (
                        <Card key={b.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    <span className="inline-flex items-center gap-2"><Hash className="h-4 w-4" />{b.number}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm">Room: {b.room?.number || '-'}</div>
                                <div className="text-sm">Start: {b.start_date}</div>
                                <div className="text-sm">Durasi: {b.duration} bulan</div>
                                <div className="text-sm">Estimasi: Rp {new Intl.NumberFormat('id-ID').format(b.estimate?.total || 0)}</div>
                                <div className="mt-2">
                                    <Badge className="capitalize inline-flex items-center gap-1">
                                        <CalendarCheck className="h-3 w-3" />
                                        {b.status}
                                    </Badge>
                                </div>
                                <div className="mt-3">
                                    <Link href={route('tenant.bookings.show', { booking: b.id })} className="text-primary text-sm hover:underline">Lihat</Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

