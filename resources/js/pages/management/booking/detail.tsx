import { router, usePage } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts';
import { formatDate, formatIDR } from '@/lib/format';
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
    tenant?: { name?: string; email?: string } | null;
    room?: { number?: string | null; name?: string | null; building?: string | null; type?: string | null } | null;
    estimate?: { total: number; final_rent?: number; final_deposit?: number; duration?: number } | null;
    contract_id?: string | null;
};

export default function ManagementBookingDetail() {
    const { t } = useTranslation();
    const { t: tBooking } = useTranslation('management/booking');
    const { t: tEnum } = useTranslation('enum');
    const { booking } = usePage<PageProps<any>>().props as unknown as {
        booking: BookingDetail;
    };
    const [reason, setReason] = React.useState('');

    const approve = () => {
        router.post(
            route('management.bookings.approve', { booking: booking.id }),
            {},
            { preserveScroll: true },
        );
    };
    const reject = () => {
        router.post(
            route('management.bookings.reject', { booking: booking.id }),
            { reason },
            { preserveScroll: true },
        );
    };

    const statusKey = (booking.status || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    return (
        <AppLayout
            pageTitle={tBooking('title', {
                defaultValue: 'Booking',
            })}
            pageDescription={tBooking('desc')}
        >
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {tBooking('detail.title_format', {
                                number: booking.number,
                            })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1 text-sm">
                                <div>
                                    {t('common.number')}:&nbsp;
                                    <span className="font-mono">
                                        {booking.number}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>{t('common.status')}:</span>
                                    <Badge>
                                        {tEnum(`booking.status.${statusKey}`, {
                                            defaultValue: booking.status,
                                        })}
                                    </Badge>
                                </div>
                                <div>
                                    {t('common.tenant')}:&nbsp;
                                    {booking.tenant?.name || '—'}
                                </div>
                                <div>
                                    {t('common.room')}:&nbsp;
                                    {booking.room?.number || '—'}
                                </div>
                                <div>
                                    {t('common.start')}:&nbsp;
                                    {formatDate(booking.start_date)}
                                </div>
                                <div>
                                    {t('common.duration', {
                                        defaultValue: 'Duration',
                                    })}
                                    :&nbsp;
                                    {booking.duration} ×
                                    {tEnum(`billing_period.${booking.period}`)}
                                </div>
                                {booking.promo_code ? (
                                    <div>
                                        Promo:&nbsp;{booking.promo_code}
                                    </div>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm">
                                    {t('common.total')}:&nbsp;
                                    {formatIDR(booking.estimate?.total ?? 0)}
                                </div>
                                <div className="grid gap-2">
                                    <Button
                                        onClick={approve}
                                        disabled={booking.status !== 'requested'}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        {tBooking('detail.approve')}
                                    </Button>
                                    <div>
                                        <Textarea
                                            value={reason}
                                            onChange={(e) =>
                                                setReason(e.target.value)
                                            }
                                            placeholder={tBooking(
                                                'detail.reason_placeholder',
                                            )}
                                        />
                                        <div className="mt-2">
                                            <Button
                                                variant="outline"
                                                onClick={reject}
                                                disabled={
                                                    booking.status !==
                                                    'requested'
                                                }
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                {tBooking('detail.reject')}
                                            </Button>
                                        </div>
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
