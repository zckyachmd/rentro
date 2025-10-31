import {
    Banknote,
    Building2,
    CalendarCheck,
    CalendarRange,
    Check,
    ShieldCheck,
    Tag,
    Timer,
    X,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export type ConfirmRoom = {
    id: string;
    number: string;
    name?: string | null;
    building?: string | null;
    type?: string | null;
    price_month?: number | null;
    deposit?: number | null;
};

function formatIDR(n?: number | null) {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
        Number(n || 0),
    );
}

export default function ConfirmBookingDialog({
    open,
    onOpenChange,
    room,
    startDate,
    duration,
    promo,
    notes,
    onNotesChange,
    onConfirm,
    loading,
    onOpenGuide,
    onEditPlan,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: ConfirmRoom | null;
    startDate: string;
    duration: string;
    promo?: string | null;
    notes: string;
    onNotesChange: (value: string) => void;
    onConfirm: () => void;
    loading?: boolean;
    onOpenGuide?: () => void;
    onEditPlan?: () => void;
}) {
    const { t } = useTranslation('tenant/booking');
    const promoPct = React.useMemo(() => {
        const m = String(promo || '')
            .trim()
            .match(/(\d{1,2})$/);
        const pct = m ? Number.parseInt(m[1]!, 10) : 0;
        return Number.isFinite(pct) ? Math.max(0, Math.min(50, pct)) : 0;
    }, [promo]);
    const priceAfter = React.useMemo(() => {
        const base = Number(room?.price_month || 0);
        return Math.max(0, base - Math.round(base * (promoPct / 100)));
    }, [room?.price_month, promoPct]);
    const est = React.useMemo(() => {
        return (
            (Number(duration) || 0) * (room?.price_month || 0) +
            (room?.deposit || 0)
        );
    }, [duration, room?.price_month, room?.deposit]);
    const estPromo = React.useMemo(() => {
        return (Number(duration) || 0) * priceAfter + (room?.deposit || 0);
    }, [duration, priceAfter, room?.deposit]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl md:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {t('confirm.title', 'Konfirmasi Booking')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'confirm.desc',
                            'Periksa kembali detail berikut sebelum melanjutkan.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-muted/60 text-muted-foreground mb-2 rounded-md p-2 text-xs">
                    {t(
                        'confirm.note_on_hold.prefix',
                        'Booking akan masuk status',
                    )}{' '}
                    <span className="font-medium">On Hold</span>{' '}
                    {t(
                        'confirm.note_on_hold.suffix',
                        'untuk diverifikasi. Lihat progress di menu',
                    )}{' '}
                    <span className="font-medium">
                        {t('title', 'Booking Saya')}
                    </span>{' '}
                    {t('confirm.note_on_hold.join', 'atau baca')}
                    <button
                        type="button"
                        className="text-primary ml-1 underline-offset-2 hover:underline"
                        onClick={() => onOpenGuide?.()}
                    >
                        {t('guide', 'Panduan Booking')}
                    </button>
                    .
                </div>
                <div className="space-y-2 text-sm">
                    {/* Room identity */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">
                            {t('common.room')}: {room?.number}
                            {room?.name ? (
                                <span className="text-muted-foreground">
                                    {' '}
                                    • {room.name}
                                </span>
                            ) : null}
                        </div>
                        <div className="text-muted-foreground inline-flex flex-wrap items-center gap-2 text-xs">
                            {room?.building ? (
                                <span className="inline-flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" />{' '}
                                    {room.building}
                                </span>
                            ) : null}
                            {room?.type ? (
                                <span className="inline-flex items-center gap-1">
                                    <Tag className="h-3.5 w-3.5" /> {room.type}
                                </span>
                            ) : null}
                            {promo ? (
                                <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 font-medium">
                                    {t('common.promo_code')}: {promo}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {/* Plan summary */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <div className="rounded-md border p-2 text-xs">
                            <div className="text-muted-foreground inline-flex items-center gap-1">
                                <CalendarCheck className="h-3.5 w-3.5" />{' '}
                                {t('common.start')}
                            </div>
                            <div className="text-sm font-medium">
                                {startDate}
                            </div>
                        </div>
                        <div className="rounded-md border p-2 text-xs">
                            <div className="text-muted-foreground inline-flex items-center gap-1">
                                <Timer className="h-3.5 w-3.5" />{' '}
                                {t('common.duration', 'Durasi')}
                            </div>
                            <div className="text-sm font-medium">
                                {duration} {t('common.monthly', 'bulan')}
                            </div>
                        </div>
                        <div className="rounded-md border p-2 text-xs">
                            <div className="text-muted-foreground inline-flex items-center gap-1">
                                <Banknote className="h-3.5 w-3.5" />{' '}
                                {t('room.price_month_label')}
                            </div>
                            <div className="text-sm font-medium">
                                {promoPct > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground line-through">
                                            Rp {formatIDR(room?.price_month)}
                                        </span>
                                        <span>Rp {formatIDR(priceAfter)}</span>
                                    </div>
                                ) : (
                                    <>Rp {formatIDR(room?.price_month)}</>
                                )}
                            </div>
                        </div>
                        <div className="rounded-md border p-2 text-xs">
                            <div className="text-muted-foreground inline-flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5" />{' '}
                                {t('common.deposit')}
                            </div>
                            <div className="text-sm font-medium">
                                Rp {formatIDR(room?.deposit)}
                            </div>
                        </div>
                    </div>

                    {/* Total (highlight) */}
                    <div className="bg-muted/50 rounded-md border p-2">
                        <div className="text-muted-foreground text-xs">
                            {t('confirm.total_label', 'Perkiraan total')}
                        </div>
                        {promoPct > 0 ? (
                            <div>
                                <div className="text-muted-foreground line-through">
                                    Rp {formatIDR(est)}
                                </div>
                                <div className="text-foreground mt-0.5 text-[13px]">
                                    <span className="font-semibold">
                                        Rp {formatIDR(estPromo)}
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-muted-foreground ml-1 cursor-help underline-offset-2 hover:underline">
                                                {t(
                                                    'room.estimate_after_promo',
                                                    'Perkiraan total setelah promo',
                                                )}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t(
                                                'room.promo_preview_hint',
                                                'Perkiraan promo berdasarkan kode yang dimasukkan. Diskon aktual mengikuti syarat promo saat booking.',
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        ) : (
                            <div className="text-lg font-semibold">
                                Rp {formatIDR(est)}
                            </div>
                        )}
                    </div>
                    {promo ? (
                        <div>
                            {t('common.promo_code')}:{' '}
                            <span className="font-medium">{promo}</span>
                        </div>
                    ) : null}
                    <div className="pt-2">
                        <Label className="text-muted-foreground text-xs">
                            {`${t('common.notes')} (${t('common.optional')})`}
                        </Label>
                        <textarea
                            rows={3}
                            className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-2 py-1 text-sm outline-none focus-visible:ring-2"
                            placeholder={t(
                                'confirm.notes_placeholder',
                                'Catatan untuk pengelola',
                            )}
                            value={notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            maxLength={2000}
                        />
                    </div>
                </div>
                <DialogFooter className="flex items-center justify-between">
                    <div className="mr-auto">
                        {onEditPlan ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onEditPlan?.()}
                                className="inline-flex items-center"
                            >
                                <CalendarRange className="mr-1 h-4 w-4" />
                                {t('plan.edit_action', 'Ubah Rencana')}
                            </Button>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="mr-1 h-4 w-4" /> {t('common.cancel')}
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={!!loading}
                    >
                        <Check className="mr-1 h-4 w-4" />
                        {t('confirm.action', 'Konfirmasi Booking')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
