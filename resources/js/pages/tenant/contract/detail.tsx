import { router } from '@inertiajs/react';
import { CheckCircle2, Eye, MoreHorizontal, XCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AttachmentPreviewDialog from '@/components/attachment-preview';
import { Crumb } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TenantHandoverDetailDialog from '@/features/tenant/contract/dialogs/handover-detail-dialog';
import { useLengthRule } from '@/hooks/use-length-rule';
import AuthLayout from '@/layouts/auth-layout';
import { createAbort, getJson } from '@/lib/api';
import { formatDate, formatIDR } from '@/lib/format';
import {
    variantForContractStatus,
    variantForInvoiceStatus,
} from '@/lib/status';
import type {
    TenantHandover as DialogHandover,
    TenantContractDetailPageProps as PageProps,
    TenantHandover,
} from '@/types/tenant';

export default function TenantContractDetail(props: PageProps) {
    const { t } = useTranslation();
    const { t: tTenant } = useTranslation('tenant/contract');
    const { contract, invoices } = props;
    const [handovers, setHandovers] = React.useState<TenantHandover[]>([]);
    const [loadingHandover, setLoadingHandover] = React.useState(false);
    const [preview, setPreview] = React.useState<{
        open: boolean;
        url: string;
        title?: string;
    }>({ open: false, url: '' });
    const [dispute, setDispute] = React.useState<{
        open: boolean;
        id?: string;
        note: string;
        saving: boolean;
    }>({ open: false, note: '', saving: false });
    const disputeRule = useLengthRule(dispute.note, {
        min: 5,
        required: true,
        trim: true,
    });
    const [confirmAck, setConfirmAck] = React.useState<{
        open: boolean;
        id?: string;
        saving: boolean;
    }>({ open: false, saving: false });
    const [handoverDialog, setHandoverDialog] = React.useState<{
        open: boolean;
        data: TenantHandover | null;
    }>({ open: false, data: null });
    const openHandover = (handover: TenantHandover) =>
        setHandoverDialog({ open: true, data: handover });

    const normalizeHandovers = React.useCallback(
        (items?: TenantHandover[]) =>
            (items ?? []).map((item) => ({
                ...item,
                attachments: Array.isArray(item.attachments)
                    ? item.attachments
                    : [],
            })),
        [],
    );

    const loadHandovers = React.useCallback(async () => {
        const ctrl = createAbort();
        try {
            setLoadingHandover(true);
            const j = await getJson<{ handovers?: TenantHandover[] }>(
                route('tenant.contracts.handovers.index', {
                    contract: contract.id,
                }),
                { signal: ctrl.signal },
            );
            setHandovers(normalizeHandovers(j.handovers));
        } catch {
            // ignore
        } finally {
            if (!ctrl.signal.aborted) setLoadingHandover(false);
        }
    }, [contract.id, normalizeHandovers]);

    React.useEffect(() => {
        loadHandovers();
    }, [loadHandovers]);

    const breadcrumbs: Crumb[] = [
        {
            label: tTenant('breadcrumb.contracts'),
            href: route('tenant.contracts.index'),
        },
        { label: tTenant('breadcrumb.detail'), href: '#' },
    ];

    return (
        <AuthLayout
            pageTitle={tTenant('title_with_number', {
                number: contract.number ?? contract.id,
            })}
            pageDescription={tTenant('detail_desc')}
            breadcrumbs={breadcrumbs}
        >
            <div className="mb-2 flex items-center justify-end gap-3">
                <div className="text-muted-foreground hidden text-xs md:block">
                    {t('common.last_updated')}{' '}
                    {formatDate(contract.updated_at, true)}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{tTenant('info.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {t('common.room', 'Room')}
                            </div>
                            <div className="font-medium">
                                {contract.room?.number ?? '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {t('common.start')}
                            </div>
                            <div>
                                {contract.start_date
                                    ? formatDate(contract.start_date)
                                    : '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {t('common.end')}
                            </div>
                            <div>
                                {contract.end_date
                                    ? formatDate(contract.end_date)
                                    : '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {tTenant('rent')}
                            </div>
                            <div className="font-semibold">
                                {formatIDR(contract.rent_cents)}
                            </div>
                        </div>
                        {typeof contract.deposit_cents === 'number' && (
                            <div className="flex items-center justify-between">
                                <div className="text-muted-foreground">
                                    {tTenant('deposit')}
                                </div>
                                <div className="font-semibold">
                                    {formatIDR(contract.deposit_cents || 0)}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {tTenant('billing_period')}
                            </div>
                            <div>{contract.billing_period || '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {tTenant('billing_day')}
                            </div>
                            <div>{contract.billing_day ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {t('common.status')}
                            </div>
                            <div>
                                <Badge
                                    variant={variantForContractStatus(
                                        contract.status,
                                    )}
                                >
                                    {t(
                                        `contract.status.${String(
                                            contract.status || '',
                                        )
                                            .trim()
                                            .toLowerCase()
                                            .replace(/\s+/g, '_')}`,
                                        { defaultValue: contract.status },
                                    )}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {tTenant('room_info.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {t('common.name')}
                            </div>
                            <div>{contract.room?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {t('common.building')}
                            </div>
                            <div>{contract.room?.building?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {t('common.floor')}
                            </div>
                            <div>{contract.room?.floor?.level ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {t('common.type')}
                            </div>
                            <div>{contract.room?.type?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                {tTenant('room_info.room_price')}
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
                    <CardTitle>{t('invoice.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 border-b">
                                <tr>
                                    <th className="h-10 px-4 text-left">
                                        {t('common.number')}
                                    </th>
                                    <th className="h-10 px-4 text-left">{tTenant('period')}</th>
                                    <th className="h-10 px-4 text-left">
                                        {t('common.due_date')}
                                    </th>
                                    <th className="h-10 px-4 text-left">
                                        {t('common.status')}
                                    </th>
                                    <th className="h-10 px-4 text-right">
                                        {t('common.amount')}
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
                                                    title={t('contract.actions.view_invoices_page')}
                                                >
                                                    {inv.number}
                                                </a>
                                            </td>
                                            <td className="px-4 py-2">
                                                {(formatDate(
                                                    inv.period_start,
                                                ) ?? '-') +
                                                    t('common.period_sep') +
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
                                                    {t(
                                                        `invoice.status.${String(
                                                            inv.status || '',
                                                        )
                                                            .trim()
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/g,
                                                                '_',
                                                            )}`,
                                                        {
                                                            defaultValue:
                                                                inv.status,
                                                        },
                                                    )}
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
                                            className="text-muted-foreground px-4 py-8 text-center text-sm"
                                            colSpan={5}
                                        >
                                            {t('invoice.empty')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Serah Terima */}
            <Card className="mt-6">
                <CardHeader className="pb-3">
                    <CardTitle>{tTenant('handover.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 border-b">
                                <tr className="align-middle">
                                    <th className="h-11 px-4 text-left align-middle">
                                        {t('common.type')}
                                    </th>
                                    <th className="h-11 px-4 text-left align-middle">
                                        {t('common.time')}
                                    </th>
                                    <th className="h-11 px-4 text-left align-middle">
                                        {t('common.status')}
                                    </th>
                                    <th className="h-11 px-4 text-right align-middle">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {handovers.length ? (
                                    handovers.map((h) => (
                                        <tr
                                            key={h.id}
                                            className="border-b align-middle"
                                        >
                                            <td className="px-4 py-3 align-middle capitalize">
                                                {h.type}
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                {formatDate(
                                                    h.recorded_at,
                                                    true,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <Badge variant="outline">
                                                    {h.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right align-middle">
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
                                                aria-label={tTenant('handover.actions_aria')}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-56"
                                                        >
                                                            <DropdownMenuLabel>
                                                                {t(
                                                                    'common.actions',
                                                                )}
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openHandover(
                                                                        h,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                {t(
                                                                    'common.view_detail',
                                                                )}
                                                            </DropdownMenuItem>
                                                            {String(
                                                                h.status || '',
                                                            ).toLowerCase() ===
                                                                'pending' &&
                                                                !h.acknowledged &&
                                                                !h.disputed && (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setConfirmAck(
                                                                                {
                                                                                    open: true,
                                                                                    id: h.id,
                                                                                    saving: false,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                        Konfirmasi
                                                                    </DropdownMenuItem>
                                                                )}
                                                            {String(
                                                                h.status || '',
                                                            ).toLowerCase() ===
                                                                'pending' &&
                                                                !h.acknowledged &&
                                                                !h.disputed && (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setDispute(
                                                                                {
                                                                                    open: true,
                                                                                    id: h.id,
                                                                                    note: '',
                                                                                    saving: false,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Sanggah
                                                                    </DropdownMenuItem>
                                                                )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="align-middle">
                                        <td
                                            className="text-muted-foreground px-4 py-8 text-center align-middle text-sm"
                                            colSpan={4}
                                        >
                                            {loadingHandover
                                                ? t('common.loading')
                                                : tTenant('handover.empty')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={confirmAck.open}
                onOpenChange={(o) => setConfirmAck((p) => ({ ...p, open: o }))}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {tTenant('handover.confirm_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {tTenant('handover.confirm_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/40 text-muted-foreground rounded-md p-3 text-xs">
                        {tTenant('handover.confirm_note_prefix')}{' '}
                        <span className="text-foreground font-medium">
                            {tTenant('handover.confirmed')}
                        </span>
                        .
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setConfirmAck((p) => ({
                                    ...p,
                                    open: false,
                                }))
                            }
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={confirmAck.saving || !confirmAck.id}
                            onClick={async () => {
                                if (!confirmAck.id) return;
                                setConfirmAck((p) => ({
                                    ...p,
                                    saving: true,
                                }));
                                try {
                                    await new Promise<void>(
                                        (resolve, reject) => {
                                            router.post(
                                                route('tenant.handovers.ack', {
                                                    handover: confirmAck.id,
                                                }),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setConfirmAck({
                                                            open: false,
                                                            id: undefined,
                                                            saving: false,
                                                        });
                                                        setHandoverDialog({
                                                            open: false,
                                                            data: null,
                                                        });
                                                        router.reload({
                                                            only: ['contract'],
                                                        });
                                                        void loadHandovers();
                                                        resolve();
                                                    },
                                                    onError: () => {
                                                        setConfirmAck((p) => ({
                                                            ...p,
                                                            saving: false,
                                                        }));
                                                        reject(
                                                            new Error('Failed'),
                                                        );
                                                    },
                                                    onFinish: () => {
                                                        // no-op; handled above
                                                    },
                                                },
                                            );
                                        },
                                    );
                                } catch {
                                    setConfirmAck((p) => ({
                                        ...p,
                                        saving: false,
                                    }));
                                }
                            }}
                        >
                            {confirmAck.saving
                                ? t('common.saving')
                                : tTenant('handover.confirm_button')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <TenantHandoverDetailDialog
                open={handoverDialog.open}
                onOpenChange={(o) =>
                    setHandoverDialog((s) => ({ ...s, open: o }))
                }
                handover={handoverDialog.data as DialogHandover | null}
                onRefetch={() => loadHandovers()}
            />
            <AttachmentPreviewDialog
                open={preview.open}
                onOpenChange={(o) => setPreview((p) => ({ ...p, open: o }))}
                url={preview.url}
                title={preview.title}
            />
            <Dialog
                open={dispute.open}
                onOpenChange={(o) => setDispute((p) => ({ ...p, open: o }))}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                                {tTenant('handover.dispute_title')}
                        </DialogTitle>
                        <DialogDescription>
                                {tTenant('handover.dispute_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label>{t('common.note')}</Label>
                        <Textarea
                            rows={4}
                            value={dispute.note}
                            onChange={(e) =>
                                setDispute((p) => ({
                                    ...p,
                                    note: e.target.value,
                                }))
                            }
                                placeholder={tTenant('handover.dispute_placeholder')}
                        />
                        <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                            <span>
                                {tTenant('handover.dispute_hint')}
                            </span>
                            {disputeRule.length < 5 ? (
                                <span>{disputeRule.length}/5*</span>
                            ) : null}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setDispute((p) => ({ ...p, open: false }))
                            }
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={
                                dispute.saving ||
                                !dispute.id ||
                                !disputeRule.valid
                            }
                            onClick={async () => {
                                if (!dispute.id) return;
                                setDispute((p) => ({ ...p, saving: true }));
                                try {
                                    await new Promise<void>(
                                        (resolve, reject) => {
                                            router.post(
                                                route(
                                                    'tenant.handovers.dispute',
                                                    { handover: dispute.id },
                                                ),
                                                { note: dispute.note },
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setDispute({
                                                            open: false,
                                                            id: undefined,
                                                            note: '',
                                                            saving: false,
                                                        });
                                                        setHandoverDialog({
                                                            open: false,
                                                            data: null,
                                                        });
                                                        router.reload({
                                                            only: ['contract'],
                                                        });
                                                        void loadHandovers();
                                                        resolve();
                                                    },
                                                    onError: () => {
                                                        setDispute((p) => ({
                                                            ...p,
                                                            saving: false,
                                                        }));
                                                        reject(
                                                            new Error('Failed'),
                                                        );
                                                    },
                                                    onFinish: () => {
                                                        // no-op
                                                    },
                                                },
                                            );
                                        },
                                    );
                                } catch {
                                    setDispute((p) => ({
                                        ...p,
                                        saving: false,
                                    }));
                                }
                            }}
                        >
                            {dispute.saving
                                ? t('common.sending')
                                : tTenant('handover.dispute_submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthLayout>
    );
}
