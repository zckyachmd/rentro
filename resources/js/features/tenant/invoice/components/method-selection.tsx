import { Copy } from 'lucide-react';

import { CopyInline } from '@/components/ui/copy-inline';
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
import Section from '@/features/tenant/invoice/components/section';

export default function MethodSelection({
    bank,
    setBank,
    vaBanks,
    manualBanks,
    manualBank,
    setManualBank,
    manualPaidAt,
    onManualPaidAtChange,
    manualNote,
    onManualNoteChange,
    manualAttachment,
    onManualAttachment,
}: {
    bank: string;
    setBank: (v: string) => void;
    vaBanks: string[];
    manualBanks: { bank: string; holder: string; account: string }[];
    manualBank: string;
    setManualBank: (v: string) => void;
    manualPaidAt: string;
    onManualPaidAtChange: (v: string) => void;
    manualNote: string;
    onManualNoteChange: (v: string) => void;
    manualAttachment: File | null;
    onManualAttachment: (f: File | null) => void;
}) {
    const isManual = bank === 'manual';
    return (
        <Section
            title="Metode Pembayaran"
            subtitle="Pilih metode dan lengkapi detail"
        >
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label>Metode</Label>
                    <Select value={bank} onValueChange={(v) => setBank(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {vaBanks.map((b) => (
                                <SelectItem key={b} value={b}>
                                    {String(b).toUpperCase()} VA
                                </SelectItem>
                            ))}
                            <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError name="bank" reserveSpace={false} />
                </div>

                {isManual ? (
                    <div className="space-y-2 rounded-lg border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Transfer Manual
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label>Rekening Tujuan</Label>
                                <Select
                                    value={manualBank}
                                    onValueChange={(v) => setManualBank(v)}
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
                                <InputError
                                    name="manual_bank"
                                    reserveSpace={false}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Detail Rekening</Label>
                                <div className="rounded-md border bg-muted/50 p-2 text-[12px]">
                                    {(() => {
                                        const b = manualBanks.find(
                                            (x) =>
                                                x.bank.toLowerCase() ===
                                                manualBank,
                                        );
                                        if (!b) return <span>-</span>;
                                        return (
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
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="font-mono">
                                                        {b.account}
                                                    </span>
                                                    <CopyInline
                                                        value={b.account}
                                                        size="xs"
                                                    >
                                                        <Copy className="h-3 w-3 opacity-70" />
                                                    </CopyInline>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>Bukti Transfer</Label>
                            <Input
                                type="file"
                                accept="image/*,application/pdf"
                                value=""
                                onChange={(e) =>
                                    onManualAttachment(
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            {manualAttachment ? (
                                <div className="text-[12px] text-muted-foreground">
                                    File: {manualAttachment.name}
                                </div>
                            ) : null}
                            <InputError
                                name="attachment"
                                reserveSpace={false}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Tanggal Bayar</Label>
                            <Input
                                type="datetime-local"
                                value={manualPaidAt}
                                onChange={(e) =>
                                    onManualPaidAtChange(e.target.value)
                                }
                            />
                            <InputError name="paid_at" reserveSpace={false} />
                        </div>

                        <div className="space-y-1">
                            <Label>Catatan (opsional)</Label>
                            <Textarea
                                rows={3}
                                value={manualNote}
                                onChange={(e) =>
                                    onManualNoteChange(e.target.value)
                                }
                                placeholder="Contoh: Sudah transfer dari bank X"
                            />
                            <InputError name="note" reserveSpace={false} />
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
}
