import { useForm } from '@inertiajs/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { SearchOption } from '@/components/ui/search-select';
import InvoiceLookup from '@/features/payment/components/invoice-lookup';
import PaymentDetailsForm from '@/features/payment/components/payment-details-form';
import { createAbort, getJson } from '@/lib/api';
import { toLocalDateTimeMinutes } from '@/lib/date';
import { formatIDR } from '@/lib/format';
import type {
    ManualPaymentDialogProps,
    ManualPaymentForm,
} from '@/types/management';

const currency = (amount: number): string => formatIDR(amount);

export function ManualPaymentDialog({
    open,
    onOpenChange,
    methods,
    initialInvoiceNumber,
    invoiceCandidates = [],
    manualBanks = [],
}: ManualPaymentDialogProps) {
    const { data, setData, post, processing, transform, errors } =
        useForm<ManualPaymentForm>({
            invoice_number: initialInvoiceNumber ?? '',
            invoice_id: '',
            amount_cents: '',
            method: methods?.[0]?.value ?? 'cash',
            paid_at: '',
            note: '',
            provider: 'Kasir',
            attachment: null,
            // internal UI state: receiver bank
        });

    const defaultMethod = React.useMemo(
        () => methods?.[0]?.value ?? 'cash',
        [methods],
    );

    const invoiceNumberRef = React.useRef(data.invoice_number);
    React.useEffect(() => {
        invoiceNumberRef.current = data.invoice_number;
    }, [data.invoice_number]);

    const [lookupLoading, setLookupLoading] = React.useState(false);
    const [lookupError, setLookupError] = React.useState<string | null>(null);
    const amountRef = React.useRef<HTMLInputElement>(null);
    const [resolvedInvoice, setResolvedInvoice] = React.useState<{
        id: string;
        number: string;
        amount: number;
        status: string;
        tenant_name?: string | null;
        outstanding?: number;
        eligible?: boolean;
    } | null>(null);

    const selectedMethod = React.useMemo(
        () => methods.find((m) => m.value === data.method),
        [methods, data.method],
    );
    const isTransfer = React.useMemo(() => {
        const v = String(data.method || '').toLowerCase();
        const l = String(selectedMethod?.label || '').toLowerCase();
        return v.includes('transfer') || l.includes('transfer');
    }, [data.method, selectedMethod]);
    const [receiverBank, setReceiverBank] = React.useState<string>(() =>
        (manualBanks?.[0]?.bank || 'BCA').toLowerCase(),
    );
    const maxOutstanding = React.useMemo(
        () =>
            resolvedInvoice ? Math.max(0, resolvedInvoice.outstanding ?? 0) : 0,
        [resolvedInvoice],
    );
    // Remaining after pay (not currently displayed)
    // const remainingAfterPay = React.useMemo(() => {
    //     const outstanding = Number(resolvedInvoice?.outstanding ?? 0);
    //     const pay =
    //         typeof data.amount_cents === 'number' ? data.amount_cents : 0;
    //     return Math.max(0, outstanding - pay);
    // }, [resolvedInvoice, data.amount_cents]);

    const canSubmit =
        !processing &&
        data.invoice_id &&
        (resolvedInvoice?.eligible ?? false) &&
        typeof data.amount_cents === 'number' &&
        data.amount_cents > 0 &&
        data.paid_at.trim().length > 0 &&
        (!isTransfer || Boolean(data.attachment));

    React.useEffect(() => {
        if (!isTransfer && data.attachment) setData('attachment', null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTransfer]);

    const resetForm = React.useCallback(() => {
        setData('invoice_id', '');
        setData('invoice_number', '');
        setData('amount_cents', '');
        setData('method', defaultMethod);
        setData('paid_at', '');
        setData('note', '');
        setData('provider', 'Kasir');
        setData('attachment', null);
        setResolvedInvoice(null);
        setLookupError(null);
    }, [setData, defaultMethod]);

    React.useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open, resetForm]);

    React.useEffect(() => {
        if (open && !data.paid_at) {
            setData('paid_at', toLocalDateTimeMinutes(new Date()));
        }
    }, [open, data.paid_at, setData]);

    const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

    const lookupCtrlRef = React.useRef<AbortController | null>(null);
    const tryLookupInvoice = React.useCallback(async () => {
        if (lookupLoading) return;
        const num = (data.invoice_number || '').trim();
        if (!num) return;
        setLookupError(null);
        setLookupLoading(true);
        setResolvedInvoice(null);
        lookupCtrlRef.current?.abort();
        const ctrl = createAbort();
        lookupCtrlRef.current = ctrl;
        try {
            const json = await getJson<{
                id?: string;
                number?: string;
                amount?: number;
                status?: string;
                tenant_name?: string | null;
                outstanding?: number;
                eligible?: boolean;
            }>(
                `${route('management.invoices.lookup')}?number=${encodeURIComponent(num)}`,
                { signal: ctrl.signal },
            );
            setResolvedInvoice(
                json?.id
                    ? {
                          id: String(json.id),
                          number: String(json.number ?? num),
                          amount: Number(json.amount ?? 0),
                          status: String(json.status ?? ''),
                          tenant_name: json.tenant_name ?? null,
                          outstanding: json.outstanding ?? 0,
                          eligible: Boolean(json.eligible ?? false),
                      }
                    : null,
            );
            setLookupError(null);
            setData('invoice_id', json?.id ? String(json.id) : '');
            if (json?.id) amountRef.current?.focus();
        } catch (e) {
            if (!ctrl.signal.aborted)
                setLookupError((e as Error).message || 'Gagal mengambil data');
            setData('invoice_id', '');
        } finally {
            if (!ctrl.signal.aborted) setLookupLoading(false);
        }
    }, [lookupLoading, data.invoice_number, setData]);

    const invoiceOptions = React.useMemo<SearchOption[]>(() => {
        return invoiceCandidates.map((inv) => ({
            value: inv.id,
            label: `${inv.number} — Kamar ${inv.room_number ?? '-'}`,
            description: inv.tenant ?? undefined,
            payload: inv,
        }));
    }, [invoiceCandidates]);

    React.useEffect(() => {
        const init = (initialInvoiceNumber || '').trim();
        if (!init) return;
        const match = invoiceCandidates.find((i) => i.number === init);
        if (match) {
            setData('invoice_id', match.id);
            setResolvedInvoice({
                id: match.id,
                number: match.number,
                amount: match.amount_cents,
                status: match.status,
                tenant_name: match.tenant ?? null,
                outstanding: match.outstanding,
                eligible: (() => {
                    const norm = String(match.status || '')
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, '_');
                    const isPending = norm === 'pending';
                    const isOverdue = norm === 'overdue';
                    return (
                        (isPending || isOverdue) && (match.outstanding ?? 0) > 0
                    );
                })(),
            });
        } else {
            setData('invoice_number', init);
            void tryLookupInvoice();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialInvoiceNumber]);

    const submit = React.useCallback(() => {
        if (!canSubmit) return;
        transform((payload) => {
            const out: Record<string, unknown> = { ...payload };
            // Drop attachment for non-transfer to avoid server-side file error
            if (!isTransfer) {
                delete out.attachment;
            }
            // Ensure integer for amount
            out.amount_cents =
                typeof payload.amount_cents === 'number'
                    ? Math.floor(payload.amount_cents)
                    : '';
            // Add receiver bank meta for transfer method
            if (isTransfer) {
                const rb = manualBanks.find(
                    (b) => b.bank.toLowerCase() === receiverBank,
                );
                if (rb) {
                    out.meta = {
                        ...(out.meta as Record<string, unknown>),
                        receiver: {
                            bank: rb.bank,
                            holder: rb.holder,
                            account: rb.account,
                        },
                    };
                }
            }
            return out;
        });
        post(route('management.payments.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => close(),
        });
    }, [
        canSubmit,
        post,
        close,
        transform,
        isTransfer,
        manualBanks,
        receiverBank,
    ]);

    const hasErrors = Boolean(
        errors.invoice_id ||
            errors.method ||
            errors.paid_at ||
            errors.amount_cents ||
            errors.attachment,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-lg"
                onKeyDown={(e) => {
                    if (
                        e.key === 'Enter' &&
                        (e.metaKey ||
                            e.ctrlKey ||
                            (document.activeElement as HTMLElement)?.tagName !==
                                'TEXTAREA')
                    ) {
                        if (canSubmit) {
                            e.preventDefault();
                            submit();
                        }
                    }
                    if (e.key === 'Escape') {
                        e.stopPropagation();
                        close();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Pembayaran Manual</DialogTitle>
                    <p className="text-muted-foreground text-xs">
                        Input pembayaran manual dengan ringkas.
                    </p>
                </DialogHeader>
                {hasErrors ? (
                    <div className="border-destructive/30 bg-destructive/5 text-destructive mb-2 rounded-md border px-3 py-2 text-[12px]">
                        Periksa kembali input yang belum valid.
                    </div>
                ) : null}
                <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                        <Label>Nomor Invoice</Label>
                        <InvoiceLookup
                            options={invoiceOptions}
                            value={data.invoice_id}
                            onChange={(v, opt) => {
                                const payload = (opt?.payload || null) as
                                    | (typeof invoiceCandidates)[number]
                                    | null;
                                setData('invoice_id', v || '');
                                if (payload) {
                                    setResolvedInvoice({
                                        id: payload.id,
                                        number: payload.number,
                                        amount: payload.amount_cents,
                                        status: payload.status,
                                        tenant_name: payload.tenant ?? null,
                                        outstanding: payload.outstanding,
                                        eligible: (() => {
                                            const norm = String(
                                                payload.status || '',
                                            )
                                                .trim()
                                                .toLowerCase()
                                                .replace(/\s+/g, '_');
                                            const isPending =
                                                norm === 'pending';
                                            const isOverdue =
                                                norm === 'overdue';
                                            return (
                                                (isPending || isOverdue) &&
                                                (payload.outstanding ?? 0) > 0
                                            );
                                        })(),
                                    });
                                    setLookupError(null);
                                    if (payload.id) amountRef.current?.focus();
                                } else {
                                    setResolvedInvoice(null);
                                }
                            }}
                            errorMessage={errors.invoice_id}
                            lookupError={lookupError}
                            resolved={resolvedInvoice}
                            currency={currency}
                        />
                    </div>

                    {resolvedInvoice?.eligible ? (
                        <PaymentDetailsForm
                            methods={methods}
                            method={data.method}
                            paidAt={data.paid_at}
                            amount={data.amount_cents as number | ''}
                            note={data.note}
                            errors={{
                                method: errors.method,
                                paid_at: errors.paid_at,
                                amount_cents: errors.amount_cents,
                                attachment: errors.attachment,
                            }}
                            isTransfer={isTransfer}
                            maxOutstanding={maxOutstanding}
                            onMethod={(v) => setData('method', v)}
                            onPaidAt={(v) => setData('paid_at', v)}
                            onAmount={(v) =>
                                setData(
                                    'amount_cents',
                                    v as ManualPaymentForm['amount_cents'],
                                )
                            }
                            onNote={(v) => setData('note', v)}
                            onAttachment={(f) => setData('attachment', f)}
                            manualBanks={manualBanks}
                            receiverBank={receiverBank}
                            onReceiverBank={(v) => setReceiverBank(v)}
                        />
                    ) : null}
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={close}>
                        Batal
                    </Button>
                    {resolvedInvoice?.eligible ? (
                        <Button
                            type="button"
                            disabled={!canSubmit}
                            onClick={submit}
                        >
                            Simpan
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ManualPaymentDialog;
