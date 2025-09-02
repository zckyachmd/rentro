'use client';

import {
    Building2,
    Calendar,
    ClipboardCopy,
    DoorOpen,
    Info,
    Layers3,
    Repeat,
    User,
    Wallet,
} from 'lucide-react';

import { Crumb } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AuthLayout from '@/layouts/auth-layout';
import { formatDate, formatIDR } from '@/lib/format';

const BREADCRUMBS: Crumb[] = [
    { label: 'Kontrak', href: route('management.contracts.index') },
    { label: 'Detail Kontrak', href: '#' },
];

type ContractDTO = {
    id: string;
    start_date?: string | null;
    end_date?: string | null;
    rent_cents: number;
    deposit_cents: number;
    billing_period: string;
    billing_day?: number | null;
    auto_renew: boolean;
    status: string;
    notes?: string | null;
    paid_in_full_at?: string | null;
    deposit_refund_cents?: number | null;
    deposit_refunded_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type TenantDTO = {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
} | null;
type RoomDTO = {
    id: string;
    number: string;
    name?: string | null;
    billing_period?: string | null;
    price_cents?: number | null;
    type?: {
        id: string;
        name: string;
        deposit_cents?: number | null;
        price_cents?: number | null;
    } | null;
    building?: { id: string; name: string; code?: string | null } | null;
    floor?: { id: string; level: number | string } | null;
} | null;

type InvoiceItem = {
    id: string;
    number: string;
    status: string;
    due_date?: string | null;
    period_start?: string | null;
    period_end?: string | null;
    amount_cents: number;
    paid_at?: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
};

function statusVariant(
    s: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    const map: Record<
        string,
        'default' | 'secondary' | 'destructive' | 'outline'
    > = {
        Active: 'default',
        'Pending Payment': 'secondary',
        Booked: 'secondary',
        Overdue: 'destructive',
        Cancelled: 'outline',
        Completed: 'outline',
        Paid: 'default',
    };
    return map[s] ?? 'secondary';
}

export default function ContractDetailPage(props: {
    contract: ContractDTO;
    tenant: TenantDTO;
    room: RoomDTO;
    invoices: Paginator<InvoiceItem>;
}) {
    const { contract, tenant, room, invoices } = props;

    return (
        <AuthLayout
            pageTitle={`Kontrak #${contract.id}`}
            pageDescription="Detail lengkap kontrak, penyewa, kamar, dan invoice."
            breadcrumbs={BREADCRUMBS}
        >
            {/* Header ringkas dengan status & ID copyable */}
            <div className="mb-2 flex items-center justify-end gap-3">
                <div className="hidden text-xs text-muted-foreground md:block">
                    Terakhir diperbarui: {formatDate(contract.updated_at, true)}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Informasi Kontrak */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle>Informasi Kontrak</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Periode</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        Tanggal Mulai
                                    </div>
                                    <div className="text-right">
                                        {formatDate(contract.start_date)}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Tanggal Berakhir
                                    </div>
                                    <div className="text-right">
                                        {formatDate(contract.end_date)}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Periode Tagihan
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline">
                                            {contract.billing_period}
                                        </Badge>
                                    </div>
                                    <div className="text-muted-foreground">
                                        Hari Tagihan
                                    </div>
                                    <div className="text-right">
                                        {contract.billing_day ?? '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <Repeat className="h-4 w-4" />
                                    <span>Pengaturan</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        Status
                                    </div>
                                    <div className="text-right">
                                        <Badge
                                            variant={statusVariant(
                                                contract.status,
                                            )}
                                        >
                                            {contract.status}
                                        </Badge>
                                    </div>
                                    <div className="text-muted-foreground">
                                        Auto‑Renew
                                    </div>
                                    <div className="text-right">
                                        {contract.auto_renew ? 'Ya' : 'Tidak'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Lunas Penuh
                                    </div>
                                    <div className="text-right">
                                        {contract.paid_in_full_at ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(
                                                        contract.paid_in_full_at,
                                                        true,
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </div>
                                </div>
                                {contract.notes ? (
                                    <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs leading-relaxed">
                                        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                                            <Info className="h-3.5 w-3.5" />
                                            <span>Catatan</span>
                                        </div>
                                        <div>{contract.notes}</div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="rounded-lg border p-4 md:col-span-2">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <Wallet className="h-4 w-4" />
                                    <span>Biaya</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        Sewa
                                    </div>
                                    <div className="text-right">
                                        {formatIDR(contract.rent_cents)}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Deposit
                                    </div>
                                    <div className="text-right">
                                        {formatIDR(contract.deposit_cents)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Penyewa & Kamar */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Penyewa & Kamar</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <div className="space-y-3">
                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>Penyewa</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        Nama
                                    </div>
                                    <div className="text-right">
                                        {tenant?.name ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Email
                                    </div>
                                    <div className="text-right">
                                        {tenant?.email ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Telepon
                                    </div>
                                    <div className="text-right">
                                        {tenant?.phone ?? '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                    <DoorOpen className="h-4 w-4" />
                                    <span>Kamar</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        Nomor
                                    </div>
                                    <div className="text-right">
                                        {room?.number ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Nama
                                    </div>
                                    <div className="text-right">
                                        {room?.name ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Gedung
                                    </div>
                                    <div className="flex items-center justify-end gap-2 text-right">
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>
                                            {room?.building?.name ?? '-'}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground">
                                        Lantai
                                    </div>
                                    <div className="flex items-center justify-end gap-2 text-right">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        <span>{room?.floor?.level ?? '-'}</span>
                                    </div>
                                    <div className="text-muted-foreground">
                                        Tipe
                                    </div>
                                    <div className="text-right">
                                        {room?.type?.name ?? '-'}
                                    </div>
                                </div>
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
                    <ScrollArea className="w-full">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead>Nomor</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Jatuh Tempo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Jumlah
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.data.length ? (
                                        invoices.data.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-mono text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={`${route('management.invoices.index')}?open=${inv.id}`}
                                                            className="hover:underline"
                                                            title="Lihat detail invoice"
                                                        >
                                                            {inv.number}
                                                        </a>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="js-copy h-7 w-7"
                                                            data-clipboard-text={
                                                                inv.number
                                                            }
                                                            aria-label="Salin nomor invoice"
                                                        >
                                                            <ClipboardCopy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {(formatDate(
                                                        inv.period_start,
                                                    ) ?? '-') +
                                                        ' s/d ' +
                                                        (formatDate(
                                                            inv.period_end,
                                                        ) ?? '-')}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(inv.due_date)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={statusVariant(
                                                            inv.status,
                                                        )}
                                                    >
                                                        {inv.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatIDR(
                                                        inv.amount_cents,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="py-8 text-center text-sm text-muted-foreground"
                                            >
                                                Tidak ada invoice.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
