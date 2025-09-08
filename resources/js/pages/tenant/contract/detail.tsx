import { Crumb } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuthLayout from '@/layouts/auth-layout';
import { formatDate, formatIDR } from '@/lib/format';
import {
    variantForContractStatus,
    variantForInvoiceStatus,
} from '@/lib/status';

const BREADCRUMBS: Crumb[] = [
    { label: 'Kontrak', href: route('tenant.contracts.index') },
    { label: 'Detail Kontrak', href: '#' },
];

type ContractDetail = {
    id: string;
    updated_at?: string | null;
    room: {
        id: string;
        number: string;
        name?: string | null;
        price_cents?: number | null;
        billing_period?: string | null;
        building?: { id: string; name: string; code?: string | null } | null;
        floor?: { id: string; level: string | number } | null;
        type?: { id: string; name: string; price_cents?: number | null } | null;
    } | null;
    start_date?: string | null;
    end_date?: string | null;
    rent_cents: number;
    deposit_cents?: number | null;
    billing_period?: string | null;
    billing_day?: number | null;
    status: string;
    auto_renew: boolean;
    notes?: string;
};

type InvoiceItem = {
    id: string;
    number: string;
    period_start?: string | null;
    period_end?: string | null;
    due_date?: string | null;
    amount_cents: number;
    status: string;
    paid_at?: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
};

type PageProps = { contract: ContractDetail; invoices: Paginator<InvoiceItem> };

export default function TenantContractDetail(props: PageProps) {
    const { contract, invoices } = props;

    return (
        <AuthLayout
            pageTitle={`Kontrak #${contract.id}`}
            pageDescription="Detail kontrak Anda."
            breadcrumbs={BREADCRUMBS}
        >
            <div className="mb-2 flex items-center justify-end gap-3">
                <div className="hidden text-xs text-muted-foreground md:block">
                    Terakhir diperbarui: {formatDate(contract.updated_at, true)}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Kontrak</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Kamar</div>
                            <div className="font-medium">
                                {contract.room?.number ?? '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Mulai</div>
                            <div>
                                {contract.start_date
                                    ? formatDate(contract.start_date)
                                    : '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Selesai</div>
                            <div>
                                {contract.end_date
                                    ? formatDate(contract.end_date)
                                    : '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Sewa</div>
                            <div className="font-semibold">
                                {formatIDR(contract.rent_cents)}
                            </div>
                        </div>
                        {typeof contract.deposit_cents === 'number' && (
                            <div className="flex items-center justify-between">
                                <div className="text-muted-foreground">
                                    Deposit
                                </div>
                                <div className="font-semibold">
                                    {formatIDR(contract.deposit_cents || 0)}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Periode Tagih
                            </div>
                            <div>{contract.billing_period || '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Tanggal Penagihan
                            </div>
                            <div>{contract.billing_day ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Status</div>
                            <div>
                                <Badge
                                    variant={variantForContractStatus(
                                        contract.status,
                                    )}
                                >
                                    {contract.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Kamar</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Nama</div>
                            <div>{contract.room?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Gedung</div>
                            <div>{contract.room?.building?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Lantai</div>
                            <div>{contract.room?.floor?.level ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Tipe</div>
                            <div>{contract.room?.type?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Harga Kamar
                            </div>
                            <div className="font-semibold">
                                {formatIDR(contract.room?.price_cents || 0)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Invoice */}
            <Card className="mt-6">
                <CardHeader className="pb-3">
                    <CardTitle>Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr>
                                    <th className="h-10 px-4 text-left">
                                        Nomor
                                    </th>
                                    <th className="h-10 px-4 text-left">
                                        Periode
                                    </th>
                                    <th className="h-10 px-4 text-left">
                                        Jatuh Tempo
                                    </th>
                                    <th className="h-10 px-4 text-left">
                                        Status
                                    </th>
                                    <th className="h-10 px-4 text-right">
                                        Jumlah
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.data.length ? (
                                    invoices.data.map((inv) => (
                                        <tr key={inv.id} className="border-b">
                                            <td className="px-4 py-2 font-mono text-xs">
                                                <a
                                                    href={`${route('tenant.invoices.index')}?q=${encodeURIComponent(inv.number)}`}
                                                    className="underline underline-offset-2 hover:opacity-80"
                                                    title="Lihat di halaman Tagihan"
                                                >
                                                    {inv.number}
                                                </a>
                                            </td>
                                            <td className="px-4 py-2">
                                                {(formatDate(
                                                    inv.period_start,
                                                ) ?? '-') +
                                                    ' s/d ' +
                                                    (formatDate(
                                                        inv.period_end,
                                                    ) ?? '-')}
                                            </td>
                                            <td className="px-4 py-2">
                                                {formatDate(inv.due_date)}
                                            </td>
                                            <td className="px-4 py-2">
                                                <Badge
                                                    variant={variantForInvoiceStatus(
                                                        inv.status,
                                                    )}
                                                >
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {formatIDR(inv.amount_cents)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                                            colSpan={5}
                                        >
                                            Tidak ada invoice.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
