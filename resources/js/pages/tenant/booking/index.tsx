import { Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    CalendarRange,
    CheckCircle2,
    CircleSlash,
    Eye,
    Hash,
    HelpCircle,
    Plus,
    Timer,
    XCircle,
} from 'lucide-react';
import React from 'react';

import { Can } from '@/components/acl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppLayout } from '@/layouts';
import BookingGuideDialog from '@/pages/tenant/booking/guide-dialog';
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
    const { bookings } = usePage<PageProps<Record<string, unknown>>>()
        .props as unknown as {
        bookings: Paginator<BookingItem>;
    };
    const items = React.useMemo(() => bookings?.data || [], [bookings?.data]);

    type CountKey = 'requested' | 'approved' | 'rejected' | 'cancelled';
    const counts = React.useMemo(() => {
        const agg: Record<CountKey, number> = {
            requested: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
        };
        for (const b of items) {
            const k = String(b.status || '').toLowerCase();
            if (
                (
                    [
                        'requested',
                        'approved',
                        'rejected',
                        'cancelled',
                    ] as CountKey[]
                ).includes(k as CountKey)
            ) {
                const key = k as CountKey;
                agg[key] = (agg[key] ?? 0) + 1;
            }
        }
        return agg;
    }, [items]);

    const formatIDR = (n?: number | null) =>
        new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
            Number(n || 0),
        );

    const formatPeriod = (p?: string | null) => {
        const key = String(p || '').toLowerCase();
        if (key === 'weekly') return 'Mingguan';
        if (key === 'daily') return 'Harian';
        return 'Bulanan';
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const key = String(status || '').toLowerCase();
        if (key === 'requested') {
            return (
                <Badge className="inline-flex items-center gap-1 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20">
                    <CalendarCheck className="h-3 w-3" /> On Hold
                </Badge>
            );
        }
        if (key === 'approved') {
            return (
                <Badge className="inline-flex items-center gap-1 bg-green-500/15 text-green-700 hover:bg-green-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Approved
                </Badge>
            );
        }
        if (key === 'rejected') {
            return (
                <Badge className="inline-flex items-center gap-1 bg-red-500/15 text-red-700 hover:bg-red-500/20">
                    <XCircle className="h-3 w-3" /> Rejected
                </Badge>
            );
        }
        if (key === 'cancelled') {
            return (
                <Badge className="inline-flex items-center gap-1 bg-zinc-500/15 text-zinc-700 hover:bg-zinc-500/20">
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

    const [guideOpen, setGuideOpen] = React.useState(false);

    return (
        <AppLayout
            pageTitle="Booking"
            pageDescription="Daftar booking Anda."
            actions={
                <div className="flex items-center gap-2">
                    <Button asChild size="sm">
                        <Link href={route('tenant.rooms.index')}>
                            <Plus className="mr-1 h-4 w-4" /> Booking Baru
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
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        Booking Saya
                    </CardTitle>
                </div>
                {/* Stat Summary */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center justify-between p-3">
                            <div className="space-y-0.5">
                                <div className="text-muted-foreground text-xs">
                                    On Hold
                                </div>
                                <div className="text-xl font-semibold">
                                    {counts.requested}
                                </div>
                            </div>
                            <div className="grid size-8 place-items-center rounded-md bg-yellow-500/15 text-yellow-700">
                                <CalendarCheck className="h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center justify-between p-3">
                            <div className="space-y-0.5">
                                <div className="text-muted-foreground text-xs">
                                    Approved
                                </div>
                                <div className="text-xl font-semibold">
                                    {counts.approved}
                                </div>
                            </div>
                            <div className="grid size-8 place-items-center rounded-md bg-green-500/15 text-green-700">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center justify-between p-3">
                            <div className="space-y-0.5">
                                <div className="text-muted-foreground text-xs">
                                    Rejected
                                </div>
                                <div className="text-xl font-semibold">
                                    {counts.rejected}
                                </div>
                            </div>
                            <div className="grid size-8 place-items-center rounded-md bg-red-500/15 text-red-700">
                                <XCircle className="h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center justify-between p-3">
                            <div className="space-y-0.5">
                                <div className="text-muted-foreground text-xs">
                                    Cancelled
                                </div>
                                <div className="text-xl font-semibold">
                                    {counts.cancelled}
                                </div>
                            </div>
                            <div className="grid size-8 place-items-center rounded-md bg-zinc-500/15 text-zinc-700">
                                <CircleSlash className="h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((b) => (
                        <Card key={b.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center justify-between text-sm">
                                    <span className="inline-flex items-center gap-2">
                                        <Hash className="h-4 w-4" /> {b.number}
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <StatusBadge
                                                    status={b.status}
                                                />
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Status booking Anda saat ini.
                                        </TooltipContent>
                                    </Tooltip>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-0.5 text-sm">
                                    <div>
                                        Kamar:{' '}
                                        <span className="font-medium">
                                            {b.room?.number || '-'}
                                        </span>
                                        {b.room?.name ? (
                                            <span className="text-muted-foreground">
                                                {' '}
                                                • {b.room.name}
                                            </span>
                                        ) : null}
                                        {b.promo_code ? (
                                            <span className="bg-primary/10 text-primary ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                                                Promo: {b.promo_code}
                                            </span>
                                        ) : null}
                                    </div>
                                    {(b.room?.building || b.room?.type) && (
                                        <div className="text-muted-foreground text-xs">
                                            {(b.room?.building || '-') +
                                                ' • ' +
                                                (b.room?.type || '-')}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-md border p-2 text-xs">
                                        <div className="text-muted-foreground inline-flex items-center gap-1">
                                            <CalendarCheck className="h-3.5 w-3.5" />{' '}
                                            Mulai
                                        </div>
                                        <div className="text-sm font-medium">
                                            {b.start_date}
                                        </div>
                                    </div>
                                    <div className="rounded-md border p-2 text-xs">
                                        <div className="text-muted-foreground inline-flex items-center gap-1">
                                            <Timer className="h-3.5 w-3.5" />{' '}
                                            Durasi
                                        </div>
                                        <div className="text-sm font-medium">
                                            {b.duration} bln
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-md border p-2 text-xs">
                                    <div className="text-muted-foreground inline-flex items-center gap-1">
                                        <CalendarRange className="h-3.5 w-3.5" />{' '}
                                        Periode
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatPeriod(b.period)}
                                    </div>
                                </div>
                                <div className="rounded-md border p-2">
                                    <div className="text-muted-foreground text-xs">
                                        Estimasi Total
                                    </div>
                                    <div className="text-lg font-semibold">
                                        Rp {formatIDR(b.estimate?.total)}
                                    </div>
                                </div>
                                <div className="pt-1">
                                    <Can all={['tenant.booking.view']}>
                                        <Button asChild size="sm">
                                            <Link
                                                href={route(
                                                    'tenant.bookings.show',
                                                    {
                                                        booking: b.id,
                                                    },
                                                )}
                                            >
                                                <Eye className="mr-1 h-4 w-4" />{' '}
                                                Detail
                                            </Link>
                                        </Button>
                                    </Can>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {items.length === 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="py-8 text-center">
                                <div className="text-lg font-medium">
                                    Belum pernah melakukan booking
                                </div>
                                <p className="text-muted-foreground mt-1">
                                    Mulai dengan mencari kamar yang cocok dan
                                    ikuti panduan booking.
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <Can all={['tenant.rooms.view']}>
                                        <Button asChild size="sm">
                                            <Link
                                                href={route(
                                                    'tenant.rooms.index',
                                                )}
                                            >
                                                Browse Kamar
                                            </Link>
                                        </Button>
                                    </Can>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setGuideOpen(true)}
                                    >
                                        Panduan
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            <BookingGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
        </AppLayout>
    );
}
