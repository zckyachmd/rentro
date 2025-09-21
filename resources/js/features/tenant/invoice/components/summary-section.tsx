import KVP from '@/features/tenant/invoice/components/kvp';
import Section from '@/features/tenant/invoice/components/section';
import { formatDate, formatIDR } from '@/lib/format';
import type { TenantInvoiceDTO } from '@/types/tenant';

export default function SummarySection({ data }: { data: TenantInvoiceDTO }) {
    return (
        <Section title="Ringkasan" subtitle="Informasi invoice">
            <div className="grid gap-3 sm:grid-cols-2">
                <KVP
                    label="Nomor"
                    value={
                        <span className="font-mono">{data.invoice.number}</span>
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
}
