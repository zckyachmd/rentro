import { useTranslation } from 'react-i18next';

import { formatDate, formatIDR } from '@/lib/format';
import { KVP, Section } from '@/pages/tenant/invoice/components';
import type { TenantInvoiceDTO } from '@/types/tenant';

export default function SummarySection({ data }: { data: TenantInvoiceDTO }) {
    const { t } = useTranslation('tenant/invoice');
    return (
        <Section title={t('summary.title')} subtitle={t('summary.subtitle')}>
            <div className="grid gap-3 sm:grid-cols-2">
                <KVP
                    label={t('common.number')}
                    value={
                        <span className="font-mono">{data.invoice.number}</span>
                    }
                />
                <KVP
                    label={t('common.due_date')}
                    value={formatDate(data.invoice.due_date)}
                />
                <KVP
                    label={t('common.amount')}
                    value={formatIDR(data.invoice.amount_idr)}
                />
                <KVP label={t('common.status')} value={data.invoice.status} />
            </div>
        </Section>
    );
}
