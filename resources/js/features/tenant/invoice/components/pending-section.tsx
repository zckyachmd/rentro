import { Copy } from 'lucide-react';

import { CopyInline } from '@/components/ui/copy-inline';
import KVP from '@/features/tenant/invoice/components/kvp';
import Section from '@/features/tenant/invoice/components/section';
import type { PendingInfo } from '@/types/tenant';

export default function PendingSection({
    pending,
    methodLabel,
    remaining,
    isVaPending,
}: {
    pending: PendingInfo;
    methodLabel: string;
    remaining: string | null;
    isVaPending: boolean;
}) {
    return (
        <Section
            title="Pembayaran Berjalan"
            subtitle="Selesaikan sebelum waktu habis"
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <KVP label="Metode" value={methodLabel} />
                <KVP label="Batas Waktu" value={`${remaining ?? '-'}`} />
                {String(pending.payment_type || '').toLowerCase() ===
                'manual' ? (
                    <div className="text-xs text-muted-foreground sm:col-span-2">
                        Bukti transfer sudah dikirim dan sedang menunggu review
                        admin.
                    </div>
                ) : null}
                {isVaPending ? (
                    <KVP
                        label="Nomor VA"
                        value={
                            <div className="flex items-center gap-2">
                                <CopyInline
                                    value={String(pending.va_number || '')}
                                    variant="link"
                                    className="inline-flex items-center gap-1 font-mono text-sm decoration-dotted underline-offset-2"
                                    successMessage="Nomor VA disalin"
                                >
                                    <span>{pending.va_number}</span>
                                    <Copy className="h-3 w-3 opacity-70" />
                                </CopyInline>
                            </div>
                        }
                    />
                ) : null}
            </div>
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Harap selesaikan pembayaran sesuai instruksi.
            </div>
        </Section>
    );
}
