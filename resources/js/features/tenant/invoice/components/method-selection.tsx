import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t: tInv } = useTranslation('tenant/invoice');
    return (
        <Section
            title={tInv('method_section.title')}
            subtitle={tInv('method_section.subtitle')}
        >
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label>{tInv('method')}</Label>
                    <Select value={bank} onValueChange={(v) => setBank(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {vaBanks.map((b) => (
                                <SelectItem key={b} value={b}>
                                    {String(b).toUpperCase()} {tInv('va_label')}
                                </SelectItem>
                            ))}
                            <SelectItem value="manual">
                                {tInv('method_manual')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError name="bank" reserveSpace={false} />
                </div>

                {isManual ? (
                    <div className="space-y-2 rounded-lg border p-3">
                        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            {tInv('manual.title')}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label>{tInv('manual.dest_account')}</Label>
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
                                <Label>{tInv('manual.account_detail')}</Label>
                                <div className="bg-muted/50 rounded-md border p-2 text-[12px]">
                                    {(() => {
                                        const b = manualBanks.find(
                                            (x) =>
                                                x.bank.toLowerCase() ===
                                                manualBank,
                                        );
                                        if (!b) return <span>-</span>;
                                        return (
                                            <div className="grid grid-cols-2 gap-1">
                                                <div>{tInv('manual.bank')}</div>
                                                <div className="text-right">
                                                    {b.bank}
                                                </div>
                                                <div>{tInv('manual.name')}</div>
                                                <div className="text-right">
                                                    {b.holder}
                                                </div>
                                                <div>
                                                    {tInv('manual.account_no')}
                                                </div>
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
                            <Label>{tInv('manual.proof')}</Label>
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
                                <div className="text-muted-foreground text-[12px]">
                                    {tInv('manual.file')}:
                                    {manualAttachment.name}
                                </div>
                            ) : null}
                            <InputError
                                name="attachment"
                                reserveSpace={false}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>{tInv('manual.paid_at')}</Label>
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
                            <Label>{tInv('manual.note_label')}</Label>
                            <Textarea
                                rows={3}
                                value={manualNote}
                                onChange={(e) =>
                                    onManualNoteChange(e.target.value)
                                }
                                placeholder={tInv('manual.note_placeholder')}
                            />
                            <InputError name="note" reserveSpace={false} />
                        </div>

                        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-800">
                            {tInv('manual.info')}
                        </div>
                    </div>
                ) : null}
            </div>
        </Section>
    );
}
