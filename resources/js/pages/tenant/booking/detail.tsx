import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    Building2,
    CalendarCheck,
    CalendarRange,
    CheckCircle2,
    CircleSlash,
    FileSignature,
    Hash,
    HelpCircle,
    LifeBuoy,
    Receipt,
    ShieldCheck,
    Tag,
    Timer,
    XCircle,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppLayout } from '@/layouts';
import { formatDate } from '@/lib/format';
import BookingGuideDialog from '@/pages/tenant/booking/dialogs/guide-dialog';
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

export default function TenantBookingDetail() {
    const { t } = useTranslation('tenant/booking');
    const { t: tCommon } = useTranslation('common');
    const { t: tEnum } = useTranslation('enum');
    const { booking } = usePage<PageProps<Record<string, unknown>>>()
        .props as unknown as {
        booking: BookingDetail;
    };

    const [guideOpen, setGuideOpen] = React.useState(false);
    const [mobileStepOpen, setMobileStepOpen] = React.useState(false);
    const contactUrl = React.useMemo(() => {
        try {
            return route('public.contact');
        } catch {
            return '/contact';
        }
    }, []);

    const status = String(booking.status || '').toLowerCase();
    const hasContract = Boolean(booking.contract_id);
    const rejected = status === 'rejected';
    const cancelled = status === 'cancelled';
    const approved = status === 'approved';

    // Promo (perkiraan) badge percent — matches Browse/Confirm logic
    const promoPct = React.useMemo(() => {
        const m = String(booking.promo_code || '')
            .trim()
            .match(/(\d{1,2})$/);
        const pct = m ? parseInt(m[1]!, 10) : 0;
        return Number.isFinite(pct) ? Math.max(0, Math.min(50, pct)) : 0;
    }, [booking.promo_code]);

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

    return (
        <AppLayout
            pageTitle={t('detail.title', {
                number: booking.number,
                defaultValue: `Booking ${booking.number}`,
            })}
            pageDescription={t('detail.desc', 'Detail booking.')}
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
                {/* Progress */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">
                            Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const steps = [
                                {
                                    key: 'requested',
                                    title: 'Permohonan',
                                    desc: 'Menunggu verifikasi pengelola',
                                    icon: <CalendarCheck className="h-4 w-4" />,
                                },
                                {
                                    key: 'approved',
                                    title: rejected ? 'Ditolak' : 'Disetujui',
                                    desc: rejected
                                        ? 'Silakan hubungi pengelola'
                                        : 'Menuju pembuatan kontrak',
                                    icon: rejected ? (
                                        <XCircle className="h-4 w-4" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ),
                                },
                                {
                                    key: 'contract',
                                    title: 'Kontrak',
                                    desc: hasContract
                                        ? 'Kontrak tersedia'
                                        : 'Menunggu kontrak',
                                    icon: <FileSignature className="h-4 w-4" />,
                                },
                                {
                                    key: 'done',
                                    title: cancelled ? 'Dibatalkan' : 'Selesai',
                                    desc: cancelled
                                        ? 'Proses dihentikan'
                                        : 'Proses selesai',
                                    icon: cancelled ? (
                                        <CircleSlash className="h-4 w-4" />
                                    ) : (
                                        <Receipt className="h-4 w-4" />
                                    ),
                                },
                            ];

                            let current = 0;
                            if (cancelled) current = 3;
                            else if (rejected) current = 1;
                            else if (hasContract) current = 2;
                            else if (approved) current = 1;
                            else current = 0;

                            return (
                                <div className="flex flex-col items-center justify-center">
                                    {/* Mobile: current step only */}
                                    <div className="flex w-full items-center justify-center md:hidden">
                                        {(() => {
                                            const s = steps[current];
                                            const error =
                                                (rejected && current === 1) ||
                                                (cancelled && current === 3);
                                            const circleCls = [
                                                'grid place-items-center rounded-full border text-xs transition-all duration-200 ease-out',
                                                'size-12 ring-2',
                                                error
                                                    ? 'border-destructive bg-destructive/10 text-destructive ring-destructive/40 dark:bg-destructive/20'
                                                    : 'border-primary text-primary bg-primary/5 ring-primary/40 dark:bg-primary/20',
                                            ].join(' ');
                                            return (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setMobileStepOpen(
                                                                    true,
                                                                )
                                                            }
                                                            className="flex w-full flex-col items-center text-center"
                                                            aria-current="step"
                                                        >
                                                            <div
                                                                className={[
                                                                    circleCls,
                                                                    'relative',
                                                                ].join(' ')}
                                                            >
                                                                {s.icon}
                                                                {/* Hide number on mobile for minimalism */}
                                                            </div>
                                                            <div className="mt-2 text-base font-semibold">
                                                                {s.title}
                                                            </div>
                                                            <div className="text-muted-foreground text-[12px]">
                                                                {s.desc}
                                                            </div>
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{`${current + 1}. ${s.title} — ${s.desc}`}</TooltipContent>
                                                </Tooltip>
                                            );
                                        })()}
                                    </div>

                                    {/* Mobile progress bar */}
                                    <div className="mt-2 w-full px-8 md:hidden">
                                        {(() => {
                                            const percent = Math.round(
                                                (current /
                                                    Math.max(
                                                        1,
                                                        steps.length - 1,
                                                    )) *
                                                    100,
                                            );
                                            return (
                                                <div className="bg-muted relative h-2 w-full overflow-hidden rounded">
                                                    <div
                                                        className="bg-primary dark:bg-primary/80 absolute top-0 left-0 h-full rounded-r transition-all"
                                                        style={{
                                                            width: `${percent}%`,
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Desktop: full stepper */}
                                    <div className="hidden items-center justify-center md:flex">
                                        {steps.map((s, idx) => {
                                            const done =
                                                idx < current &&
                                                !rejected &&
                                                !cancelled;
                                            const active =
                                                idx === current && !cancelled;
                                            const error =
                                                (rejected && idx === 1) ||
                                                (cancelled && idx === 3);

                                            const circleCls = [
                                                'grid place-items-center rounded-full border text-xs transition-all duration-200 ease-out',
                                                active
                                                    ? 'size-10 ring-2 ring-primary'
                                                    : 'size-8',
                                                error
                                                    ? 'border-destructive bg-destructive/10 text-destructive dark:bg-destructive/20'
                                                    : done
                                                      ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                                                      : active
                                                        ? 'border-primary text-primary bg-primary/5 dark:bg-primary/20'
                                                        : 'border-muted-foreground/30 text-muted-foreground bg-muted/30 dark:bg-muted/50',
                                            ].join(' ');

                                            const titleCls = [
                                                'mt-2 text-sm font-medium transition-colors',
                                                error
                                                    ? 'text-destructive'
                                                    : active
                                                      ? 'text-foreground'
                                                      : done
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground',
                                            ].join(' ');

                                            const descCls = [
                                                'text-[11px] leading-tight transition-colors',
                                                error
                                                    ? 'text-destructive/80'
                                                    : active
                                                      ? 'text-foreground/80'
                                                      : 'text-muted-foreground',
                                            ].join(' ');

                                            const connectorCls = [
                                                'hidden md:block rounded-full md:mx-2 md:h-0.5 md:w-16 lg:w-24',
                                                error
                                                    ? 'bg-destructive/40 dark:bg-destructive/50'
                                                    : idx < current
                                                      ? 'bg-primary dark:bg-primary/80'
                                                      : 'bg-muted dark:bg-muted/60',
                                            ].join(' ');

                                            const numCls = [
                                                'absolute -top-1 -right-1 hidden rounded-full px-1 text-[10px] leading-none shadow md:inline',
                                                error
                                                    ? 'bg-destructive text-destructive-foreground'
                                                    : done || active
                                                      ? 'bg-primary text-primary-foreground'
                                                      : 'bg-muted text-foreground',
                                            ].join(' ');

                                            const tip = `${idx + 1}. ${s.title} — ${s.desc}`;

                                            return (
                                                <Tooltip key={s.key}>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center">
                                                            <div
                                                                className="flex w-28 flex-col items-center text-center md:w-32"
                                                                aria-current={
                                                                    active
                                                                        ? 'step'
                                                                        : undefined
                                                                }
                                                            >
                                                                <div
                                                                    className={[
                                                                        circleCls,
                                                                        'relative',
                                                                    ].join(' ')}
                                                                >
                                                                    {s.icon}
                                                                    <span
                                                                        className={
                                                                            numCls
                                                                        }
                                                                    >
                                                                        {idx +
                                                                            1}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className={
                                                                        titleCls
                                                                    }
                                                                >
                                                                    {s.title}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        descCls
                                                                    }
                                                                >
                                                                    {s.desc}
                                                                </div>
                                                            </div>
                                                            {idx <
                                                                steps.length -
                                                                    1 && (
                                                                <div
                                                                    className={
                                                                        connectorCls
                                                                    }
                                                                    aria-hidden
                                                                />
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {tip}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Informasi langkah ditampilkan via tooltip per-step (hover),
                            sehingga panel penjelasan di bawah ini dihilangkan agar tidak mengganggu. */}
                    </CardContent>
                </Card>
                {/* Ringkasan Booking */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">
                            {t('detail.summary', 'Ringkasan Booking')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-4 w-4" />
                                    <span className="font-medium">
                                        {booking.number}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="inline-flex items-center gap-1 capitalize">
                                        <CalendarCheck className="h-3.5 w-3.5" />{' '}
                                        {booking.status}
                                    </Badge>
                                </div>
                                {booking.room?.building ||
                                booking.room?.type ? (
                                    <div className="text-muted-foreground inline-flex flex-wrap items-center gap-2 text-xs">
                                        {booking.room?.building ? (
                                            <span className="inline-flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5" />{' '}
                                                {booking.room.building}
                                            </span>
                                        ) : null}
                                        {booking.room?.type ? (
                                            <span className="inline-flex items-center gap-1">
                                                <Tag className="h-3.5 w-3.5" />{' '}
                                                {booking.room.type}
                                            </span>
                                        ) : null}
                                    </div>
                                ) : null}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-md border p-2 text-xs">
                                        <div className="text-muted-foreground inline-flex items-center gap-1">
                                            <CalendarCheck className="h-3.5 w-3.5" />{' '}
                                            {tCommon('start')}
                                        </div>
                                        <div className="text-sm font-medium">
                                            {formatDate(booking.start_date)}
                                        </div>
                                    </div>
                                    <div className="rounded-md border p-2 text-xs">
                                        <div className="text-muted-foreground inline-flex items-center gap-1">
                                            <Timer className="h-3.5 w-3.5" />{' '}
                                            {tCommon('duration', 'Durasi')}
                                        </div>
                                        <div className="text-sm font-medium">
                                            {booking.duration}{' '}
                                            {tCommon('monthly', 'bulan')}
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-md border p-2 text-xs">
                                    <div className="text-muted-foreground inline-flex items-center gap-1">
                                        <CalendarRange className="h-3.5 w-3.5" />{' '}
                                        {tCommon('period')}
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatPeriod(booking.period)}
                                    </div>
                                </div>
                                {booking.promo_code ? (
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                                            {tCommon('promo_code')}:{' '}
                                            {booking.promo_code}
                                        </span>
                                        {(() => {
                                            const m = String(
                                                booking.promo_code || '',
                                            )
                                                .trim()
                                                .match(/(\d{1,2})$/);
                                            const pct = m
                                                ? Math.max(
                                                      0,
                                                      Math.min(
                                                          50,
                                                          parseInt(m[1]!, 10),
                                                      ),
                                                  )
                                                : 0;
                                            return pct > 0 ? (
                                                <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                                                    {t(
                                                        'room.promo_preview_badge',
                                                        'Promo (perkiraan) −{{pct}}%',
                                                        { pct },
                                                    )}
                                                </span>
                                            ) : null;
                                        })()}
                                    </div>
                                ) : null}
                                {booking.notes ? (
                                    <div className="text-muted-foreground mt-1 text-xs">
                                        {tCommon('notes')}: {booking.notes}
                                    </div>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <div className="rounded-md border p-2 text-sm">
                                    <div className="text-muted-foreground text-xs">
                                        {t(
                                            'detail.estimate_total',
                                            'Total Estimasi',
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-lg font-semibold">
                                            {new Intl.NumberFormat(
                                                'id-ID',
                                            ).format(
                                                booking.estimate?.total || 0,
                                            )}
                                        </div>
                                        {promoPct > 0 ? (
                                            <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                                                {t(
                                                    'room.promo_preview_badge',
                                                    'Promo (perkiraan) −{{pct}}%',
                                                    { pct: promoPct },
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                {booking.contract_id ? (
                                    <div className="flex items-center gap-2 pt-1">
                                        <Button asChild size="sm">
                                            <Link
                                                href={route(
                                                    'tenant.contracts.show',
                                                    {
                                                        contract:
                                                            booking.contract_id,
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
                                        {rejected || cancelled ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <a
                                                    href={contactUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <LifeBuoy className="mr-1 h-4 w-4" />{' '}
                                                    {t(
                                                        'detail.contact_admin',
                                                        'Hubungi Pengelola',
                                                    )}
                                                </a>
                                            </Button>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Estimasi & Promo */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">
                            {t('detail.estimate_promo', 'Estimasi & Promo')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2 text-sm">
                                <div className="rounded-md border p-2">
                                    <div className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                        <Banknote className="h-3.5 w-3.5" />{' '}
                                        {t('detail.rent', 'Sewa')}
                                    </div>
                                    <div className="text-sm">
                                        {new Intl.NumberFormat('id-ID').format(
                                            booking.estimate?.final_rent || 0,
                                        )}{' '}
                                        ×{' '}
                                        {booking.estimate?.duration ||
                                            booking.duration}{' '}
                                        {t('detail.months_short', 'bln')}
                                    </div>
                                </div>
                                <div className="rounded-md border p-2">
                                    <div className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                        <ShieldCheck className="h-3.5 w-3.5" />{' '}
                                        {t('common.deposit')}
                                    </div>
                                    <div>
                                        {new Intl.NumberFormat('id-ID').format(
                                            booking.estimate?.final_deposit ||
                                                0,
                                        )}
                                    </div>
                                </div>
                                <div className="bg-muted/50 rounded-md border p-2">
                                    <div className="text-muted-foreground text-xs">
                                        {t('common.total')}
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {new Intl.NumberFormat('id-ID').format(
                                            booking.estimate?.total || 0,
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="text-muted-foreground text-xs">
                                    {t(
                                        'detail.applied_promos',
                                        'Promo yang diterapkan',
                                    )}
                                </div>
                                {booking.estimate?.promo?.applied &&
                                booking.estimate.promo.applied.length > 0 ? (
                                    <ul className="ml-4 list-disc">
                                        {booking.estimate.promo.applied.map(
                                            (p) => (
                                                <li key={p.id}>
                                                    {p.name} —{' '}
                                                    {t(
                                                        'detail.discount_rent',
                                                        'Diskon sewa',
                                                    )}{' '}
                                                    {new Intl.NumberFormat(
                                                        'id-ID',
                                                    ).format(p.discount_rent)}
                                                    {p.discount_deposit ? (
                                                        <>
                                                            {' '}
                                                            ·{' '}
                                                            {t(
                                                                'detail.discount_deposit',
                                                                'Diskon deposit',
                                                            )}{' '}
                                                            {new Intl.NumberFormat(
                                                                'id-ID',
                                                            ).format(
                                                                p.discount_deposit,
                                                            )}
                                                        </>
                                                    ) : null}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                ) : (
                                    <div className="text-muted-foreground text-xs">
                                        {t(
                                            'detail.no_promos',
                                            'Tidak ada promo yang diterapkan.',
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Informasi Kamar */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">
                            {t('detail.room_info', 'Informasi Kamar')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-md border p-2 text-sm">
                                <div className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                    <Hash className="h-3.5 w-3.5" />{' '}
                                    {tCommon('number')}
                                </div>
                                <div className="font-medium">
                                    {booking.room?.number || '-'}
                                </div>
                            </div>
                            {booking.room?.name ? (
                                <div className="rounded-md border p-2 text-sm">
                                    <div className="text-muted-foreground text-xs">
                                        {tCommon('name')}
                                    </div>
                                    <div className="font-medium">
                                        {booking.room.name}
                                    </div>
                                </div>
                            ) : null}
                            {booking.room?.building ? (
                                <div className="rounded-md border p-2 text-sm">
                                    <div className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                        <Building2 className="h-3.5 w-3.5" />{' '}
                                        {tCommon('building')}
                                    </div>
                                    <div className="font-medium">
                                        {booking.room.building}
                                    </div>
                                </div>
                            ) : null}
                            {booking.room?.type ? (
                                <div className="rounded-md border p-2 text-sm">
                                    <div className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                        <Tag className="h-3.5 w-3.5" />{' '}
                                        {tCommon('type')}
                                    </div>
                                    <div className="font-medium">
                                        {booking.room.type}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <BookingGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />

            {/* Mobile Step Detail Modal */}
            <Dialog open={mobileStepOpen} onOpenChange={setMobileStepOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Progress Booking</DialogTitle>
                        <DialogDescription>
                            Detail langkah saat ini.
                        </DialogDescription>
                    </DialogHeader>
                    {(() => {
                        const steps = [
                            {
                                key: 'requested',
                                title: 'Permohonan',
                                desc: 'Menunggu verifikasi pengelola',
                            },
                            {
                                key: 'approved',
                                title: rejected ? 'Ditolak' : 'Disetujui',
                                desc: rejected
                                    ? 'Silakan hubungi pengelola'
                                    : 'Menuju pembuatan kontrak',
                            },
                            {
                                key: 'contract',
                                title: 'Kontrak',
                                desc: hasContract
                                    ? 'Kontrak tersedia'
                                    : 'Menunggu kontrak',
                            },
                            {
                                key: 'done',
                                title: cancelled ? 'Dibatalkan' : 'Selesai',
                                desc: cancelled
                                    ? 'Proses dihentikan'
                                    : 'Proses selesai',
                            },
                        ];
                        let current = 0;
                        if (cancelled) current = 3;
                        else if (rejected) current = 1;
                        else if (hasContract) current = 2;
                        else if (approved) current = 1;
                        const s = steps[current];
                        return (
                            <div className="space-y-2 text-sm">
                                <div className="text-base font-semibold">
                                    {s.title}
                                </div>
                                <div className="text-muted-foreground">
                                    {s.desc}
                                </div>
                            </div>
                        );
                    })()}
                    <DialogFooter className="flex items-center gap-2">
                        {(rejected || cancelled) && (
                            <Button asChild size="sm">
                                <a
                                    href={contactUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Hubungi Pengelola
                                </a>
                            </Button>
                        )}
                        {hasContract && !cancelled && !rejected && (
                            <Button asChild size="sm">
                                <Link
                                    href={route('tenant.contracts.show', {
                                        contract: booking.contract_id,
                                    })}
                                >
                                    Lihat Kontrak
                                </Link>
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMobileStepOpen(false)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
