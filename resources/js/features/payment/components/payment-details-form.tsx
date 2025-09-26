import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatIDR } from '@/lib/format';

export type MethodOption = { value: string; label: string };

export default function PaymentDetailsForm({
    methods,
    method,
    paidAt,
    amount,
    note,
    errors = {},
    isTransfer,
    maxOutstanding = 0,
    manualBanks = [],
    receiverBank,
    onMethod,
    onPaidAt,
    onAmount,
    onNote,
    onAttachment,
    onReceiverBank,
}: {
    methods: MethodOption[];
    method: string;
    paidAt: string;
    amount: number | '';
    note: string;
    errors?: Partial<
        Record<'method' | 'paid_at' | 'amount_cents' | 'attachment', string>
    >;
    isTransfer: boolean;
    maxOutstanding?: number;
    manualBanks?: { bank: string; holder: string; account: string }[];
    receiverBank?: string;
    onMethod: (v: string) => void;
    onPaidAt: (v: string) => void;
    onAmount: (v: number | '') => void;
    onNote: (v: string) => void;
    onAttachment: (f: File | null) => void;
    onReceiverBank?: (v: string) => void;
}) {
    const { t } = useTranslation();
    const amountStr = typeof amount === 'number' ? String(amount) : '';

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawStr = e.target.value;
        if (rawStr === '') return onAmount('');
        const raw = Number(rawStr);
        if (Number.isNaN(raw)) return onAmount('');
        const capped = Math.max(0, Math.min(raw, maxOutstanding || Infinity));
        onAmount(capped);
    };

    return (
        <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>{t('payment.form.method')}</Label>
                    <Select value={method} onValueChange={onMethod}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {methods.map((m) => {
                                const key = String(m.value || '')
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, '_');
                                const label = t(`payment.method.${key}`, {
                                    ns: 'enum',
                                    defaultValue: m.label || m.value,
                                });
                                return (
                                    <SelectItem key={m.value} value={m.value}>
                                        {label}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.method} />
                </div>
                <div className="space-y-1.5">
                    <Label>{t('payment.form.paid_at')}</Label>
                    <Input
                        type="datetime-local"
                        value={paidAt}
                        onChange={(e) => onPaidAt(e.target.value)}
                    />
                    <InputError message={errors.paid_at} />
                </div>
            </div>

            {isTransfer && manualBanks.length > 0 ? (
                <div className="mt-3">
                    <div className="space-y-1.5">
                        <Label>{t('payment.form.receiver_bank')}</Label>
                        <Select
                            value={(
                                receiverBank ||
                                manualBanks[0]?.bank ||
                                'BCA'
                            ).toLowerCase()}
                            onValueChange={(v) => onReceiverBank?.(v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {manualBanks.map((b) => (
                                    <SelectItem
                                        key={b.bank}
                                        value={b.bank.toLowerCase()}
                                    >
                                        {b.bank}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ) : null}

            {isTransfer && manualBanks.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                        {(() => {
                            const b = manualBanks.find(
                                (x) =>
                                    x.bank.toLowerCase() ===
                                    (
                                        receiverBank ||
                                        manualBanks[0]?.bank ||
                                        'BCA'
                                    ).toLowerCase(),
                            );
                            if (!b) return null;
                            return (
                                <div className="bg-muted/50 rounded-md border p-2 text-[12px]">
                                    <div className="grid grid-cols-2 gap-1">
                                        <div>{t('payment.form.bank')}</div>
                                        <div className="text-right">
                                            {b.bank}
                                        </div>
                                        <div>{t('payment.form.name')}</div>
                                        <div className="text-right">
                                            {b.holder}
                                        </div>
                                        <div>
                                            {t('payment.form.account_no')}
                                        </div>
                                        <div className="text-right font-mono">
                                            {b.account}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                    <Label>{t('payment.form.amount')}</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            min="0"
                            max={maxOutstanding || undefined}
                            value={amountStr}
                            onChange={handleAmountChange}
                            className="pr-2"
                        />
                        <InputError message={errors.amount_cents} />
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex items-center justify-between text-xs">
                        <span>
                            {typeof amount === 'number' && amount > 0
                                ? `${t('payment.form.preview')} ${formatIDR(amount)}`
                                : ''}
                        </span>
                        <button
                            type="button"
                            className="text-[12px] underline"
                            onClick={() => onAmount(maxOutstanding || 0)}
                            disabled={(maxOutstanding || 0) <= 0}
                            title={t('payment.form.fill_max_title')}
                        >
                            {t('payment.form.pay_full_short')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-3 space-y-1">
                <Label>{t('common.note')}</Label>
                <Textarea
                    rows={3}
                    value={note}
                    onChange={(e) => onNote(e.target.value)}
                    placeholder={t('payment.form.note_placeholder')}
                />
            </div>

            {isTransfer ? (
                <div className="space-y-1">
                    <Label>{t('payment.form.attachment_label')}</Label>
                    <Input
                        type="file"
                        required
                        accept="image/*,application/pdf"
                        onChange={(e) =>
                            onAttachment(e.target.files?.[0] ?? null)
                        }
                    />
                    <InputError message={errors.attachment} />
                </div>
            ) : null}
        </>
    );
}
