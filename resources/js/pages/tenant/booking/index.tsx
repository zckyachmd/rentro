import { Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    CalendarRange,
    CheckCircle2,
    CircleSlash,
    Eye,
    FileSignature,
    Hash,
    HelpCircle,
    Plus,
    Timer,
    XCircle,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
import { formatDate, formatIDR } from '@/lib/format';
import BookingGuideDialog from '@/pages/tenant/booking/dialogs/guide-dialog';
import type { PageProps } from '@/types';

type BookingItem = {
    id: string;
    number: string;
    status: string;
    start_date: string;
    duration: number;
    period: string;
    promo_code?: string | null;
    contract_id?: string | null;
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
    const { t } = useTranslation('tenant/booking');
    const { t: tEnum } = useTranslation('enum');
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

    const formatPeriod = (p?: string | null) => {
        const key = String(p || '').toLowerCase();
        return (
            tEnum(`billing_period.${key}`, {
                defaultValue:
                    key === 'weekly'
                        ? 'Weekly'
                        : key === 'daily'
                          ? 'Daily'
                          : 'Monthly',
            }) || '—'
        );
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const key = String(status || '').toLowerCase();
        if (key === 'requested') {
            return (
                <Badge className="inline-flex items-center gap-1 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20">
                    <CalendarCheck className="h-3 w-3" />
                    {tEnum('booking.status.requested', {
                        defaultValue: 'Requested',
                    })}
                </Badge>
            );
        }
        if (key === 'approved') {
            return (
                <Badge className="inline-flex items-center gap-1 bg-green-500/15 text-green-700 hover:bg-green-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    {tEnum('booking.status.approved', {
                        defaultValue: 'Approved',
                    })}
                </Badge>
            );
        }
        if (key === 'rejected') {
            return (
                <Badge className="inline-flex items-center gap-1 bg-red-500/15 text-red-700 hover:bg-red-500/20">
                    <XCircle className="h-3 w-3" />
                    {tEnum('booking.status.rejected', {
                        defaultValue: 'Rejected',
                    })}
                </Badge>
            );
        }
        if (key === 'cancelled') {
            return (
                <Badge className="inline-flex items-center gap-1 bg-zinc-500/15 text-zinc-700 hover:bg-zinc-500/20">
                    <CircleSlash className="h-3 w-3" />
                    {tEnum('booking.status.cancelled', {
                        defaultValue: 'Cancelled',
                    })}
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
            pageTitle={t('page_title', 'Bookings')}
            pageDescription={t('page_desc', 'Your booking list.')}
            actions={
                <div className="flex items-center gap-2">
                    <Can all={['tenant.booking.create']}>
                        <Button asChild size="sm">
                            <Link href={route('tenant.rooms.index')}>
                                <Plus className="mr-1 h-4 w-4" />
                                {t('new', 'New Booking')}
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
                        {t('guide', 'Booking Guide')}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        {t('title', 'My Bookings')}
                    </CardTitle>
                </div>
                {/* Summary (compact) */}
                <div className="text-muted-foreground text-xs">
                    {[
                        {
                            key: 'requested',
                            label: tEnum('booking.status.requested', {
                                defaultValue: 'Requested',
                            }),
                            icon: <CalendarCheck className="h-4 w-4" />,
                            tone: 'bg-yellow-500/15 text-yellow-700',
                            value: counts.requested,
                        },
                        {
                            key: 'approved',
                            label: tEnum('booking.status.approved', {
                                defaultValue: 'Approved',
                            }),
                            icon: <CheckCircle2 className="h-4 w-4" />,
                            tone: 'bg-green-500/15 text-green-700',
                            value: counts.approved,
                        },
                        {
                            key: 'rejected',
                            label: tEnum('booking.status.rejected', {
                                defaultValue: 'Rejected',
                            }),
                            icon: <XCircle className="h-4 w-4" />,
                            tone: 'bg-red-500/15 text-red-700',
                            value: counts.rejected,
                        },
                        {
                            key: 'cancelled',
                            label: tEnum('booking.status.cancelled', {
                                defaultValue: 'Cancelled',
                            }),
                            icon: <CircleSlash className="h-4 w-4" />,
                            tone: 'bg-zinc-500/15 text-zinc-700',
                            value: counts.cancelled,
                        },
                    ]
                        .map((s) => `${s.label} ${s.value}`)
                        .join(' • ')}
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
                                            {t(
                                                'status_hint',
                                                'Your current booking status.',
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-0.5 text-sm">
                                    <div>
                                        {t('common.room', 'Room')}:
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
                                            {t('common.start')}
                                        </div>
                                        <div className="text-sm font-medium">
                                            {formatDate(b.start_date)}
                                        </div>
                                    </div>
                                    <div className="rounded-md border p-2 text-xs">
                                        <div className="text-muted-foreground inline-flex items-center gap-1">
                                            <Timer className="h-3.5 w-3.5" />{' '}
                                            {t('common.duration', 'Duration')}
                                        </div>
                                        <div className="text-sm font-medium">
                                            {b.duration}{' '}
                                            {t('common.monthly', 'Monthly')}
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-md border p-2 text-xs">
                                    <div className="text-muted-foreground inline-flex items-center gap-1">
                                        <CalendarRange className="h-3.5 w-3.5" />{' '}
                                        {t('common.period')}
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatPeriod(b.period)}
                                    </div>
                                </div>
                                <div className="rounded-md border p-2">
                                    <div className="text-muted-foreground text-xs">
                                        {t('common.total', 'Total')}
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {formatIDR(b.estimate?.total || 0)}
                                    </div>
                                </div>
                                <div className="pt-1">
                                    <div className="flex flex-wrap items-center gap-2">
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
                                                    {t('common.view_detail')}
                                                </Link>
                                            </Button>
                                        </Can>
                                        {String(
                                            b.status || '',
                                        ).toLowerCase() === 'approved' &&
                                        b.contract_id ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={route(
                                                        'tenant.contracts.show',
                                                        {
                                                            contract:
                                                                b.contract_id,
                                                        },
                                                    )}
                                                >
                                                    <FileSignature className="mr-1 h-4 w-4" />{' '}
                                                    {t(
                                                        'detail.view_contract',
                                                        'Lihat Kontrak',
                                                    )}
                                                </Link>
                                            </Button>
                                        ) : null}
                                    </div>
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
                                    {t(
                                        'empty_title',
                                        'Belum pernah melakukan booking',
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-1">
                                    {t(
                                        'empty_desc',
                                        'Mulai dengan mencari kamar yang cocok dan ikuti panduan booking.',
                                    )}
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <Can all={['tenant.rooms.view']}>
                                        <Button asChild size="sm">
                                            <Link
                                                href={route(
                                                    'tenant.rooms.index',
                                                )}
                                            >
                                                {t('browse', 'Browse Rooms')}
                                            </Link>
                                        </Button>
                                    </Can>
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
