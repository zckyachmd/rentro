import { AlertTriangle, Copy } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDate, formatIDR } from '@/lib/format';

import { useCountdown, useInvoiceLoader, usePendingLoader } from '../hooks';

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
    const [bank, setBank] = React.useState<string>('bca');
    const [copied, setCopied] = React.useState(false);
    const lastCheckRef = React.useRef<number>(0);
    const inFlightRef = React.useRef<boolean>(false);
    const [autoTickSeed, setAutoTickSeed] = React.useState(0);

    const remaining = useCountdown(pending?.expiry_time ?? null);
    const methodLabel = React.useMemo(() => {
        const t = String(pending?.payment_type || '').toLowerCase();
        if (!t) return '-';
        if (t === 'manual') return 'Manual';
        if (t === 'va')
            return pending?.bank
                ? `${String(pending.bank).toUpperCase()} VA`
                : 'Virtual Account';
        if (t === 'cstore')
            return pending?.store
                ? `Convenience Store (${pending.store})`
                : 'Convenience Store';
        return pending?.payment_type || '-';
    }, [pending?.payment_type, pending?.bank, pending?.store]);

    React.useEffect(() => {
        if (!open || !target) return;
        const timer = setInterval(
            () => setAutoTickSeed((i) => i + 1),
            AUTO_CHECK_INTERVAL_MS,
        );
        return () => clearInterval(timer);
    }, [open, target?.id, target]);

    React.useEffect(() => {
        const now = Date.now();
        const elapsed = now - lastCheckRef.current;
        if (
            open &&
            String(pending?.payment_type || '').toLowerCase() === 'manual' &&
            Boolean(remaining) &&
            !inFlightRef.current &&
            elapsed >= CHECK_COOLDOWN_MS
        ) {
            inFlightRef.current = true;
            void reload().finally(() => {
                inFlightRef.current = false;
                lastCheckRef.current = Date.now();
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoTickSeed]);

    const close = React.useCallback(() => onClose(), [onClose]);

    const doCopy = React.useCallback((text: string) => {
        try {
            navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Disalin ke clipboard');
            setTimeout(() => setCopied(false), 800);
        } catch {
            toast.error('Gagal menyalin');
        }
    }, []);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && close()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Bayar Invoice {target?.number ?? ''}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Pilih metode dan selesaikan pembayaran
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!data ? (
                        <div className="h-40 animate-pulse rounded-md border"></div>
                    ) : (
                        <Section title="Ringkasan" subtitle="Informasi invoice">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <KVP
                                    label="Nomor"
                                    value={
                                        <span className="font-mono">
                                            {data.invoice.number}
                                        </span>
                                    }
                                />
                                <KVP
                                    label="Jatuh Tempo"
                                    value={formatDate(data.invoice.due_date)}
                                />
                                <KVP
                                    label="Nilai"
                                    value={formatIDR(data.invoice.amount_cents)}
                                />
                                <KVP
                                    label="Status"
                                    value={data.invoice.status}
                                />
                            </div>
                        </Section>
                    )}

                    {pendingLoading ? (
                        <div className="h-40 animate-pulse rounded-md border"></div>
                    ) : pending ? (
                        <Section
                            title="Pembayaran Berjalan"
                            subtitle="Selesaikan sebelum waktu habis"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <KVP label="Metode" value={methodLabel} />
                                <KVP
                                    label="Batas Waktu"
                                    value={`${remaining ?? '-'}`}
                                />
                                {pending.payment_type?.toLowerCase() ===
                                'manual' ? (
                                    <>
                                        <KVP
                                            label="Nomor VA"
                                            value={
                                                <span className="font-mono">
                                                    {pending.va_number}
                                                </span>
                                            }
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() =>
                                                    doCopy(
                                                        pending.va_number || '',
                                                    )
                                                }
                                            >
                                                <Copy className="mr-2 h-4 w-4" />{' '}
                                                Salin No. VA
                                            </Button>
                                            {copied ? (
                                                <span className="text-xs text-emerald-600">
                                                    Disalin
                                                </span>
                                            ) : null}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                <AlertTriangle className="mr-2 inline-block h-4 w-4" />{' '}
                                Harap selesaikan pembayaran sesuai instruksi.
                            </div>
                        </Section>
                    ) : (
                        <Section
                            title="Pilih Metode"
                            subtitle="Metode pembayaran yang tersedia"
                        >
                            <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>Metode</Label>
                                        <Select
                                            value={bank}
                                            onValueChange={setBank}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bca">
                                                    BCA (Virtual Account)
                                                </SelectItem>
                                                <SelectItem value="bri">
                                                    BRI (Virtual Account)
                                                </SelectItem>
                                                <SelectItem value="manual">
                                                    Manual
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {bank === 'manual' ? (
                                    <div className="rounded-md border p-3 text-xs">
                                        Ikuti instruksi admin untuk pembayaran
                                        manual.
                                    </div>
                                ) : (
                                    <div className="rounded-md border p-3 text-xs">
                                        VA akan dibuat dan dapat dicek secara
                                        berkala.
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    <Section title="Cara Bayar" subtitle="Petunjuk singkat">
                        <div className="space-y-2">
                            <Step
                                n={1}
                                title="Pilih metode"
                                desc="Pilih VA atau manual"
                            />
                            <Step
                                n={2}
                                title="Lakukan pembayaran"
                                desc="Transfer sesuai instruksi"
                            />
                            <Step
                                n={3}
                                title="Konfirmasi otomatis"
                                desc="Sistem akan mengecek status"
                            />
                        </div>
                    </Section>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={close}>
                        Tutup
                    </Button>
                    <Button
                        type="button"
                        disabled={!data || submitting}
                        onClick={async () => {
                            setSubmitting(true);
                            try {
                                await new Promise((resolve) =>
                                    setTimeout(resolve, 600),
                                );
                                toast.success('Permintaan pembayaran diproses');
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        {submitting ? 'Memproses…' : 'Bayar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
