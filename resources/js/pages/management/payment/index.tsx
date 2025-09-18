import { router, usePage } from '@inertiajs/react';
import { FilePlus2 } from 'lucide-react';
import React from 'react';

import AttachmentPreviewDialog from '@/components/attachment-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueryBag } from '@/components/ui/data-table-server';
import { DataTableServer } from '@/components/ui/data-table-server';
/* dialog moved into dedicated component */
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import VoidPaymentDialog from '@/pages/management/payment/dialogs/void';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import { formatIDR } from '@/lib/format';
import type {
    PaymentIndexPageProps as PageProps,
    PaymentRow,
} from '@/types/management';

import { createColumns } from './columns';
import PaymentDetailDialog from './dialogs/detail';
import ManualPaymentDialog from './dialogs/manual';
import PaymentReviewDialog from './dialogs/review';

const currency = (amount: number): string => formatIDR(amount);

export default function PaymentIndex() {
    const { props } = usePage<PageProps>();
    const paginator = props.payments;
    const rows: PaymentRow[] = React.useMemo(
        () => paginator?.data ?? [],
        [paginator?.data],
    );
    const methods = React.useMemo(
        () => props.options?.methods ?? [],
        [props.options?.methods],
    );
    const statuses = React.useMemo(
        () => props.options?.statuses ?? [],
        [props.options?.statuses],
    );

    const [processing, setProcessing] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [detail, setDetail] = React.useState<null | { id: string }>(null);
    const [preview, setPreview] = React.useState<null | {
        url: string;
        title?: string;
        description?: string;
        details?: { label: string; value: string }[];
    }>(null);
    const [review, setReview] = React.useState<null | { id: string }>(null);
    const [voiding, setVoiding] = React.useState<{
        target: PaymentRow | null;
        reason: string;
    }>({ target: null, reason: '' });

    const initialInvoiceNumber = React.useMemo(() => {
        const s = (props.query?.search || '').trim();
        return s && s.startsWith('INV-') ? s : '';
    }, [props.query?.search]);

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: paginator ?? null,
        initial: props.query,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });
    const statusValue: string =
        (q as QueryBag & { status?: string | null }).status ?? 'all';

    const invoiceCandidates = React.useMemo(
        () => props.invoiceCandidates ?? [],
        [props.invoiceCandidates],
    );

    return (
        <AuthLayout
            pageTitle="Pembayaran"
            pageDescription="Kelola pembayaran manual (cash/transfer), termasuk cicilan parsial dan cetak kwitansi."
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Daftar Pembayaran</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Lihat dan kelola semua pembayaran yang tercatat.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                <Select
                                    value={statusValue}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            status: v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Semua status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua status
                                        </SelectItem>
                                        {statuses.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setOpen(true)}
                                >
                                    <FilePlus2 className="mr-2 h-4 w-4" />{' '}
                                    Tambah Pembayaran
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<PaymentRow, unknown>
                            columns={createColumns({
                                onPrint: (row) =>
                                    window.open(
                                        route(
                                            'management.payments.print',
                                            row.id,
                                        ),
                                        '_blank',
                                    ),
                                onVoid: (row) => {
                                    if (row.status === 'Cancelled') return;
                                    setVoiding({ target: row, reason: '' });
                                },
                                onShowDetail: (row) =>
                                    setDetail({ id: row.id }),
                                onReview: (row) => setReview({ id: row.id }),
                                currency,
                            })}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="invoice"
                            searchPlaceholder="Cari invoice/penyewa…"
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText="Tidak ada pembayaran."
                            autoRefreshDefault="1m"
                            showRefresh={true}
                        />
                    </CardContent>
                </Card>
            </div>

            <ManualPaymentDialog
                open={open}
                onOpenChange={setOpen}
                methods={methods}
                initialInvoiceNumber={initialInvoiceNumber}
                invoiceCandidates={invoiceCandidates}
            />

            <PaymentDetailDialog
                target={detail}
                onClose={() => setDetail(null)}
            />
            <PaymentReviewDialog
                target={review}
                onClose={() => setReview(null)}
            />

            <AttachmentPreviewDialog
                open={!!preview}
                onOpenChange={(v) => {
                    if (!v) setPreview(null);
                }}
                url={preview?.url || ''}
                title={preview?.title}
                description={preview?.description}
                details={preview?.details || []}
            />

            <VoidPaymentDialog
                target={voiding.target}
                onOpenChange={(v) => {
                    if (!v) setVoiding({ target: null, reason: '' });
                }}
                processing={processing}
                onConfirm={(reason) => {
                    const p = voiding.target;
                    if (!p) return;
                    setProcessing(true);
                    router.post(
                        route('management.payments.void', p.id),
                        { reason },
                        {
                            onFinish: () => {
                                setProcessing(false);
                                setVoiding({ target: null, reason: '' });
                            },
                        },
                    );
                }}
            />
        </AuthLayout>
    );
}
