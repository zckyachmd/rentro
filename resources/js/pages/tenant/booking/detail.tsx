import { usePage } from '@inertiajs/react';
import { CalendarCheck, Receipt } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/layouts';
import type { PageProps } from '@/types';

type BookingDetail = {
    id: string;
    number: string;
    status: string;
    start_date: string;
    duration: number;
    period: string;
    promo_code?: string | null;
    notes?: string | null;
    room?: {
        number?: string | null;
        name?: string | null;
        building?: string | null;
        type?: string | null;
    } | null;
    estimate?: {
        total: number;
        final_rent?: number;
        final_deposit?: number;
        duration?: number;
    } | null;
    contract_id?: string | null;
};

export default function TenantBookingDetail() {
    const { booking } = usePage<PageProps<any>>().props as unknown as {
        booking: BookingDetail;
    };

    return (
        <AppLayout
            pageTitle={`Booking ${booking.number}`}
            pageDescription="Detail booking."
        >
            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">
                            Ringkasan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="space-y-1 text-sm">
                                <div>No: {booking.number}</div>
                                <div>Room: {booking.room?.number || '-'}</div>
                                <div>Start: {booking.start_date}</div>
                                <div>Durasi: {booking.duration} bulan</div>
                                {booking.promo_code && (
                                    <div>Promo: {booking.promo_code}</div>
                                )}
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                    <Badge className="inline-flex items-center gap-1 capitalize">
                                        <CalendarCheck className="h-3 w-3" />
                                        {booking.status}
                                    </Badge>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <Receipt className="text-muted-foreground h-4 w-4" />
                                    <div>
                                        Total Estimasi: Rp{' '}
                                        {new Intl.NumberFormat('id-ID').format(
                                            booking.estimate?.total || 0,
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
