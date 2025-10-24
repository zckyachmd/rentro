import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarCheck,
    Check,
    FileText,
    Hash,
    Layers,
    Ruler,
    ShieldCheck,
    Tag,
    User,
    Users as UsersIcon,
    X,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import LazyIcon from '@/components/lazy-icon';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyInline } from '@/components/ui/copy-inline';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts';
import { formatDate, formatIDR } from '@/lib/format';
import type { PageProps } from '@/types';

type BookingDetail = {
    id: string;
    number: string;
    status: string;
    status_changed_at?: string | null;
    start_date: string;
    duration: number;
    period: string;
    promo_code?: string | null;
    notes?: string | null;
    tenant?: { name?: string; email?: string } | null;
    room?: {
        id?: string;
        number?: string | null;
        name?: string | null;
        building?: string | null;
        type?: string | null;
        floor?: string | null;
        size_m2?: string | null;
        status?: string | null;
        gender_policy?: string | null;
        max_occupancy?: number | null;
        photos?: import('@/types/management').RoomPhotoView[];
        amenities?: Array<{ id: number; name: string; icon?: string | null }>;
        prices?: Partial<Record<'daily' | 'weekly' | 'monthly', number | null>>;
        deposits?: Partial<
            Record<'daily' | 'weekly' | 'monthly', number | null>
        >;
        notes?: string | null;
    } | null;
    estimate?: {
        total: number;
        final_rent?: number;
        final_deposit?: number;
        duration?: number;
        promo?: {
            coupon_code?: string | null;
            applied?: Array<{
                id: number;
                name: string;
                discount_rent: number;
                discount_deposit: number;
                coupon_id?: number | null;
            }>;
        } | null;
    } | null;
    contract_id?: string | null;
};

export default function ManagementBookingDetail() {
    const { t } = useTranslation();
    const { t: tBooking } = useTranslation('management/booking');
    const { t: tEnum } = useTranslation('enum');
    const { booking } = usePage<PageProps<Record<string, unknown>>>()
        .props as unknown as {
        booking: BookingDetail;
    };
    const [reason, setReason] = React.useState('');
    const [confirmApprove, setConfirmApprove] = React.useState(false);
    const [confirmReject, setConfirmReject] = React.useState(false);
    const [roomDialog, setRoomDialog] = React.useState(false);

    // Room photos gallery state (align with tenant UI)
    const photoUrls = React.useMemo(() => {
        const ps = (booking.room?.photos || []).slice();
        ps.sort((a, b) => {
            const ac = a.is_cover ? 1 : 0;
            const bc = b.is_cover ? 1 : 0;
            if (ac !== bc) return bc - ac; // cover first
            const ao = a.ordering ?? 0;
            const bo = b.ordering ?? 0;
            return ao - bo;
        });
        return ps.map((p) => p.url);
    }, [booking.room?.photos]);
    const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);
    React.useEffect(() => {
        setActivePhotoIdx(0);
    }, [roomDialog, photoUrls.length]);

    const roomTitle = React.useMemo(() => {
        const num = booking.room?.number || '—';
        const nm = (booking.room?.name || '').trim();
        return nm
            ? tBooking('detail.room_title_with_name', { number: num, name: nm })
            : tBooking('detail.room_title_format', { number: num });
    }, [booking.room?.number, booking.room?.name, tBooking]);

    // Compute end date for better context
    const endDateStr = React.useMemo(() => {
        try {
            const start = booking.start_date
                ? new Date(`${booking.start_date}T00:00:00`)
                : null;
            const count = Number(booking.duration || 0);
            const period = String(booking.period || '').toLowerCase();
            if (!start || !count || !period) return null;
            const d = new Date(start);
            if (period === 'daily') d.setDate(d.getDate() + count);
            else if (period === 'weekly') d.setDate(d.getDate() + count * 7);
            else if (period === 'monthly') d.setMonth(d.getMonth() + count);
            else return null;
            return formatDate(d);
        } catch {
            return null;
        }
    }, [booking.start_date, booking.duration, booking.period]);

    const decide = (mode: 'approve' | 'reject') => {
        const url =
            mode === 'approve'
                ? route('management.bookings.approve', { booking: booking.id })
                : route('management.bookings.reject', { booking: booking.id });

        if (mode === 'approve') {
            router.post(url, {}, { preserveScroll: true });
            return;
        }

        const r = reason.trim();
        if (!r) {
            // Keep the dialog open and require input
            setConfirmReject(true);
            return;
        }

        router.post(url, { reason: r }, { preserveScroll: true });
    };

    const statusKey = (booking.status || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    const canDecide = (booking.status || '').toLowerCase() === 'requested';
    const hasContract = Boolean(booking.contract_id);

    const rejectReason = React.useMemo(() => {
        const raw = String(booking.notes || '').trim();
        if (!raw) return null;
        // Backward compatibility: older notes prefixed with "Reject reason:"
        const m = raw.match(/Reject\s+reason:\s*(.*)/i);
        if (m && m[1]) return m[1].trim();
        return raw; // store notes directly as reason (current behavior)
    }, [booking.notes]);

    function variantForBookingStatus(
        status: string,
    ): 'default' | 'secondary' | 'destructive' {
        const k = (status || '').trim().toLowerCase().replace(/\s+/g, '_');
        switch (k) {
            case 'approved':
                return 'default';
            case 'rejected':
            case 'cancelled':
                return 'destructive';
            case 'requested':
            default:
                return 'secondary';
        }
    }

    return (
        <AppLayout
            pageTitle={tBooking('title', {
                defaultValue: 'Booking',
            })}
            pageDescription={tBooking('desc')}
            titleIcon="CalendarDays"
        >
            <div className="space-y-6">
                {/* Header summary */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
                        <CardTitle className="flex min-w-0 items-center gap-2 text-base font-semibold">
                            <Hash className="h-4 w-4" />
                            <span className="truncate font-mono">
                                {booking.number}
                            </span>
                            <CopyInline
                                value={booking.number}
                                variant="icon"
                                size="sm"
                            />
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={variantForBookingStatus(
                                    booking.status,
                                )}
                                className="capitalize"
                            >
                                {tEnum(`booking.status.${statusKey}`, {
                                    defaultValue: booking.status,
                                })}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {booking.status_changed_at ? (
                            <div className="text-muted-foreground mb-2 text-xs">
                                {t('common.last_updated')}{' '}
                                {formatDate(booking.status_changed_at, true)}
                            </div>
                        ) : null}
                        <div className="grid gap-4 md:grid-cols-12">
                            {/* Left: Booking details */}
                            <div className="md:col-span-7">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-[20px_1fr] items-start gap-2 text-sm">
                                        <User className="text-muted-foreground mt-[2px] h-4 w-4" />
                                        <div>
                                            <div className="text-muted-foreground text-[11px]">
                                                {t('common.tenant')}
                                            </div>
                                            <div className="font-medium">
                                                {booking.tenant?.name || '—'}
                                            </div>
                                            <div className="mt-1 flex flex-col gap-1 text-xs">
                                                {booking.tenant?.email ? (
                                                    <CopyInline
                                                        value={
                                                            booking.tenant.email
                                                        }
                                                        variant="link"
                                                    >
                                                        {booking.tenant.email}
                                                    </CopyInline>
                                                ) : null}
                                                {booking.tenant &&
                                                (
                                                    booking.tenant as {
                                                        phone?: string | null;
                                                    }
                                                )?.phone ? (
                                                    <CopyInline
                                                        value={
                                                            (
                                                                booking.tenant as {
                                                                    phone?: string;
                                                                }
                                                            ).phone || ''
                                                        }
                                                        variant="link"
                                                    >
                                                        {
                                                            (
                                                                booking.tenant as {
                                                                    phone?: string;
                                                                }
                                                            ).phone
                                                        }
                                                    </CopyInline>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[20px_1fr] items-start gap-2 text-sm">
                                        <CalendarCheck className="text-muted-foreground mt-[2px] h-4 w-4" />
                                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            <div>
                                                <div className="text-muted-foreground text-[11px]">
                                                    {t('common.start')}
                                                </div>
                                                <div className="font-medium">
                                                    {formatDate(
                                                        booking.start_date,
                                                    )}
                                                </div>
                                            </div>
                                            {endDateStr ? (
                                                <div>
                                                    <div className="text-muted-foreground text-[11px]">
                                                        {t('common.end')}
                                                    </div>
                                                    <div className="font-medium">
                                                        {endDateStr}
                                                    </div>
                                                </div>
                                            ) : null}
                                            <div>
                                                <div className="text-muted-foreground text-[11px]">
                                                    {t('common.duration', {
                                                        defaultValue:
                                                            'Duration',
                                                    })}
                                                </div>
                                                <div className="font-medium">
                                                    {booking.duration} ×{' '}
                                                    {tEnum(
                                                        `billing_period.${booking.period}`,
                                                    )}
                                                </div>
                                            </div>
                                            {booking.promo_code ? (
                                                <div>
                                                    <div className="text-muted-foreground text-[11px]">
                                                        {t('common.promo_code')}
                                                    </div>
                                                    <div className="font-medium">
                                                        {booking.promo_code}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="rounded-md border p-3">
                                        <div className="text-muted-foreground mb-1 text-xs">
                                            {t('common.room')}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-sm">
                                            <span className="font-medium">
                                                {booking.room?.number || '—'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setRoomDialog(true)
                                                    }
                                                >
                                                    {t('common.view_detail')}
                                                </Button>
                                            </div>
                                        </div>

                                        {booking.room?.name ? (
                                            <div className="text-muted-foreground">
                                                {booking.room.name}
                                            </div>
                                        ) : null}
                                        {(booking.room?.building ||
                                            booking.room?.type) && (
                                            <div className="text-muted-foreground mt-1 text-xs">
                                                {[
                                                    booking.room?.building,
                                                    booking.room?.type,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </div>
                                        )}
                                    </div>

                                    {booking.notes &&
                                    statusKey !== 'rejected' ? (
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">
                                                {t('common.notes')}
                                            </div>
                                            <div className="bg-muted/30 rounded-md border p-3 text-sm whitespace-pre-wrap">
                                                {booking.notes}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Right: Decision panel */}
                            <div className="md:col-span-5">
                                <div className="rounded-md border p-3">
                                    <div className="text-muted-foreground mb-2 text-xs">
                                        {tBooking('detail.summary', {
                                            defaultValue: 'Summary',
                                        })}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{t('common.total')}</span>
                                        <span className="font-semibold">
                                            {formatIDR(
                                                booking.estimate?.total ?? 0,
                                            )}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-[11px]">
                                        {tBooking('detail.summary_caption')}
                                        {booking.estimate?.promo ? (
                                            <>
                                                {' '}
                                                ·{' '}
                                                {t('common.promotions_applied')}
                                            </>
                                        ) : null}
                                    </div>
                                    <div className="mt-2 space-y-1 text-xs">
                                        <div className="bg-muted/30 flex items-center justify-between rounded px-2 py-1">
                                            <span className="inline-flex items-center gap-1">
                                                <Tag className="text-muted-foreground h-3.5 w-3.5" />
                                                {t('common.rent')}
                                            </span>
                                            <span className="font-medium">
                                                {formatIDR(
                                                    booking.estimate
                                                        ?.final_rent ?? 0,
                                                )}
                                            </span>
                                        </div>
                                        <div className="bg-muted/30 flex items-center justify-between rounded px-2 py-1">
                                            <span className="inline-flex items-center gap-1">
                                                <ShieldCheck className="text-muted-foreground h-3.5 w-3.5" />
                                                {t('common.deposit')}
                                            </span>
                                            <span className="font-medium">
                                                {formatIDR(
                                                    booking.estimate
                                                        ?.final_deposit ?? 0,
                                                )}
                                            </span>
                                        </div>
                                        <div className="bg-muted/30 flex items-center justify-between rounded px-2 py-1">
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarCheck className="text-muted-foreground h-3.5 w-3.5" />
                                                {t('common.duration', {
                                                    defaultValue: 'Duration',
                                                })}
                                            </span>
                                            <span className="font-medium">
                                                {booking.estimate?.duration ??
                                                    booking.duration}{' '}
                                                ×{' '}
                                                {tEnum(
                                                    `billing_period.${booking.period}`,
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {canDecide ? (
                                        <>
                                            <div className="text-muted-foreground mt-4 mb-1 text-xs">
                                                {t('common.review')}
                                            </div>
                                            <div className="grid gap-2">
                                                <Textarea
                                                    value={reason}
                                                    onChange={(e) =>
                                                        setReason(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={tBooking(
                                                        'detail.reason_placeholder',
                                                    )}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() =>
                                                            setConfirmApprove(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        <Check className="mr-2 h-4 w-4" />
                                                        {tBooking(
                                                            'detail.approve',
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setConfirmReject(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        {tBooking(
                                                            'detail.reject',
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {statusKey === 'rejected' && (
                                                <div className="mt-4">
                                                    <div className="text-muted-foreground mb-1 text-xs">
                                                        Reject Reason
                                                    </div>
                                                    <div className="bg-muted/30 rounded-md p-2 text-xs">
                                                        {rejectReason || '-'}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Promotions applied */}
                        {booking.estimate?.promo ? (
                            <div className="mt-4 grid gap-2">
                                <div className="text-muted-foreground text-xs">
                                    {t('common.promo_code')}:{' '}
                                    {booking.estimate.promo.coupon_code ||
                                        t('common.none')}
                                </div>
                                {Array.isArray(
                                    booking.estimate.promo.applied,
                                ) &&
                                booking.estimate.promo.applied.length > 0 ? (
                                    <div className="rounded-md border p-2">
                                        <div className="text-muted-foreground mb-1 text-xs">
                                            {t('common.promotions_applied')}
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            {booking.estimate.promo.applied.map(
                                                (p) => (
                                                    <div
                                                        key={p.id}
                                                        className="flex items-center justify-between gap-3"
                                                    >
                                                        <span className="truncate">
                                                            {p.name}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {t(
                                                                'common.discount_rent',
                                                            )}
                                                            :{' '}
                                                            {formatIDR(
                                                                p.discount_rent,
                                                            )}{' '}
                                                            ·{' '}
                                                            {t(
                                                                'common.discount_deposit',
                                                            )}
                                                            :{' '}
                                                            {formatIDR(
                                                                p.discount_deposit,
                                                            )}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        {/* Card bottom actions */}
                        <div className="mt-4 flex items-center justify-between">
                            <Link
                                href={route('management.bookings.index')}
                                className="text-primary inline-flex items-center gap-2 text-sm hover:underline"
                            >
                                <ArrowLeft className="h-4 w-4" />{' '}
                                {t('common.back')}
                            </Link>
                            <div className="ml-auto">
                                {hasContract ? (
                                    <Link
                                        href={route(
                                            'management.contracts.show',
                                            {
                                                contract: booking.contract_id,
                                            },
                                        )}
                                        className="text-primary inline-flex items-center gap-2 text-sm hover:underline"
                                    >
                                        {tBooking('detail.open_contract')}{' '}
                                        <FileText className="h-4 w-4" />
                                    </Link>
                                ) : statusKey === 'approved' ? (
                                    <Link
                                        href={route(
                                            'management.contracts.create',
                                        )}
                                        className="text-primary inline-flex items-center gap-2 text-sm hover:underline"
                                    >
                                        {tBooking('detail.create_contract')}{' '}
                                        <FileText className="h-4 w-4" />
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer back link removed (moved into card) */}

                {/* Confirm Dialogs */}
                {canDecide && (
                    <Dialog
                        open={confirmApprove}
                        onOpenChange={setConfirmApprove}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {tBooking('detail.approve')}
                                </DialogTitle>
                                <DialogDescription>
                                    {t('common.confirm', {
                                        defaultValue: 'Confirm this action?',
                                    })}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="bg-muted/30 rounded-md p-2 text-xs">
                                <div className="font-medium">
                                    #{booking.number}
                                </div>
                                <div>
                                    {t('common.tenant')}:{' '}
                                    {booking.tenant?.name || '—'}
                                </div>
                                <div>
                                    {t('common.room')}:{' '}
                                    {booking.room?.number || '—'}
                                </div>
                                <div>
                                    {t('common.start')}:{' '}
                                    {formatDate(booking.start_date)}
                                </div>
                            </div>
                            {reason.trim() ? (
                                <div className="mt-2 space-y-1">
                                    <div className="text-muted-foreground text-xs">
                                        {t('common.reason')}
                                    </div>
                                    <div className="bg-muted/30 rounded-md p-2 text-xs whitespace-pre-wrap">
                                        {reason.trim()}
                                    </div>
                                </div>
                            ) : null}
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmApprove(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setConfirmApprove(false);
                                        decide('approve');
                                    }}
                                >
                                    {tBooking('detail.approve')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {canDecide && (
                    <Dialog
                        open={confirmReject}
                        onOpenChange={setConfirmReject}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {tBooking('detail.reject')}
                                </DialogTitle>
                                <DialogDescription>
                                    {t('common.confirm', {
                                        defaultValue: 'Confirm this action?',
                                    })}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <div className="bg-muted/30 rounded-md p-2 text-xs">
                                    <div className="font-medium">
                                        #{booking.number}
                                    </div>
                                    <div>
                                        {t('common.tenant')}:{' '}
                                        {booking.tenant?.name || '—'}
                                    </div>
                                    <div>
                                        {t('common.room')}:{' '}
                                        {booking.room?.number || '—'}
                                    </div>
                                    <div>
                                        {t('common.start')}:{' '}
                                        {formatDate(booking.start_date)}
                                    </div>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    {t('common.note_required_hint', {
                                        defaultValue:
                                            '(required when rejecting)',
                                    })}
                                </div>
                                {reason.trim() ? (
                                    <div className="mt-1 space-y-1">
                                        <div className="text-muted-foreground text-xs">
                                            {t('common.reason')}
                                        </div>
                                        <div className="bg-muted/30 rounded-md p-2 text-xs whitespace-pre-wrap">
                                            {reason.trim()}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmReject(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={reason.trim() === ''}
                                    aria-disabled={reason.trim() === ''}
                                    onClick={() => {
                                        if (reason.trim() === '') return;
                                        setConfirmReject(false);
                                        decide('reject');
                                    }}
                                >
                                    {tBooking('detail.reject')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Room Detail Dialog (aligned with tenant UI) */}
                <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{roomTitle}</DialogTitle>
                            <DialogDescription>
                                {tBooking('detail.room_dialog_desc')}
                            </DialogDescription>
                        </DialogHeader>

                        {photoUrls.length > 0 ? (
                            <div className="space-y-2">
                                <div className="overflow-hidden rounded-md">
                                    <AspectRatio ratio={16 / 9}>
                                        <img
                                            src={
                                                photoUrls[
                                                    Math.min(
                                                        activePhotoIdx,
                                                        photoUrls.length - 1,
                                                    )
                                                ]
                                            }
                                            alt={roomTitle}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                        {photoUrls.length > 1 ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="bg-background/70 absolute top-1/2 left-2 -translate-y-1/2 rounded-full px-2 py-1 text-sm shadow"
                                                    onClick={() =>
                                                        setActivePhotoIdx(
                                                            (i) =>
                                                                (i -
                                                                    1 +
                                                                    photoUrls.length) %
                                                                photoUrls.length,
                                                        )
                                                    }
                                                    aria-label={t(
                                                        'datatable.prev',
                                                    )}
                                                >
                                                    ‹
                                                </button>
                                                <button
                                                    type="button"
                                                    className="bg-background/70 absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-2 py-1 text-sm shadow"
                                                    onClick={() =>
                                                        setActivePhotoIdx(
                                                            (i) =>
                                                                (i + 1) %
                                                                photoUrls.length,
                                                        )
                                                    }
                                                    aria-label={t(
                                                        'datatable.next',
                                                    )}
                                                >
                                                    ›
                                                </button>
                                            </>
                                        ) : null}
                                    </AspectRatio>
                                </div>
                                {photoUrls.length > 1 ? (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {photoUrls.map((p, idx) => (
                                            <button
                                                key={`${p}-${idx}`}
                                                type="button"
                                                onClick={() =>
                                                    setActivePhotoIdx(idx)
                                                }
                                                className={[
                                                    'relative h-16 w-24 shrink-0 overflow-hidden rounded-md border',
                                                    activePhotoIdx === idx
                                                        ? 'ring-primary ring-2'
                                                        : 'hover:opacity-90',
                                                ].join(' ')}
                                                aria-label={`${t('common.photo')} ${idx + 1}`}
                                            >
                                                <img
                                                    src={p}
                                                    alt={`${t('common.photo')} ${idx + 1}`}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {booking.room?.building ? (
                                        <Badge
                                            variant="secondary"
                                            className="inline-flex items-center gap-1"
                                        >
                                            <Building2 className="h-3.5 w-3.5" />{' '}
                                            {booking.room.building}
                                        </Badge>
                                    ) : null}
                                    {booking.room?.floor ? (
                                        <Badge
                                            variant="outline"
                                            className="inline-flex items-center gap-1"
                                        >
                                            <Layers className="h-3.5 w-3.5" />{' '}
                                            {booking.room.floor}
                                        </Badge>
                                    ) : null}
                                    {booking.room?.type ? (
                                        <Badge
                                            variant="outline"
                                            className="inline-flex items-center gap-1"
                                        >
                                            <Tag className="h-3.5 w-3.5" />{' '}
                                            {booking.room.type}
                                        </Badge>
                                    ) : null}
                                    {booking.room?.size_m2 ? (
                                        <Badge
                                            variant="outline"
                                            className="inline-flex items-center gap-1"
                                        >
                                            <Ruler className="h-3.5 w-3.5" />{' '}
                                            {booking.room.size_m2} m²
                                        </Badge>
                                    ) : null}
                                    {booking.room?.max_occupancy ? (
                                        <Badge
                                            variant="outline"
                                            className="inline-flex items-center gap-1"
                                        >
                                            <UsersIcon className="h-3.5 w-3.5" />{' '}
                                            {t('common.max')}{' '}
                                            {booking.room.max_occupancy}
                                        </Badge>
                                    ) : null}
                                </div>

                                {Array.isArray(booking.room?.amenities) &&
                                booking.room!.amenities!.length > 0 ? (
                                    <div>
                                        <div className="text-sm font-medium">
                                            {t('common.amenities')}
                                        </div>
                                        <AmenitiesList
                                            items={booking.room!.amenities!}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            <div className="space-y-2 rounded-md border p-3">
                                <div className="text-sm">
                                    {tBooking('detail.price_month')}
                                </div>
                                <div className="text-2xl leading-6 font-semibold">
                                    {formatIDR(
                                        (booking.room?.prices?.monthly ??
                                            0) as number,
                                    )}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    {tBooking('detail.price_note')}
                                </div>
                                <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
                                    <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                    <div className="text-sm">
                                        {t('common.deposit')}:
                                        <span className="font-medium">
                                            {formatIDR(
                                                (booking.room?.deposits
                                                    ?.monthly ?? 0) as number,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setRoomDialog(false)}
                            >
                                {t('common.close')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

type AmenityItem = { name: string; icon?: string | null };
type AmenityInput = AmenityItem | string | null | undefined;
function isAmenityItem(v: unknown): v is AmenityItem {
    return (
        typeof v === 'object' &&
        v !== null &&
        'name' in (v as Record<string, unknown>) &&
        typeof (v as { name?: unknown }).name === 'string'
    );
}
function AmenitiesList({ items }: { items: AmenityInput[] }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = React.useState(false);
    const all: AmenityItem[] = (items || []).map((it) => {
        if (typeof it === 'string') return { name: it, icon: null };
        if (isAmenityItem(it)) return { name: it.name, icon: it.icon ?? null };
        // Fallback when shape is unknown
        return { name: String(it ?? ''), icon: null };
    });
    const shown = expanded ? all : all.slice(0, 8);
    return (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {shown.map((a, idx) => (
                <Badge
                    key={`${a.name}-${idx}`}
                    variant="outline"
                    className="inline-flex items-center gap-1 text-xs"
                >
                    {a.icon ? (
                        <LazyIcon name={a.icon} className="h-3.5 w-3.5" />
                    ) : null}
                    {a.name}
                </Badge>
            ))}
            {all.length > 8 ? (
                <button
                    type="button"
                    className="text-primary ml-1 text-xs hover:underline"
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded
                        ? t('datatable.hide_all')
                        : t('datatable.show_all')}
                </button>
            ) : null}
        </div>
    );
}
