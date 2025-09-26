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
import { useTranslation } from 'react-i18next';

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
import AppLayout from '@/layouts/app-layout';
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

export default function ContractDetailPage(props: {
    contract: ContractDTO;
    tenant: TenantDTO;
    room: RoomDTO;
    invoices: Paginator<InvoiceItem>;
    handover?: HandoverOptions;
}) {
    const { t } = useTranslation();
    const { t: tContract } = useTranslation('management/contract');
    const { t: tEnum } = useTranslation('enum');
    const { contract, tenant, room, invoices, handover } = props;
    const BREADCRUMBS: Crumb[] = [
        {
            label: tContract('list.title'),
            href: route('management.contracts.index'),
        },
        { label: tContract('detail.title', 'Contract Detail'), href: '#' },
    ];

    return (
        <AppLayout
            pageTitle={tContract('detail.title_format', {
                number: contract.number ?? contract.id,
            })}
            pageDescription={tContract('list.desc')}
            breadcrumbs={BREADCRUMBS}
        >
            <div className="mb-2 flex items-center justify-end gap-3">
                <div className="text-muted-foreground hidden text-xs md:block">
                    {t('common.last_updated')}{' '}
                    {formatDate(contract.updated_at, true)}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Informasi Kontrak */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle>{tContract('info_title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-lg border p-4">
                                <div className="text-muted-foreground mb-2 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{t('common.period')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        {t('common.number')}
                                    </div>
                                    <div className="text-right font-mono">
                                        {contract.number ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.start')}
                                    </div>
                                    <div className="text-right">
                                        {formatDate(contract.start_date)}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.end')}
                                    </div>
                                    <div className="text-right">
                                        {formatDate(contract.end_date)}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.billing_period')}
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline">
                                            {tEnum(
                                                `billing_period.${contract.billing_period}`,
                                                {
                                                    defaultValue:
                                                        contract.billing_period,
                                                },
                                            )}
                                        </Badge>
                                    </div>
                                    {contract.auto_renew ? (
                                        <>
                                            <div className="text-muted-foreground">
                                                {t('common.billing_day')}
                                            </div>
                                            <div className="text-right">
                                                {contract.billing_day ?? '-'}
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="text-muted-foreground mb-2 flex items-center gap-2">
                                    <Repeat className="h-4 w-4" />
                                    <span>{tContract('settings')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        {t('common.status')}
                                    </div>
                                    <div className="text-right">
                                        <Badge
                                            variant={variantForContractStatus(
                                                contract.status,
                                            )}
                                        >
                                            {tEnum(
                                                `contract.status.${contract.status}`,
                                                {
                                                    defaultValue:
                                                        contract.status,
                                                },
                                            )}
                                        </Badge>
                                    </div>
                                    <div className="text-muted-foreground">
                                        {tContract('auto_renew')}
                                    </div>
                                    <div className="text-right">
                                        {contract.auto_renew
                                            ? t('common.yes')
                                            : t('common.no')}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {tContract('paid_in_full')}
                                    </div>
                                    <div className="text-right">
                                        {contract.paid_in_full_at ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-muted-foreground text-xs">
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
                                    <div className="bg-muted/40 mt-3 rounded-md p-3 text-xs leading-relaxed">
                                        <div className="text-muted-foreground mb-1 flex items-center gap-2">
                                            <Info className="h-3.5 w-3.5" />
                                            <span>{t('common.note')}</span>
                                        </div>
                                        <div>{contract.notes}</div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="rounded-lg border p-4 md:col-span-2">
                                <div className="text-muted-foreground mb-2 flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    <span>{tContract('costs')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        {tContract('detail.costs.rent', 'Rent')}
                                    </div>
                                    <div className="text-right">
                                        {formatIDR(contract.rent_idr)}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {tContract(
                                            'detail.costs.deposit',
                                            'Deposit',
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {formatIDR(contract.deposit_idr)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Penyewa & Kamar */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>{tContract('tenant_room_title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <div className="space-y-3">
                            <div className="rounded-lg border p-4">
                                <div className="text-muted-foreground mb-2 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{t('common.tenant')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        {t('common.name')}
                                    </div>
                                    <div className="text-right">
                                        {tenant?.name ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.email')}
                                    </div>
                                    <div className="text-right">
                                        {tenant?.email ? (
                                            <CopyInline
                                                value={tenant.email}
                                                variant="link"
                                                className="break-words"
                                                successMessage={t(
                                                    'email_copied',
                                                    { ns: 'profile' },
                                                )}
                                            >
                                                {tenant.email}
                                            </CopyInline>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.phone')}
                                    </div>
                                    <div className="text-right">
                                        {tenant?.phone ? (
                                            <CopyInline
                                                value={tenant.phone}
                                                variant="link"
                                                className="break-words"
                                                successMessage={t(
                                                    'phone_copied',
                                                    { ns: 'profile' },
                                                )}
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
                                <div className="text-muted-foreground mb-2 flex items-center gap-2">
                                    <DoorOpen className="h-4 w-4" />
                                    <span>{t('common.room')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="text-muted-foreground">
                                        {t('common.number')}
                                    </div>
                                    <div className="text-right">
                                        {room?.number ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.name')}
                                    </div>
                                    <div className="text-right">
                                        {room?.name ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.building')}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 text-right">
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>
                                            {room?.building?.name ?? '-'}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.floor')}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 text-right">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        <span>{room?.floor?.level ?? '-'}</span>
                                    </div>
                                    <div className="text-muted-foreground">
                                        {t('common.type')}
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
                    <CardTitle>{t('invoice.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-background sticky top-0">
                                    <TableRow>
                                        <TableHead>
                                            {t('common.number')}
                                        </TableHead>
                                        <TableHead>
                                            {t('common.period')}
                                        </TableHead>
                                        <TableHead>
                                            {t('common.due_date')}
                                        </TableHead>
                                        <TableHead>
                                            {t('common.status')}
                                        </TableHead>
                                        <TableHead className="text-right">
                                            {t('common.amount')}
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
                                                            title={t(
                                                                'invoice.title',
                                                            )}
                                                        >
                                                            {inv.number}
                                                        </a>
                                                        <CopyInline
                                                            value={inv.number}
                                                            variant="icon"
                                                            size="sm"
                                                            title={t(
                                                                'invoice.copy_number',
                                                            )}
                                                            aria-label={t(
                                                                'invoice.copy_number',
                                                            )}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {(formatDate(
                                                        inv.period_start,
                                                    ) ?? '-') +
                                                        t('common.period_sep') +
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
                                                        {tEnum(
                                                            `invoice.status.${inv.status}`,
                                                            {
                                                                defaultValue:
                                                                    inv.status,
                                                            },
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatIDR(
                                                        inv.amount_idr,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-muted-foreground py-8 text-center text-sm"
                                            >
                                                {t('invoice.empty')}
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
        </AppLayout>
    );
}
