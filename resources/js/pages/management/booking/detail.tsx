import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarCheck, Check, Hash, User, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts';
import { formatDate, formatIDR } from '@/lib/format';
import type { PageProps } from '@/types';
import { CopyInline } from '@/components/ui/copy-inline';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
        deposits?: Partial<Record<'daily' | 'weekly' | 'monthly', number | null>>;
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
    const { booking } = usePage<PageProps<Record<string, unknown>>>().props as unknown as {
        booking: BookingDetail;
    };
    const [reason, setReason] = React.useState('');
    const [confirmApprove, setConfirmApprove] = React.useState(false);
    const [confirmReject, setConfirmReject] = React.useState(false);
    const [roomDialog, setRoomDialog] = React.useState(false);

    const decide = (mode: 'approve' | 'reject') => {
        const url =
            mode === 'approve'
                ? route('management.bookings.approve', { booking: booking.id })
                : route('management.bookings.reject', { booking: booking.id });
        const data =
            mode === 'approve'
                ? {}
                : { reason: reason.trim() === '' ? '-' : reason };
        router.post(url, data, { preserveScroll: true });
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

    function variantForBookingStatus(status: string): 'default' | 'secondary' | 'destructive' {
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
                            <span className="truncate font-mono">{booking.number}</span>
                            <CopyInline value={booking.number} variant="icon" size="sm" />
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant={variantForBookingStatus(booking.status)} className="capitalize">
                                {tEnum(`booking.status.${statusKey}`, {
                                    defaultValue: booking.status,
                                })}
                            </Badge>
                            {hasContract ? (
                                <Link
                                    href={route('management.contracts.show', {
                                        contract: booking.contract_id,
                                    })}
                                    className="text-primary text-xs hover:underline"
                                >
                                    {t('common.contract')}
                                </Link>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent>
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
                                                    <CopyInline value={booking.tenant.email} variant="link">
                                                        {booking.tenant.email}
                                                    </CopyInline>
                                                ) : null}
                                                {booking.tenant && (booking.tenant as { phone?: string | null })?.phone ? (
                                                    <CopyInline
                                                        value={(booking.tenant as { phone?: string }).phone || ''}
                                                        variant="link"
                                                    >
                                                        {(booking.tenant as { phone?: string }).phone}
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
                                                    {formatDate(booking.start_date)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-[11px]">
                                                    {t('common.duration', { defaultValue: 'Duration' })}
                                                </div>
                                                <div className="font-medium">
                                                    {booking.duration} × {tEnum(`billing_period.${booking.period}`)}
                                                </div>
                                            </div>
                                            {booking.promo_code ? (
                                                <div>
                                                    <div className="text-muted-foreground text-[11px]">Promo</div>
                                                    <div className="font-medium">{booking.promo_code}</div>
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
                                                    onClick={() => setRoomDialog(true)}
                                                >
                                                {t('common.view_detail')}
                                                </Button>
                                                {booking.room?.id ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => {
                                                            const url = route('management.rooms.show', {
                                                                room: booking.room!.id!,
                                                            });
                                                            if (typeof window !== 'undefined')
                                                                window.open(url, '_blank');
                                                        }}
                                                    >
                                                        {tBooking('detail.open_room')}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                        {booking.room?.name ? (
                                            <div className="text-muted-foreground">{booking.room.name}</div>
                                        ) : null}
                                        {(booking.room?.building || booking.room?.type) && (
                                            <div className="text-muted-foreground mt-1 text-xs">
                                                {[booking.room?.building, booking.room?.type]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </div>
                                        )}
                                    </div>

                                    {booking.notes && statusKey !== 'rejected' ? (
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">
                                                {t('common.notes')}
                                            </div>
                                            <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
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
                                        {tBooking('detail.summary', { defaultValue: 'Summary' })}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{t('common.total')}</span>
                                        <span className="font-semibold">
                                            {formatIDR(booking.estimate?.total ?? 0)}
                                        </span>
                                    </div>
                                    <div className="mt-2 space-y-1 text-xs">
                                        <div className="flex items-center justify-between rounded bg-muted/30 px-2 py-1">
                                            <span>{t('common.rent')}</span>
                                            <span className="font-medium">
                                                {formatIDR(booking.estimate?.final_rent ?? 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded bg-muted/30 px-2 py-1">
                                            <span>{t('common.deposit')}</span>
                                            <span className="font-medium">
                                                {formatIDR(booking.estimate?.final_deposit ?? 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded bg-muted/30 px-2 py-1">
                                            <span>{t('common.duration', { defaultValue: 'Duration' })}</span>
                                            <span className="font-medium">
                                                {booking.estimate?.duration ?? booking.duration} × {tEnum(`billing_period.${booking.period}`)}
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
                                                    onChange={(e) => setReason(e.target.value)}
                                                    placeholder={tBooking('detail.reason_placeholder')}
                                                />
                                                <div className="flex items-center gap-2">
                                            <Button onClick={() => setConfirmApprove(true)}>
                                                <Check className="mr-2 h-4 w-4" />
                                                {tBooking('detail.approve')}
                                            </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setConfirmReject(true)}
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        {tBooking('detail.reject')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {statusKey === 'rejected' && (
                                                <div className="mt-4">
                                                    <div className="text-muted-foreground mb-1 text-xs">Reject Reason</div>
                                                    <div className="rounded-md bg-muted/30 p-2 text-xs">
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
                                    {t('common.promo_code')}: {booking.estimate.promo.coupon_code || t('common.none')}
                                </div>
                                {Array.isArray(booking.estimate.promo.applied) && booking.estimate.promo.applied.length > 0 ? (
                                    <div className="rounded-md border p-2">
                                        <div className="text-muted-foreground mb-1 text-xs">
                                            {t('common.promotions_applied')}
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            {booking.estimate.promo.applied.map((p) => (
                                                <div key={p.id} className="flex items-center justify-between gap-3">
                                                    <span className="truncate">{p.name}</span>
                                                    <span className="text-muted-foreground">
                                                        {t('common.discount_rent')}: {formatIDR(p.discount_rent)} · {t('common.discount_deposit')}: {formatIDR(p.discount_deposit)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Back button */}
                <div>
                    <Link href={route('management.bookings.index')} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
                    </Link>
                </div>

                {/* Confirm Dialogs */}
                {canDecide && (
                <Dialog open={confirmApprove} onOpenChange={setConfirmApprove}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{tBooking('detail.approve')}</DialogTitle>
                            <DialogDescription>
                                {t('common.confirm', { defaultValue: 'Confirm this action?' })}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="rounded-md bg-muted/30 p-2 text-xs">
                            <div className="font-medium">#{booking.number}</div>
                            <div>
                                {t('common.tenant')}: {booking.tenant?.name || '—'}
                            </div>
                            <div>
                                {t('common.room')}: {booking.room?.number || '—'}
                            </div>
                            <div>
                                {t('common.start')}: {formatDate(booking.start_date)}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmApprove(false)}>
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
                <Dialog open={confirmReject} onOpenChange={setConfirmReject}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{tBooking('detail.reject')}</DialogTitle>
                            <DialogDescription>
                                {t('common.confirm', { defaultValue: 'Confirm this action?' })}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <div className="rounded-md bg-muted/30 p-2 text-xs">
                                <div className="font-medium">#{booking.number}</div>
                                <div>
                                    {t('common.tenant')}: {booking.tenant?.name || '—'}
                                </div>
                                <div>
                                    {t('common.room')}: {booking.room?.number || '—'}
                                </div>
                                <div>
                                    {t('common.start')}: {formatDate(booking.start_date)}
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {t('common.note_required_hint', { defaultValue: '(required when rejecting)' })}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmReject(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
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

                {/* Room Detail Dialog */}
                <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('common.room')}</DialogTitle>
                            <DialogDescription>
                                {t('common.view_detail')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-muted-foreground text-xs">{t('common.number')}</span>
                                <div className="font-medium">{booking.room?.number || '—'}</div>
                            </div>
                            {booking.room?.name ? (
                                <div>
                                    <span className="text-muted-foreground text-xs">Name</span>
                                    <div className="font-medium">{booking.room.name}</div>
                                </div>
                            ) : null}
                            {(booking.room?.building || booking.room?.floor || booking.room?.type) && (
                                <div>
                                    <span className="text-muted-foreground text-xs">{tBooking('detail.location')}</span>
                                    <div className="font-medium">
                                        {[booking.room?.building, booking.room?.floor, booking.room?.type]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                </div>
                            )}
                            {booking.room?.size_m2 ? (
                                <div>
                                    <span className="text-muted-foreground text-xs">{tBooking('detail.size')}</span>
                                    <div className="font-medium">{booking.room.size_m2} m²</div>
                                </div>
                            ) : null}
                            {booking.room?.max_occupancy ? (
                                <div>
                                    <span className="text-muted-foreground text-xs">{tBooking('detail.max_occupancy')}</span>
                                    <div className="font-medium">{booking.room.max_occupancy}</div>
                                </div>
                            ) : null}
                            {booking.room?.status ? (
                                <div>
                                    <span className="text-muted-foreground text-xs">Status</span>
                                    <div className="font-medium">
                                        {tEnum(`room.status.${String(booking.room.status).toLowerCase()}`)}
                                    </div>
                                </div>
                            ) : null}
                            {booking.room?.gender_policy ? (
                                <div>
                                    <span className="text-muted-foreground text-xs">{t('management/room:gender_policy', { defaultValue: 'Gender Policy' })}</span>
                                    <div className="font-medium">
                                        {tEnum(`gender_policy.${String(booking.room.gender_policy).toLowerCase()}`)}
                                    </div>
                                </div>
                            ) : null}
                            {Array.isArray(booking.room?.amenities) && booking.room!.amenities!.length > 0 ? (
                                <div>
                                    <span className="text-muted-foreground text-xs">{t('common.amenities')}</span>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {booking.room!.amenities!.map((a) => (
                                            <Badge key={a.id} variant="secondary" className="text-[10px]">
                                                {a.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {Array.isArray(booking.room?.photos) && booking.room!.photos!.length > 0 ? (
                                <div>
                                    <span className="text-muted-foreground text-xs">{tBooking('detail.photos')}</span>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                        {booking.room!.photos!.slice(0, 6).map((p) => (
                                            <img
                                                key={p.id}
                                                src={p.url}
                                                alt="Room photo"
                                                className="h-20 w-full rounded object-cover"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {booking.room?.prices || booking.room?.deposits ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-muted-foreground text-xs">{tBooking('detail.prices')}</div>
                                        <div className="mt-1 space-y-0.5 text-xs">
                                            {(['daily', 'weekly', 'monthly'] as const).map((k) => (
                                                <div key={k} className="flex items-center justify-between">
                                                    <span className="capitalize">{tEnum(`billing_period.${k}`)}</span>
                                                    <span className="font-medium">{formatIDR((booking.room?.prices?.[k] ?? 0) as number)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs">{tBooking('detail.deposits')}</div>
                                        <div className="mt-1 space-y-0.5 text-xs">
                                            {(['daily', 'weekly', 'monthly'] as const).map((k) => (
                                                <div key={k} className="flex items-center justify-between">
                                                    <span className="capitalize">{tEnum(`billing_period.${k}`)}</span>
                                                    <span className="font-medium">{formatIDR((booking.room?.deposits?.[k] ?? 0) as number)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            {booking.room?.notes ? (
                                <div>
                                    <span className="text-muted-foreground text-xs">{t('common.notes')}</span>
                                    <div className="whitespace-pre-wrap rounded-md bg-muted/30 p-2 text-xs">
                                        {booking.room.notes}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRoomDialog(false)}>
                                {t('common.close')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
