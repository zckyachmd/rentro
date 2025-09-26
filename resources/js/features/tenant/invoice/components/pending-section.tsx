import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('tenant/invoice');
    return (
        <Section title={t('pending.title')} subtitle={t('pending.subtitle')}>
            <div className="grid gap-3 sm:grid-cols-2">
                <KVP label={t('method')} value={methodLabel} />
                <KVP label={t('deadline')} value={`${remaining ?? '-'}`} />
                {String(pending.payment_type || '').toLowerCase() ===
                'manual' ? (
                    <div className="text-muted-foreground text-xs sm:col-span-2">
                        {t('pending.manual_note')}
                    </div>
                ) : null}
                {isVaPending ? (
                    <KVP
                        label={t('va_number')}
                        value={
                            <div className="flex items-center gap-2">
                                <CopyInline
                                    value={String(pending.va_number || '')}
                                    variant="link"
                                    className="inline-flex items-center gap-1 font-mono text-sm decoration-dotted underline-offset-2"
                                    successMessage={t('va_copied')}
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
                {t('pending.info')}
            </div>
        </Section>
    );
}
