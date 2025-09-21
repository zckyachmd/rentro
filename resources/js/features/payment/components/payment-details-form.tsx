import * as React from 'react';

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
                    <Label>Metode</Label>
                    <Select value={method} onValueChange={onMethod}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {methods.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.method} />

                    {isTransfer && manualBanks.length > 0 ? (
                        <div className="mt-2 space-y-1.5">
                            <Label>Rekening Penerima</Label>
                            <Select
                                value={(
                                    receiverBank ||
                                    manualBanks[0]?.bank ||
                                    'BCA'
                                ).toLowerCase()}
                                onValueChange={(v) => onReceiverBank?.(v)}
                            >
                                <SelectTrigger>
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
                    ) : null}
                </div>
                <div className="space-y-1.5">
                    <Label>Tanggal Bayar</Label>
                    <Input
                        type="datetime-local"
                        value={paidAt}
                        onChange={(e) => onPaidAt(e.target.value)}
                    />
                    <InputError message={errors.paid_at} />
                </div>
            </div>

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
                                <div className="rounded-md border bg-muted/50 p-2 text-[12px]">
                                    <div className="grid grid-cols-2 gap-1">
                                        <div>Bank</div>
                                        <div className="text-right">
                                            {b.bank}
                                        </div>
                                        <div>Nama</div>
                                        <div className="text-right">
                                            {b.holder}
                                        </div>
                                        <div>No. Rekening</div>
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
                    <Label>Nilai Bayar</Label>
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
                    <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            {typeof amount === 'number' && amount > 0
                                ? `Preview: ${formatIDR(amount)}`
                                : ''}
                        </span>
                        <button
                            type="button"
                            className="text-[12px] underline"
                            onClick={() => onAmount(maxOutstanding || 0)}
                            disabled={(maxOutstanding || 0) <= 0}
                            title="Isi maksimal (Lunas)"
                        >
                            (Lunas)
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-3 space-y-1">
                <Label>Catatan</Label>
                <Textarea
                    rows={3}
                    value={note}
                    onChange={(e) => onNote(e.target.value)}
                    placeholder="Opsional"
                />
            </div>

            {isTransfer ? (
                <div className="space-y-1">
                    <Label>Lampiran (Bukti Transfer)</Label>
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
