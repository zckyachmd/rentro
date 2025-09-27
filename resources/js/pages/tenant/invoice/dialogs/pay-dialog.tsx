import { usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
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
import { createAbort, getJson, postForm, postJson } from '@/lib/api';
import { toLocalDateTimeMinutes } from '@/lib/date';
import i18n from '@/lib/i18n';
import {
    MethodSelection,
    PendingSection,
    StepList,
    SummarySection,
} from '@/pages/tenant/invoice/components';
import type { PageProps } from '@/types';
import type { PendingInfo, TenantInvoiceDTO } from '@/types/tenant';

function useInvoiceLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<TenantInvoiceDTO | null>(null);
    React.useEffect(() => {
        const controller = createAbort();
        async function load() {
            if (!target) return;
            setLoading(true);
            try {
                const json = await getJson<TenantInvoiceDTO>(
                    route('tenant.invoices.show', target.id),
                    { signal: controller.signal },
                );
                if (!controller.signal.aborted) setData(json);
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
        const controller = createAbort();
        controllerRef.current = controller;
        setLoading(true);
        try {
            const json = await getJson<{ pending?: PendingInfo | null }>(
                route('tenant.invoices.pay.status', target.id),
                { signal: controller.signal },
            );
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

const CHECK_COOLDOWN_MS = 12_000;
const AUTO_CHECK_INTERVAL_MS = 15_000;

export default function TenantInvoicePayDialog({
    target,
    onClose,
}: {
    target: { id: string; number: string } | null;
    onClose: () => void;
}) {
    const open = !!target;
    const { data } = useInvoiceLoader(target);
    const { pending, reload } = usePendingLoader(target);
    const [submitting, setSubmitting] = React.useState(false);
    const [canceling] = React.useState(false);
    const [checking, setChecking] = React.useState(false);
    const [bank, setBank] = React.useState<string>('bca');
    const lastCheckRef = React.useRef<number>(0);
    const inFlightRef = React.useRef<boolean>(false);
    const latestPendingRef = React.useRef<typeof pending>(null);
    const [autoTickSeed, setAutoTickSeed] = React.useState(0);

    const { props } = usePage<
        PageProps & {
            payments?: {
                manual_banks?: {
                    bank: string;
                    holder: string;
                    account: string;
                }[];
            };
            midtrans?: { banks?: string[] };
        }
    >();
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
    const [manualPaidAt, setManualPaidAt] = React.useState<string>(() =>
        toLocalDateTimeMinutes(new Date()),
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

    const [vaGenerating] = React.useState(false);

    const prevPendingRef = React.useRef<typeof pending>(null);
    React.useEffect(() => {
        if (pending) prevPendingRef.current = pending;
        latestPendingRef.current = pending;
    }, [pending]);
    const displayPending = pending ?? prevPendingRef.current;

    const remaining = useCountdown(displayPending?.expiry_time ?? null);
    const methodLabel = React.useMemo(() => {
        const t = String(displayPending?.payment_type || '').toLowerCase();
        if (!t) return '-';
        if (t === 'manual') return i18n.t('tenant/invoice:method_manual');
        if (t === 'bank_transfer' || t === 'va')
            return displayPending?.bank
                ? `${String(displayPending.bank).toUpperCase()} ${i18n.t('tenant/invoice:va_label')}`
                : i18n.t('tenant/invoice:virtual_account');
        if (t === 'cstore')
            return displayPending?.store
                ? `${i18n.t('tenant/invoice:cstore_label')} (${displayPending.store})`
                : i18n.t('tenant/invoice:cstore_label');
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

    // const close = React.useCallback(() => onClose(), [onClose]);

    const createVA = React.useCallback(async () => {
        if (!target) return;
        await postJson(route('tenant.invoices.pay.midtrans.va', target.id), {
            bank,
        });
        await reload();
        window.dispatchEvent(new CustomEvent('tenant:invoices:refresh'));
    }, [bank, reload, target]);

    const cancelPending = React.useCallback(async () => {
        if (!target) return;
        await postJson(route('tenant.invoices.pay.cancel', target.id), {});
        await reload();
        window.dispatchEvent(new CustomEvent('tenant:invoices:refresh'));
    }, [reload, target]);

    const submitManual = React.useCallback(async () => {
        if (!target) return;
        const fd = new FormData();
        fd.append('bank', manualBank);
        fd.append('note', manualNote);
        if (manualAttachment) fd.append('attachment', manualAttachment);
        if (manualPaidAt) fd.append('paid_at', manualPaidAt);
        setSubmitting(true);
        try {
            await postForm(route('tenant.invoices.pay.manual', target.id), fd);
            await reload();
            window.dispatchEvent(new CustomEvent('tenant:invoices:refresh'));
        } finally {
            setSubmitting(false);
        }
    }, [
        manualBank,
        manualNote,
        manualAttachment,
        manualPaidAt,
        reload,
        target,
    ]);

    const canCheckNow = React.useMemo(() => {
        const now = Date.now();
        return (
            now - lastCheckRef.current > CHECK_COOLDOWN_MS &&
            !inFlightRef.current
        );
    }, []);

    const checkNow = React.useCallback(async () => {
        if (!target || !canCheckNow) return;
        setChecking(true);
        inFlightRef.current = true;
        try {
            lastCheckRef.current = Date.now();
            await postJson(route('tenant.invoices.pay.check', target.id), {});
            await reload();
        } finally {
            inFlightRef.current = false;
            setChecking(false);
        }
    }, [reload, target, canCheckNow]);

    React.useEffect(() => {
        if (!open) return;
        const t = setInterval(
            () => setAutoTickSeed((s) => s + 1),
            AUTO_CHECK_INTERVAL_MS,
        );
        return () => clearInterval(t);
    }, [open]);

    React.useEffect(() => {
        if (!open) return;
        if (!canCheckNow) return;
        if (!displayPending) return;
        void checkNow();
    }, [autoTickSeed, open, canCheckNow, displayPending, checkNow]);

    const { t } = useTranslation('tenant/invoice');
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {t('pay.title')}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {t('pay.subtitle')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {data ? (
                        <SummarySection data={data} />
                    ) : (
                        <div className="h-24 animate-pulse rounded-md border" />
                    )}
                    {!displayPending ? (
                        <MethodSelection
                            bank={bank}
                            setBank={setBank}
                            vaBanks={vaBanks}
                            manualBanks={manualBanks}
                            manualBank={manualBank}
                            setManualBank={setManualBank}
                            manualPaidAt={manualPaidAt}
                            onManualPaidAtChange={setManualPaidAt}
                            manualNote={manualNote}
                            onManualNoteChange={setManualNote}
                            manualAttachment={manualAttachment}
                            onManualAttachment={setManualAttachment}
                        />
                    ) : null}
                    {displayPending ? (
                        <PendingSection
                            pending={displayPending}
                            methodLabel={methodLabel}
                            remaining={remaining}
                            isVaPending={isVaPending}
                        />
                    ) : null}
                    <StepList isManualFlow={isManualFlow} />
                </div>
                <DialogFooter>
                    {displayPending ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={cancelPending}
                                disabled={canceling}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={checkNow}
                                disabled={!canCheckNow || checking}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />{' '}
                                {t('pay.check_status')}
                            </Button>
                        </>
                    ) : (
                        <>
                            {bank === 'manual' ? (
                                <Button
                                    onClick={submitManual}
                                    disabled={submitting}
                                >
                                    {t('pay.submit_proof')}
                                </Button>
                            ) : (
                                <Button
                                    onClick={createVA}
                                    disabled={vaGenerating}
                                >
                                    {t('pay.create_va')}
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
