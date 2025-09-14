import { AlertTriangle, CheckCheck, Copy, ShieldCheck } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDate, formatIDR } from '@/lib/format';

import type { InvoiceData } from './hooks';
import { useCountdown, useInvoiceLoader, usePendingLoader } from './hooks';

const CHECK_COOLDOWN_MS = 12_000;
const AUTO_CHECK_INTERVAL_MS = 15_000;

const Section = React.memo(function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="border-b px-3 py-2">
                <div className="text-sm font-semibold">{title}</div>
                {subtitle ? (
                    <div className="text-xs text-muted-foreground">
                        {subtitle}
                    </div>
                ) : null}
            </div>
            <div className="p-3">{children}</div>
        </div>
    );
});

const KVP = React.memo(function KVP({
    label,
    value,
    mono = false,
}: {
    label: string;
    value?: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={mono ? 'font-mono' : 'font-medium'}>{value}</div>
        </div>
    );
});

const Step = React.memo(function Step({
    n,
    title,
    desc,
}: {
    n: number;
    title: string;
    desc: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {n}
            </div>
            <div>
                <div className="text-[13px] font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
        </div>
    );
});

export default function TenantInvoicePayDialog({
    target,
    onClose,
}: {
    target: { id: string; number: string } | null;
    onClose: () => void;
}) {
    const open = !!target;
    const { data } = useInvoiceLoader(target);
    const {
        loading: pendingLoading,
        pending,
        reload,
    } = usePendingLoader(target);
    const [submitting, setSubmitting] = React.useState(false);
    const [checkingManual, setCheckingManual] = React.useState(false);
    const [successOpen, setSuccessOpen] = React.useState(false);
    const [bank, setBank] = React.useState<string>('bca');
    const [copied, setCopied] = React.useState(false);
    const [showMethodPicker, setShowMethodPicker] = React.useState(false);
    const lastCheckRef = React.useRef<number>(0);
    const inFlightRef = React.useRef<boolean>(false);
    const [autoTickSeed, setAutoTickSeed] = React.useState(0);

    const remaining = useCountdown(pending?.expiry_time ?? null);

    const isExpired = React.useMemo(() => {
        if (!pending?.expiry_time) return false;
        return new Date(pending.expiry_time).getTime() <= Date.now();
    }, [pending?.expiry_time]);

    const copyVa = React.useCallback(async (va: string) => {
        try {
            await navigator.clipboard.writeText(va);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast.success('Nomor VA disalin.');
        } catch {
            toast.message('Salin manual jika gagal.');
        }
    }, []);

    React.useEffect(() => {
        if (!open) return;
        if (!pendingLoading && !pending && !showMethodPicker && !submitting) {
            setShowMethodPicker(true);
        }
    }, [open, pendingLoading, pending, showMethodPicker, submitting]);

    React.useEffect(() => {
        if (target?.id) {
            setShowMethodPicker(false);
        }
    }, [target?.id]);

    React.useEffect(() => {
        if (!showMethodPicker && pending?.bank) setBank(pending.bank);
    }, [showMethodPicker, pending?.bank]);

    const checkStatus = React.useCallback(
        async ({
            silent = false,
            source = 'manual',
        }: { silent?: boolean; source?: 'manual' | 'auto' } = {}) => {
            if (!target) return false;
            const now = Date.now();
            if (inFlightRef.current) {
                if (source === 'manual' && !silent) {
                    toast.message('Sedang memeriksa status...');
                }
                return false;
            }
            if (now - lastCheckRef.current < CHECK_COOLDOWN_MS) {
                if (source === 'manual' && !silent) {
                    const waitMs =
                        CHECK_COOLDOWN_MS - (now - lastCheckRef.current);
                    const waitSec = Math.ceil(waitMs / 1000);
                    toast.message(
                        `Baru saja diperiksa. Coba lagi dalam ${waitSec} detik.`,
                    );
                }
                return false;
            }
            try {
                if (source === 'manual') setCheckingManual(true);
                inFlightRef.current = true;
                const res = await fetch(
                    route('tenant.invoices.show', target.id),
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                    },
                );
                if (!res.ok) throw new Error(await res.text());
                const json = (await res.json()) as InvoiceData;
                const status = String(json?.invoice?.status || '');
                const outstanding = Number(
                    json?.payment_summary?.outstanding || 0,
                );
                if (status.toLowerCase() === 'paid' || outstanding <= 0) {
                    if (source === 'manual') {
                        toast.success('Pembayaran berhasil.');
                    }
                    try {
                        window.dispatchEvent(
                            new CustomEvent('tenant:invoices:refresh', {
                                detail: { invoiceId: target.id },
                            }),
                        );
                    } catch (e) {
                        void e;
                    }
                    setSuccessOpen(true);
                    return true;
                }
                if (!silent) {
                    toast.message('Belum ada perubahan status.');
                }
                return false;
            } catch (e) {
                console.error(e);
                if (!silent) {
                    toast.error('Gagal memeriksa status.');
                }
                return false;
            } finally {
                inFlightRef.current = false;
                lastCheckRef.current = Date.now();
                if (source === 'manual') setCheckingManual(false);
                if (source === 'manual') setAutoTickSeed((s) => s + 1);
            }
        },
        [target],
    );

    React.useEffect(() => {
        if (!open) return;
        const hasValidVa =
            Boolean(pending?.va_number) &&
            !isExpired &&
            !showMethodPicker &&
            !successOpen;
        if (!hasValidVa) return;
        const t = setInterval(() => {
            checkStatus({ silent: true, source: 'auto' });
            reload();
        }, AUTO_CHECK_INTERVAL_MS);
        return () => clearInterval(t);
    }, [
        open,
        pending?.va_number,
        isExpired,
        showMethodPicker,
        successOpen,
        checkStatus,
        reload,
        autoTickSeed,
    ]);

    const createVa = React.useCallback(async () => {
        if (!target) return;
        try {
            setSubmitting(true);
            const res = await fetch(
                route('tenant.invoices.pay.midtrans.va', target.id),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            (
                                document.head.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement
                            )?.content || '',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ bank }),
                },
            );
            if (!res.ok) throw new Error(await res.text());
            const json = (await res.json()) as {
                bank?: string;
                va_number?: string | null;
                expiry_time?: string | null;
            };
            if (json?.bank) setBank(String(json.bank));
            toast.success(
                `VA${json?.bank ? ` ${String(json.bank).toUpperCase()}` : ''} berhasil dibuat.`,
            );
            setShowMethodPicker(false);
            await reload();
            lastCheckRef.current = 0;
            setAutoTickSeed((s) => s + 1);
        } catch (e) {
            console.error(e);
            toast.error('Gagal membuat VA.');
        } finally {
            setSubmitting(false);
        }
    }, [target, bank, reload]);

    const cancelVa = React.useCallback(async () => {
        if (!target) return;
        try {
            setSubmitting(true);
            const res = await fetch(
                route('tenant.invoices.pay.cancel', target.id),
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            (
                                document.head.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement
                            )?.content || '',
                    },
                    credentials: 'same-origin',
                },
            );
            if (!res.ok) throw new Error(await res.text());
            await reload();
        } catch (e) {
            console.error(e);
            toast.error('Gagal membatalkan VA.');
        } finally {
            setSubmitting(false);
        }
    }, [target, reload]);

    const inv = data?.invoice;

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between gap-3 pr-8">
                            Pembayaran
                        </DialogTitle>
                        <DialogDescription>
                            Bayar tagihan dengan Virtual Account.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="pr-2">
                        <div className="grid grid-cols-1 gap-4 px-1 pb-1 md:grid-cols-3">
                            {/* Left: Method + Instructions */}
                            <div className="space-y-4 md:col-span-2">
                                {/* Status Banner */}
                                {pending ? (
                                    <Alert
                                        variant={
                                            isExpired
                                                ? 'destructive'
                                                : undefined
                                        }
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">
                                            {isExpired
                                                ? 'Metode kedaluwarsa'
                                                : 'Metode siap'}
                                        </AlertTitle>
                                        <AlertDescription className="text-xs">
                                            {isExpired ? (
                                                <>
                                                    Instruksi kedaluwarsa.
                                                    Silakan buat ulang Virtual
                                                    Account untuk melanjutkan
                                                    pembayaran.
                                                </>
                                            ) : (
                                                <>
                                                    Transfer ke VA{' '}
                                                    <span className="font-mono">
                                                        {pending.va_number}
                                                    </span>{' '}
                                                    sebelum masa berlaku
                                                    berakhir.
                                                </>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert>
                                        <ShieldCheck className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">
                                            Aman &amp; terverifikasi
                                        </AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Metode pembayaran dibuat dari sistem
                                            kami dan notifikasi status akan
                                            diproses otomatis.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {/* VA Creator */}
                                {showMethodPicker && (
                                    <Section title="Virtual Account">
                                        <div className="mt-4 space-y-3">
                                            <div>
                                                <Label htmlFor="bank">
                                                    Pilih bank
                                                </Label>
                                                <Select
                                                    value={bank}
                                                    onValueChange={(v) =>
                                                        setBank(v)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="bank"
                                                        className="h-9"
                                                    >
                                                        <SelectValue placeholder="Pilih bank" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[
                                                            'bca',
                                                            'bni',
                                                            'bri',
                                                            'permata',
                                                            'cimb',
                                                        ].map((b) => (
                                                            <SelectItem
                                                                key={b}
                                                                value={b}
                                                            >
                                                                {b.toUpperCase()}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                                <Button
                                                    type="button"
                                                    onClick={createVa}
                                                    disabled={
                                                        submitting ||
                                                        (data?.payment_summary
                                                            ?.outstanding ??
                                                            0) <= 0
                                                    }
                                                    className="h-9 flex-1"
                                                >
                                                    Buat VA
                                                </Button>
                                            </div>
                                        </div>
                                    </Section>
                                )}
                                {/* Active Instruction */}
                                {pending && !showMethodPicker && (
                                    <Section
                                        title="Instruksi Pembayaran"
                                        subtitle={
                                            'Transfer sesuai nominal tepat agar otomatis terdeteksi.'
                                        }
                                    >
                                        {
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                    {/* Nomor VA - utama, penuh lebar */}
                                                    <div className="md:col-span-2">
                                                        <KVP
                                                            label="Nomor VA"
                                                            value={
                                                                <div className="relative w-full">
                                                                    <Input
                                                                        readOnly
                                                                        value={String(
                                                                            pending.va_number ??
                                                                                '',
                                                                        )}
                                                                        className="w-full max-w-full pr-10 font-mono text-sm tabular-nums"
                                                                        inputMode="numeric"
                                                                        aria-label="Nomor Virtual Account"
                                                                        onFocus={(
                                                                            e,
                                                                        ) =>
                                                                            e.currentTarget.select()
                                                                        }
                                                                        autoComplete="off"
                                                                        spellCheck={
                                                                            false
                                                                        }
                                                                        dir="ltr"
                                                                    />
                                                                    {pending.va_number ? (
                                                                        <button
                                                                            type="button"
                                                                            aria-label="Salin Nomor VA"
                                                                            className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                                                                            onClick={() =>
                                                                                copyVa(
                                                                                    String(
                                                                                        pending.va_number,
                                                                                    ),
                                                                                )
                                                                            }
                                                                        >
                                                                            {copied ? (
                                                                                <CheckCheck className="h-4 w-4" />
                                                                            ) : (
                                                                                <Copy className="h-4 w-4" />
                                                                            )}
                                                                        </button>
                                                                    ) : null}
                                                                </div>
                                                            }
                                                        />
                                                    </div>
                                                    {/* Nominal & Bank */}
                                                    <KVP
                                                        label="Nominal"
                                                        value={
                                                            <span className="font-semibold">
                                                                {formatIDR(
                                                                    data
                                                                        ?.payment_summary
                                                                        ?.outstanding ||
                                                                        inv?.amount_cents ||
                                                                        0,
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                    <KVP
                                                        label="Bank"
                                                        value={
                                                            <span className="font-medium uppercase">
                                                                {bank}
                                                            </span>
                                                        }
                                                    />
                                                    {/* Berlaku hingga & Sisa waktu */}
                                                    <KVP
                                                        label="Berlaku hingga"
                                                        value={
                                                            pending.expiry_time
                                                                ? formatDate(
                                                                      pending.expiry_time,
                                                                      true,
                                                                  )
                                                                : '-'
                                                        }
                                                    />
                                                    {pending?.expiry_time ? (
                                                        <KVP
                                                            label="Sisa waktu"
                                                            value={
                                                                <span className="font-mono tabular-nums">
                                                                    {remaining ??
                                                                        '-'}
                                                                </span>
                                                            }
                                                        />
                                                    ) : null}
                                                </div>
                                                <div className="h-px bg-border/70" />
                                                <div className="text-[11px] text-muted-foreground">
                                                    Pastikan transfer{' '}
                                                    <span className="font-semibold">
                                                        sesuai nominal
                                                    </span>{' '}
                                                    agar terdeteksi otomatis.
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Step
                                                        n={1}
                                                        title="Buka aplikasi bank"
                                                        desc="Pilih menu transfer ke Virtual Account."
                                                    />
                                                    <Step
                                                        n={2}
                                                        title="Masukkan nomor VA"
                                                        desc="Tempel nomor VA yang telah disalin."
                                                    />
                                                    <Step
                                                        n={3}
                                                        title="Cek nominal"
                                                        desc="Pastikan nominal sesuai tagihan. Lanjutkan pembayaran."
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                                                    {isExpired ? (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                onClick={
                                                                    createVa
                                                                }
                                                                disabled={
                                                                    submitting
                                                                }
                                                                className="h-9"
                                                            >
                                                                Buat ulang VA
                                                            </Button>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </div>
                                        }
                                    </Section>
                                )}
                            </div>
                            {/* Right: Summary & Help */}
                            <div className="space-y-4 md:col-span-1">
                                <Section title="Ringkasan Pembayaran">
                                    <div className="grid grid-cols-2 gap-4">
                                        <KVP
                                            label="No. Invoice"
                                            value={inv?.number}
                                            mono
                                        />
                                        <KVP
                                            label="Jatuh tempo"
                                            value={formatDate(
                                                String(inv?.due_date || ''),
                                            )}
                                        />
                                        <KVP
                                            label="Nominal"
                                            value={
                                                <span className="font-semibold">
                                                    {formatIDR(
                                                        inv?.amount_cents || 0,
                                                    )}
                                                </span>
                                            }
                                        />
                                        <KVP
                                            label="Sisa"
                                            value={
                                                <span className="font-semibold">
                                                    {formatIDR(
                                                        data?.payment_summary
                                                            ?.outstanding || 0,
                                                    )}
                                                </span>
                                            }
                                        />
                                    </div>
                                    {(data?.payment_summary?.outstanding ??
                                        0) <= 0 ? (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Tagihan telah dibayar.
                                        </div>
                                    ) : null}
                                </Section>
                                <Section title="Bantuan">
                                    <div className="space-y-2 text-xs text-muted-foreground">
                                        <div>
                                            • Pembayaran diproses otomatis
                                            begitu kami menerima notifikasi dari
                                            bank.
                                        </div>
                                        <div>
                                            • Jika kadaluarsa, buat metode baru
                                            dan coba lagi.
                                        </div>
                                        <div>
                                            • Simpan bukti transfer untuk
                                            verifikasi jika diperlukan.
                                        </div>
                                    </div>
                                </Section>
                                {/* Removed old "Tutup" button from here */}
                            </div>
                        </div>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                    <DialogFooter className="mt-2 gap-2">
                        {pending?.va_number && !showMethodPicker ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    checkStatus({
                                        silent: false,
                                        source: 'manual',
                                    })
                                }
                                disabled={checkingManual}
                                className="h-9"
                            >
                                {checkingManual
                                    ? 'Memeriksa…'
                                    : 'Periksa status'}
                            </Button>
                        ) : null}
                        {pending && !showMethodPicker ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={async () => {
                                    await cancelVa();
                                    setShowMethodPicker(true);
                                }}
                                disabled={submitting}
                                className="h-9"
                            >
                                Ganti bank
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onClose()}
                            className="h-9"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Success Dialog */}
            <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader className="items-center text-center">
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-lg">
                            Pembayaran Berhasil
                        </DialogTitle>
                        <DialogDescription>
                            Terima kasih. Pembayaran Anda telah kami terima.
                        </DialogDescription>
                    </DialogHeader>

                    <div aria-live="polite" className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    No. Invoice
                                </div>
                                <div className="mt-1 inline-flex items-center gap-2">
                                    <span className="font-mono text-sm font-medium">
                                        {inv?.number}
                                    </span>
                                    {inv?.number ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            aria-label="Salin No. Invoice"
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(
                                                        String(inv?.number),
                                                    );
                                                    toast.success(
                                                        'No. Invoice disalin.',
                                                    );
                                                } catch {
                                                    toast.message(
                                                        'Salin manual jika gagal.',
                                                    );
                                                }
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Nominal
                                </div>
                                <div className="mt-1 font-semibold">
                                    {formatIDR(inv?.amount_cents || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-border/70" />
                        <div className="text-[11px] text-muted-foreground">
                            Anda dapat menutup dialog ini. Status tagihan akan
                            otomatis terbarui.
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center">
                        <Button
                            type="button"
                            onClick={() => {
                                setSuccessOpen(false);
                                onClose();
                            }}
                            className="h-9"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
