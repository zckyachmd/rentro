'use client';
import {
    Building2,
    Calendar,
    DoorOpen,
    Info,
    Layers3,
    Repeat,
    User,
    Wallet,
} from 'lucide-react';

import { Crumb } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyInline } from '@/components/ui/copy-inline';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import HandoverRoomSection from '@/features/contract/components/handover-room';
import AuthLayout from '@/layouts/auth-layout';
import { formatDate, formatIDR } from '@/lib/format';
import { variantForContractStatus } from '@/lib/status';
import type {
    ContractDTO,
    HandoverOptions,
    ContractInvoiceItem as InvoiceItem,
    ManagementPaginator as Paginator,
    RoomDTO,
    TenantDTO,
} from '@/types/management';

const BREADCRUMBS: Crumb[] = [
    { label: 'Kontrak', href: route('management.contracts.index') },
    { label: 'Detail Kontrak', href: '#' },
];

// types moved to pages/types

export default function ContractDetailPage(props: {
    contract: ContractDTO;
    tenant: TenantDTO;
    room: RoomDTO;
    invoices: Paginator<InvoiceItem>;
    handover?: HandoverOptions;
}) {
    const { contract, tenant, room, invoices, handover } = props;

    return (
        <AuthLayout
            pageTitle={`Kontrak #${contract.number ?? contract.id}`}
            pageDescription="Detail lengkap kontrak, penyewa, kamar, dan invoice."
            breadcrumbs={BREADCRUMBS}
        >
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
                                        Nomor Kontrak
                                    </div>
                                    <div className="text-right font-mono">
                                        {contract.number ?? '-'}
                                    </div>
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
                                    {contract.auto_renew ? (
                                        <>
                                            <div className="text-muted-foreground">
                                                Tanggal Penagihan
                                            </div>
                                            <div className="text-right">
                                                {contract.billing_day ?? '-'}
                                            </div>
                                        </>
                                    ) : null}
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
                                            variant={variantForContractStatus(
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
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
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
                                        {tenant?.email ? (
                                            <CopyInline
                                                value={tenant.email}
                                                variant="link"
                                                className="break-words"
                                                successMessage="Email disalin"
                                            >
                                                {tenant.email}
                                            </CopyInline>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Telepon
                                    </div>
                                    <div className="text-right">
                                        {tenant?.phone ? (
                                            <CopyInline
                                                value={tenant.phone}
                                                variant="link"
                                                className="break-words"
                                                successMessage="Nomor telepon disalin"
                                            >
                                                {tenant.phone}
                                            </CopyInline>
                                        ) : (
                                            <span>-</span>
                                        )}
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
                                                            href={`${route('management.invoices.index')}?search=${encodeURIComponent(inv.number)}`}
                                                            className="hover:underline"
                                                            title="Cari invoice ini di menu Invoice"
                                                        >
                                                            {inv.number}
                                                        </a>
                                                        <CopyInline
                                                            value={inv.number}
                                                            variant="icon"
                                                            size="sm"
                                                            title="Salin nomor invoice"
                                                            aria-label="Salin nomor invoice"
                                                        />
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
                                                        variant={variantForContractStatus(
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

            <HandoverRoomSection contract={contract} handover={handover} />
        </AuthLayout>
    );
}
