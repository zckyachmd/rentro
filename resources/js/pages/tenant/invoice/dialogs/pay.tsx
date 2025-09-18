import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ensureXsrfToken } from '@/hooks/use-confirm-password';
import { formatDate, formatIDR } from '@/lib/format';
import type { PendingInfo, TenantInvoiceDTO } from '@/types/tenant';

function useInvoiceLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<TenantInvoiceDTO | null>(null);
    React.useEffect(() => {
        const controller = new AbortController();
        async function load() {
            if (!target) return;
            setLoading(true);
            try {
                const res = await fetch(
                    route('tenant.invoices.show', target.id),
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                        signal: controller.signal,
                    },
                );
                if (!res.ok) throw new Error('Gagal memuat invoice');
                const json = await res.json();
                if (!controller.signal.aborted)
                    setData(json as TenantInvoiceDTO);
            } catch (e) {
                void e; // no-op
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        load();
        return () => controller.abort();
    }, [target]);
    return { loading, data } as const;
}

function usePendingLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [pending, setPending] = React.useState<PendingInfo | null>(null);
    const controllerRef = React.useRef<AbortController | null>(null);

    const load = React.useCallback(async () => {
        if (!target) return;
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        try {
            const res = await fetch(
                route('tenant.invoices.pay.status', target.id),
                {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                    signal: controller.signal,
                },
            );
            if (!res.ok) throw new Error('Gagal memuat status');
            const json = await res.json();
            if (!controller.signal.aborted)
                setPending((json?.pending ?? null) as PendingInfo | null);
        } catch (e) {
            void e; // no-op
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [target]);

    React.useEffect(() => {
        load();
        return () => controllerRef.current?.abort();
    }, [load]);

    return { loading, pending, reload: load } as const;
}

function useCountdown(expiry?: string | null) {
    const [remaining, setRemaining] = React.useState<string | null>(null);
    React.useEffect(() => {
        if (!expiry) return setRemaining(null);
        const target = new Date(expiry).getTime();
        const tick = () => {
            const diff = Math.max(0, target - Date.now());
            if (diff <= 0) return setRemaining('00:00:00');
            const d = Math.floor(diff / 86_400_000);
            const h = Math.floor((diff % 86_400_000) / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            const s = Math.floor((diff % 60_000) / 1000);
            const pad = (n: number) => String(n).padStart(2, '0');
            const dh = d > 0 ? `${d}d ` : '';
            setRemaining(`${dh}${pad(h)}:${pad(m)}:${pad(s)}`);
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [expiry]);
    return remaining;
}

function useCopyToast() {
    const [copied, setCopied] = React.useState(false);
    const copy = React.useCallback(async (text: string, success: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast.success(success);
        } catch {
            toast.message('Salin manual jika gagal.');
        }
    }, []);
    return { copied, copy } as const;
}

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
    const [canceling, setCanceling] = React.useState(false);
    const [checking, setChecking] = React.useState(false);
    const [bank, setBank] = React.useState<string>('bca');
    const { copy } = useCopyToast();
    const lastCheckRef = React.useRef<number>(0);
    const inFlightRef = React.useRef<boolean>(false);
    const latestPendingRef = React.useRef<typeof pending>(null);
    const [autoTickSeed, setAutoTickSeed] = React.useState(0);

    // ---- DRY helpers: XSRF + fetch wrappers ----
    const withXsrf = React.useCallback(async () => {
        const token = await ensureXsrfToken();
        if (!token) throw new Error('Gagal mendapatkan CSRF token');
        return token;
    }, []);

    const postJson = React.useCallback(
        async (url: string, payload: Record<string, unknown>) => {
            const token = await withXsrf();
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload ?? {}),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => ({}))) as {
                    message?: unknown;
                };
                const msg =
                    typeof j.message === 'string'
                        ? j.message
                        : 'Permintaan gagal';
                throw new Error(msg);
            }
            return res;
        },
        [withXsrf],
    );

    const postForm = React.useCallback(
        async (url: string, form: FormData) => {
            const token = await withXsrf();
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-XSRF-TOKEN': token,
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: form,
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => ({}))) as {
                    message?: unknown;
                };
                const msg =
                    typeof j.message === 'string'
                        ? j.message
                        : 'Permintaan gagal';
                throw new Error(msg);
            }
            return res;
        },
        [withXsrf],
    );

    // Domain helpers will be declared after related states to satisfy TS

    // Manual transfer states
    const { props } = usePage<{
        payments?: {
            manual_banks?: { bank: string; holder: string; account: string }[];
        };
        midtrans?: { banks?: string[] };
    }>();
    const manualBanks = React.useMemo(
        () => props?.payments?.manual_banks ?? [],
        [props?.payments?.manual_banks],
    );
    const [manualBank, setManualBank] = React.useState<string>(() =>
        (manualBanks[0]?.bank || 'BCA').toLowerCase(),
    );
    const [manualNote, setManualNote] = React.useState<string>('');
    const [manualAttachment, setManualAttachment] = React.useState<File | null>(
        null,
    );
    const toLocalInput = React.useCallback((d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }, []);
    const [manualPaidAt, setManualPaidAt] = React.useState<string>(() =>
        toLocalInput(new Date()),
    );
    const vaBanks = React.useMemo(
        () =>
            (props?.midtrans?.banks ?? []).map((b) => String(b).toLowerCase()),
        [props?.midtrans?.banks],
    );
    React.useEffect(() => {
        if (vaBanks.length > 0 && !vaBanks.includes(bank)) {
            setBank(vaBanks[0]);
        } else if (vaBanks.length === 0) {
            setBank('manual');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vaBanks.join(',')]);

    const [vaGenerating, setVaGenerating] = React.useState(false);

    // Keep last known pending to prevent UI flicker during refresh
    const prevPendingRef = React.useRef<typeof pending>(null);
    React.useEffect(() => {
        if (pending) prevPendingRef.current = pending;
        latestPendingRef.current = pending;
    }, [pending]);
    const displayPending = pending ?? prevPendingRef.current;
    const initialPendingLoading = pendingLoading && !displayPending;
    // const inlinePendingBusy = pendingLoading && !!displayPending;

    const remaining = useCountdown(displayPending?.expiry_time ?? null);
    const methodLabel = React.useMemo(() => {
        const t = String(displayPending?.payment_type || '').toLowerCase();
        if (!t) return '-';
        if (t === 'manual') return 'Manual';
        if (t === 'bank_transfer' || t === 'va')
            return displayPending?.bank
                ? `${String(displayPending.bank).toUpperCase()} VA`
                : 'Virtual Account';
        if (t === 'cstore')
            return displayPending?.store
                ? `Convenience Store (${displayPending.store})`
                : 'Convenience Store';
        return displayPending?.payment_type || '-';
    }, [
        displayPending?.payment_type,
        displayPending?.bank,
        displayPending?.store,
    ]);

    const isVaPending = React.useMemo(() => {
        const t = String(displayPending?.payment_type || '').toLowerCase();
        return t === 'bank_transfer' || t === 'va';
    }, [displayPending?.payment_type]);

    const isManualFlow = React.useMemo(() => {
        const pendingType = String(
            displayPending?.payment_type || '',
        ).toLowerCase();
        if (pendingType) return pendingType === 'manual';
        return bank === 'manual';
    }, [displayPending?.payment_type, bank]);

    // Local close helper (declared early so callbacks can use it)
    const close = React.useCallback(() => onClose(), [onClose]);

    // Domain helpers (declared after related states)
    const createVA = React.useCallback(async () => {
        if (!target) return;
        await postJson(route('tenant.invoices.pay.midtrans.va', target.id), {
            bank,
        });
        await reload();
        hadPendingRef.current = true; // ensure pending section shows after creation
        window.dispatchEvent(new CustomEvent('tenant:invoices:refresh'));
    }, [bank, postJson, reload, target]);

    const cancelPending = React.useCallback(async () => {
        if (!target) return;
        await postJson(route('tenant.invoices.pay.cancel', target.id), {});
        prevPendingRef.current = null; // clear cache so method selection shows immediately
        await reload();
        window.dispatchEvent(new CustomEvent('tenant:invoices:refresh'));
    }, [postJson, reload, target]);

    const submitManual = React.useCallback(async () => {
        if (!target) return;
        const fd = new FormData();
        fd.append('bank', manualBank);
        if (manualNote) fd.append('note', manualNote);
        if (manualAttachment) fd.append('attachment', manualAttachment);
        if (manualPaidAt) fd.append('paid_at', manualPaidAt);
        await postForm(route('tenant.invoices.pay.manual', target.id), fd);
        toast.success('Bukti transfer terkirim. Menunggu review admin.');
        setAutoTickSeed((s) => s + 1);
        window.dispatchEvent(new CustomEvent('tenant:invoices:refresh'));
        close();
    }, [
        target,
        manualBank,
        manualNote,
        manualAttachment,
        manualPaidAt,
        postForm,
        close,
    ]);

    // ---- Named handlers (keep JSX clean) ----
    const onSubmitManual = React.useCallback(async () => {
        if (!data) return;
        setSubmitting(true);
        try {
            await submitManual();
        } catch {
            // surfaced via flash toaster by server
        } finally {
            setSubmitting(false);
        }
    }, [data, submitManual]);

    const onCancelPending = React.useCallback(async () => {
        if (!data) return;
        try {
            setCanceling(true);
            await cancelPending();
        } catch {
            // handled by flash toaster
        } finally {
            setCanceling(false);
        }
    }, [data, cancelPending]);

    const onCreateVA = React.useCallback(async () => {
        if (!data) return;
        try {
            setVaGenerating(true);
            await createVA();
        } catch {
            // handled by flash toaster
        } finally {
            setVaGenerating(false);
        }
    }, [data, createVA]);

    const onCheckStatus = React.useCallback(async () => {
        try {
            setChecking(true);
            await reload();
            if (latestPendingRef.current) {
                toast.message('Status belum berubah, coba lagi nanti');
            }
        } catch {
            // ignore
        } finally {
            setChecking(false);
        }
    }, [reload]);

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
        const t = String(pending?.payment_type || '').toLowerCase();
        const hasPending =
            t === 'manual' || t === 'va' || t === 'bank_transfer';
        if (
            open &&
            hasPending &&
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

    // ---- Render helpers ----
    const renderSummarySection = () =>
        !data ? (
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
                    <KVP label="Status" value={data.invoice.status} />
                </div>
            </Section>
        );

    const renderPendingSection = () =>
        initialPendingLoading ? (
            <div className="h-40 animate-pulse rounded-md border"></div>
        ) : displayPending ? (
            <Section
                title="Pembayaran Berjalan"
                subtitle="Selesaikan sebelum waktu habis"
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <KVP label="Metode" value={methodLabel} />
                    <KVP label="Batas Waktu" value={`${remaining ?? '-'}`} />
                    {displayPending.payment_type?.toLowerCase() === 'manual' ? (
                        <div className="text-xs text-muted-foreground sm:col-span-2">
                            Bukti transfer sudah dikirim dan sedang menunggu
                            review admin.
                        </div>
                    ) : null}
                    {isVaPending ? (
                        <KVP
                            label="Nomor VA"
                            value={
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 font-mono text-sm underline decoration-dotted underline-offset-2 hover:text-foreground"
                                        onClick={() =>
                                            copy(
                                                String(
                                                    displayPending.va_number ||
                                                        '',
                                                ),
                                                'Nomor VA disalin',
                                            )
                                        }
                                        aria-label="Salin nomor VA"
                                        title="Klik untuk menyalin"
                                    >
                                        <span>{displayPending.va_number}</span>
                                        <Copy className="h-3 w-3 opacity-70" />
                                    </button>
                                </div>
                            }
                        />
                    ) : null}
                </div>
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="mr-2 inline-block h-4 w-4" />{' '}
                    Harap selesaikan pembayaran sesuai instruksi.
                </div>
            </Section>
        ) : (
            renderMethodSelection()
        );

    const renderMethodSelection = () => (
        <Section
            title="Pilih Metode"
            subtitle="Metode pembayaran yang tersedia"
        >
            <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label>Metode</Label>
                        <Select value={bank} onValueChange={setBank}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {vaBanks.map((b) => (
                                    <SelectItem key={b} value={b}>
                                        {b.toUpperCase()} (Virtual Account)
                                    </SelectItem>
                                ))}
                                <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {bank === 'manual' ? (
                    <div className="space-y-3 rounded-md border p-3 text-xs">
                        <div className="space-y-1">
                            <div className="text-[13px] font-medium">
                                Pilih Rekening Tujuan
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {manualBanks.map((b) => {
                                    const code = String(
                                        b.bank || '',
                                    ).toLowerCase();
                                    const selected = manualBank === code;
                                    return (
                                        <button
                                            key={`${b.bank}-${b.account}`}
                                            type="button"
                                            onClick={() => setManualBank(code)}
                                            className={`rounded-md border p-2 text-left transition-colors ${selected ? 'border-primary ring-2 ring-primary/20' : 'hover:bg-muted/30'}`}
                                        >
                                            <div className="text-[13px] font-semibold">
                                                {b.bank}
                                            </div>
                                            <div className="text-[12px] text-muted-foreground">
                                                a.n. {b.holder}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 font-mono text-sm underline decoration-dotted underline-offset-2 hover:text-foreground"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copy(
                                                            String(
                                                                b.account || '',
                                                            ),
                                                            'Nomor rekening disalin',
                                                        );
                                                    }}
                                                    aria-label="Salin nomor rekening"
                                                    title="Klik untuk menyalin"
                                                >
                                                    <span>{b.account}</span>
                                                    <Copy className="h-3 w-3 opacity-70" />
                                                </button>
                                            </div>
                                        </button>
                                    );
                                })}
                                {manualBanks.length === 0 ? (
                                    <div className="text-muted-foreground">
                                        Rekening tujuan belum disetel.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Bukti Transfer</Label>
                            <Input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) =>
                                    setManualAttachment(
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Waktu Transfer</Label>
                            <Input
                                type="datetime-local"
                                value={manualPaidAt}
                                onChange={(e) =>
                                    setManualPaidAt(e.target.value)
                                }
                            />
                            <div className="mt-1 text-[11px] text-muted-foreground">
                                Isi sesuai waktu pada bukti transfer.
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Catatan (opsional)</Label>
                            <Textarea
                                rows={3}
                                value={manualNote}
                                onChange={(e) => setManualNote(e.target.value)}
                                placeholder="Contoh: Sudah transfer dari bank X"
                            />
                        </div>
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-800">
                            Setelah mengirim bukti, status akan menjadi menunggu
                            review admin.
                        </div>
                    </div>
                ) : null}
            </div>
        </Section>
    );

    const renderHowToSection = () => (
        <Section title="Cara Bayar" subtitle="Petunjuk singkat">
            {isManualFlow ? (
                <div className="space-y-2">
                    <Step
                        n={1}
                        title="Pilih rekening tujuan"
                        desc="Pilih salah satu rekening admin yang tersedia."
                    />
                    <Step
                        n={2}
                        title="Transfer sesuai instruksi"
                        desc="Transfer ke rekening terpilih; sertakan nomor invoice pada berita/notes bila diminta."
                    />
                    <Step
                        n={3}
                        title="Unggah bukti transfer"
                        desc="Unggah bukti pada form lalu kirim."
                    />
                    <Step
                        n={4}
                        title="Menunggu review admin"
                        desc="Admin akan memverifikasi pembayaran; status akan diperbarui."
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    <Step
                        n={1}
                        title="Buat VA"
                        desc="Pilih bank VA lalu buat nomor VA."
                    />
                    <Step
                        n={2}
                        title="Lakukan pembayaran"
                        desc="Bayar ke nomor VA sebelum batas waktu."
                    />
                    <Step
                        n={3}
                        title="Konfirmasi otomatis"
                        desc="Sistem akan mengecek status secara berkala."
                    />
                </div>
            )}
        </Section>
    );

    // Success dialog when invoice becomes PAID
    const [paidOpen, setPaidOpen] = React.useState(false);
    const checkInvoicePaid = React.useCallback(async () => {
        if (!target) return;
        try {
            const res = await fetch(route('tenant.invoices.show', target.id), {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const json = (await res.json()) as {
                invoice?: { status?: string };
            };
            const status = String(json?.invoice?.status || '');
            if (status.toLowerCase() === 'paid') {
                setPaidOpen(true);
                // Refresh invoice list behind the dialog
                window.dispatchEvent(
                    new CustomEvent('tenant:invoices:refresh'),
                );
                // Close pay dialog to avoid overlap
                close();
            }
        } catch {
            // ignore
        }
    }, [target, close]);

    // Detect transition from pending -> cleared to check for PAID
    const hadPendingRef = React.useRef(false);
    React.useEffect(() => {
        const has = !!pending;
        if (hadPendingRef.current && !has) {
            void checkInvoicePaid();
        }
        hadPendingRef.current = has;
    }, [pending, checkInvoicePaid]);

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

                <ScrollArea className="max-h-[70vh] pr-2">
                    <div className="space-y-4 pb-2">
                        {renderSummarySection()}
                        {renderPendingSection()}
                        {renderHowToSection()}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={close}>
                        Tutup
                    </Button>
                    {bank === 'manual' ? (
                        <Button
                            type="button"
                            disabled={
                                !data ||
                                submitting ||
                                !manualAttachment ||
                                manualBanks.length === 0
                            }
                            onClick={onSubmitManual}
                        >
                            {submitting ? 'Mengirim…' : 'Kirim Bukti'}
                        </Button>
                    ) : isVaPending ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!data || submitting || canceling}
                                onClick={onCancelPending}
                            >
                                {canceling ? 'Membatalkan…' : 'Ganti Metode'}
                            </Button>
                            <Button
                                type="button"
                                disabled={!data || submitting || checking}
                                onClick={onCheckStatus}
                            >
                                {checking ? 'Mengecek…' : 'Cek Status'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            disabled={
                                !data ||
                                submitting ||
                                !vaBanks.length ||
                                vaGenerating
                            }
                            onClick={onCreateVA}
                        >
                            {vaGenerating ? 'Membuat VA…' : 'Buat VA'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
            {/* Success dialog when payment is completed */}
            <Dialog open={paidOpen} onOpenChange={(v) => setPaidOpen(v)}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center gap-3 py-4">
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                        <DialogTitle>Pembayaran Berhasil</DialogTitle>
                        <DialogDescription className="text-center">
                            Terima kasih. Pembayaran Anda sudah kami terima.
                        </DialogDescription>
                        <Button
                            type="button"
                            onClick={() => setPaidOpen(false)}
                        >
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
