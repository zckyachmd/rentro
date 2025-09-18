'use client';

import { router } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    ClipboardCopy,
    DoorOpen,
    Info,
    Layers3,
    MoreHorizontal,
    Repeat,
    User,
    Wallet,
} from 'lucide-react';
import React from 'react';

import { Can } from '@/components/acl';
import { Crumb } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { variantForContractStatus } from '@/lib/status';
import HandoverCreate from '@/pages/management/contract/dialogs/handover-create';
import HandoverDetail from '@/pages/management/contract/dialogs/handover-detail';

const BREADCRUMBS: Crumb[] = [
    { label: 'Kontrak', href: route('management.contracts.index') },
    { label: 'Detail Kontrak', href: '#' },
];

type ContractDTO = {
    id: string;
    number?: string | null;
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

type HandoverSummary = {
    id: string;
    type: string;
    status: string;
    recorded_at?: string | null;
    notes?: string | null;
    acknowledged: boolean;
    acknowledged_at?: string | null;
    acknowledge_note?: string | null;
    disputed: boolean;
    disputed_at?: string | null;
    dispute_note?: string | null;
    attachments: string[];
    meta?: {
        redone?: boolean;
        redo?: { checkin?: boolean; checkout?: boolean };
        [key: string]: unknown;
    };
};

export default function ContractDetailPage(props: {
    contract: ContractDTO;
    tenant: TenantDTO;
    room: RoomDTO;
    invoices: Paginator<InvoiceItem>;
}) {
    const { contract, tenant, room, invoices } = props;
    const [handoverList, setHandoverList] = React.useState<HandoverSummary[]>(
        [],
    );
    const [checkoutOpen, setCheckoutOpen] = React.useState(false);
    const [checkinOpen, setCheckinOpen] = React.useState(false);
    const [loadingHandover, setLoadingHandover] = React.useState(false);

    const [handoverDialog, setHandoverDialog] = React.useState<{
        open: boolean;
        data: HandoverSummary | null;
    }>({ open: false, data: null });

    const currentHandover = handoverDialog.data;

    const openHandover = (handover: HandoverSummary) =>
        setHandoverDialog({ open: true, data: handover });

    const normalizeHandovers = React.useCallback(
        (items?: HandoverSummary[]) =>
            (items ?? []).map((item) => ({
                ...item,
                attachments: Array.isArray(item.attachments)
                    ? item.attachments
                    : [],
            })),
        [],
    );

    const reloadHandovers = React.useCallback(async () => {
        try {
            setLoadingHandover(true);
            const res = await fetch(
                route('management.contracts.handovers.index', {
                    contract: contract.id,
                }),
                { headers: { Accept: 'application/json' } },
            );
            if (res.ok) {
                const json = (await res.json()) as {
                    handovers?: HandoverSummary[];
                };
                setHandoverList(normalizeHandovers(json.handovers));
            }
        } finally {
            setLoadingHandover(false);
        }
    }, [contract.id, normalizeHandovers]);

    React.useEffect(() => {
        void reloadHandovers();
    }, [reloadHandovers]);

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
                                    <div className="text-muted-foreground">
                                        Tanggal Penagihan
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
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                className="js-copy cursor-pointer break-words hover:underline"
                                                data-clipboard-text={
                                                    tenant.email
                                                }
                                                title="Klik untuk salin email"
                                            >
                                                {tenant.email}
                                            </span>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Telepon
                                    </div>
                                    <div className="text-right">
                                        {tenant?.phone ? (
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                className="js-copy cursor-pointer break-words hover:underline"
                                                data-clipboard-text={
                                                    tenant.phone
                                                }
                                                title="Klik untuk salin nomor telepon"
                                            >
                                                {tenant.phone}
                                            </span>
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

            {/* Serah Terima */}
            <Card className="mt-6">
                <CardHeader className="pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Serah Terima</CardTitle>
                        <div className="mt-1 text-xs text-muted-foreground">
                            Pembuatan Check‑in/Check‑out tersedia dari halaman
                            Kontrak (index) melalui menu Aksi.
                        </div>
                    </div>

                    {(() => {
                        const latestCheckin = handoverList.find(
                            (h) => h.type === 'checkin',
                        );
                        const latestCheckout = handoverList.find(
                            (h) => h.type === 'checkout',
                        );
                        const lastIn = String(
                            latestCheckin?.status || '',
                        ).toLowerCase();
                        const lastOut = String(
                            latestCheckout?.status || '',
                        ).toLowerCase();
                        const statusNow = String(
                            contract.status || '',
                        ).toLowerCase();

                        // Check‑in tersedia jika belum pernah confirmed dan kontrak belum selesai/dibatalkan
                        const canCheckin =
                            lastIn !== 'confirmed' &&
                            !['completed', 'cancelled', 'canceled'].includes(
                                statusNow,
                            );

                        // Checkout mengikuti aturan eksisting
                        const canCheckout =
                            (statusNow === 'active' ||
                                (statusNow === 'completed' &&
                                    lastOut === 'disputed')) &&
                            lastIn === 'confirmed' &&
                            lastOut !== 'pending' &&
                            lastOut !== 'confirmed';

                        if (!canCheckin && !canCheckout) return null;
                        return (
                            <Can any={['handover.create']}>
                                <div className="flex items-center gap-2">
                                    {canCheckin ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setCheckinOpen(true)}
                                        >
                                            Check‑in
                                        </Button>
                                    ) : null}
                                    {canCheckout ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() =>
                                                setCheckoutOpen(true)
                                            }
                                        >
                                            Check‑out
                                        </Button>
                                    ) : null}
                                </div>
                            </Can>
                        );
                    })()}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-background">
                                <TableRow className="align-middle">
                                    <TableHead className="min-w-[120px] px-4 py-3 text-left align-middle">
                                        Jenis
                                    </TableHead>
                                    <TableHead className="min-w-[180px] px-4 py-3 text-left align-middle">
                                        Waktu
                                    </TableHead>
                                    <TableHead className="min-w-[140px] px-4 py-3 text-left align-middle">
                                        Status
                                    </TableHead>
                                    <TableHead className="min-w-[140px] px-4 py-3 text-right align-middle">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingHandover ? (
                                    <>
                                        {[0, 1, 2].map((i) => (
                                            <TableRow key={`sk-${i}`}>
                                                <TableCell>
                                                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-7 w-24 animate-pulse rounded bg-muted" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </>
                                ) : handoverList.length ? (
                                    handoverList.map((h) => {
                                        return (
                                            <TableRow
                                                key={h.id}
                                                className="align-middle"
                                            >
                                                <TableCell className="px-4 py-3 align-middle capitalize">
                                                    {h.type}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 align-middle">
                                                    {formatDate(
                                                        h.recorded_at,
                                                        true,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 align-middle">
                                                    <Badge variant="outline">
                                                        {h.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right align-middle">
                                                    <div className="flex items-center justify-end">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    aria-label="Aksi Serah Terima"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-56"
                                                            >
                                                                <DropdownMenuLabel>
                                                                    Aksi
                                                                </DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        openHandover(
                                                                            h,
                                                                        )
                                                                    }
                                                                >
                                                                    Lihat detail
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow className="align-middle">
                                        <TableCell
                                            colSpan={4}
                                            className="px-4 py-8 text-center align-middle text-sm text-muted-foreground"
                                        >
                                            Belum ada riwayat serah terima.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <HandoverCreate
                open={checkoutOpen}
                onOpenChange={setCheckoutOpen}
                contractId={contract.id}
                mode="checkout"
                onSaved={async () => {
                    router.reload({ only: ['contract'] });
                    await reloadHandovers();
                }}
            />
            <HandoverCreate
                open={checkinOpen}
                onOpenChange={setCheckinOpen}
                contractId={contract.id}
                mode="checkin"
                onSaved={async () => {
                    router.reload({ only: ['contract'] });
                    await reloadHandovers();
                }}
            />
            <HandoverDetail
                open={handoverDialog.open}
                onOpenChange={(o) =>
                    setHandoverDialog((s) => ({ ...s, open: o }))
                }
                handover={currentHandover}
                onRedo={(mode) => {
                    setHandoverDialog((s) => ({ ...s, open: false }));
                    if (mode === 'checkin') setCheckinOpen(true);
                    else setCheckoutOpen(true);
                }}
            />
        </AuthLayout>
    );
}
