import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { FilePlus2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueryBag } from '@/components/ui/data-table-server';
import { DataTableServer } from '@/components/ui/data-table-server';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import CancelInvoiceDialog from '@/features/invoice/dialogs/cancel-dialog';
import InvoiceDetailDialog from '@/features/invoice/dialogs/detail-dialog';
import ExtendDueDialog from '@/features/invoice/dialogs/extend-due-dialog';
import GenerateInvoiceDialog from '@/features/invoice/dialogs/generate-dialog';
import { createColumns } from '@/features/invoice/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import type {
    ManagementCancelState as CancelState,
    ManagementExtendState as ExtendState,
    InvoiceRow,
    ManagementInvoicePageProps as PageProps,
} from '@/types/management';

export default function InvoiceIndex() {
    const { t, i18n } = useTranslation();
    const { t: tInvoice } = useTranslation('management/invoice');
    const { props } = usePage<InertiaPageProps & PageProps>();
    const paginator = props.invoices;
    const rows: InvoiceRow[] = React.useMemo(
        () => paginator?.data ?? [],
        [paginator?.data],
    );
    const contracts = React.useMemo(
        () => props.options?.contracts ?? [],
        [props.options?.contracts],
    );
    const statuses = React.useMemo(
        () => props.options?.statuses ?? [],
        [props.options?.statuses],
    );

    const [processing, setProcessing] = React.useState(false);
    const [genOpen, setGenOpen] = React.useState(false);

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

    // CancelState, ExtendState moved to types

    const [cancel, setCancel] = React.useState<CancelState>({
        target: null,
        reason: '',
    });
    const [extend, setExtend] = React.useState<ExtendState>({
        target: null,
        dueDate: '',
        reason: '',
    });

    const defaultTomorrow = React.useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }, []);

    const [detail, setDetail] = React.useState<{
        id: string;
        number: string;
    } | null>(null);
    const lang = i18n.language;
    const tableColumns = React.useMemo(() => {
        void lang;
        return createColumns<InvoiceRow>({
            onCancel: (inv) => setCancel({ target: inv, reason: '' }),
            onShowDetail: (inv) =>
                setDetail({ id: inv.id, number: inv.number }),
            onExtendDue: (inv) =>
                setExtend({
                    target: inv,
                    dueDate: defaultTomorrow,
                    reason: '',
                }),
            onPrint: (inv) => {
                const url = route('management.invoices.print', inv.id);
                if (typeof window !== 'undefined') {
                    window.open(url, '_blank');
                }
            },
        });
    }, [defaultTomorrow, lang]);

    return (
        <AuthLayout
            pageTitle={tInvoice('title')}
            pageDescription={tInvoice('list.title')}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{tInvoice('list.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                <div className="flex items-center gap-2">
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
                                            <SelectValue
                                                placeholder={t(
                                                    'common.all_statuses',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('common.all_statuses')}
                                            </SelectItem>
                                            {statuses.map((s) => {
                                                const slug = String(s)
                                                    .trim()
                                                    .toLowerCase()
                                                    .replace(/\s+/g, '_');
                                                return (
                                                    <SelectItem
                                                        key={s}
                                                        value={s}
                                                    >
                                                        {t(
                                                            `invoice.status.${slug}`,
                                                            {
                                                                ns: 'enum',
                                                                defaultValue:
                                                                    String(s),
                                                            },
                                                        )}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setGenOpen(true)}
                                >
                                    <FilePlus2 className="mr-2 h-4 w-4" />{' '}
                                    {tInvoice('generate.title')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<InvoiceRow, unknown>
                            columns={tableColumns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="number"
                            searchPlaceholder={t('nav.search.placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tInvoice('list.empty')}
                            autoRefreshDefault="1m"
                            showRefresh={true}
                        />
                    </CardContent>
                </Card>
            </div>

            <GenerateInvoiceDialog
                open={genOpen}
                onOpenChange={setGenOpen}
                contracts={contracts}
            />

            <CancelInvoiceDialog
                target={cancel.target}
                onOpenChange={(v) => {
                    if (!v) setCancel({ target: null, reason: '' });
                }}
                onConfirm={(reason) => {
                    const inv = cancel.target;
                    if (!inv) return;
                    setProcessing(true);
                    router.post(
                        route('management.invoices.cancel', inv.id),
                        { reason },
                        {
                            preserveScroll: true,
                            onFinish: () => {
                                setProcessing(false);
                                setCancel({ target: null, reason: '' });
                            },
                        },
                    );
                }}
            />

            <InvoiceDetailDialog
                target={detail}
                onClose={() => setDetail(null)}
            />

            <ExtendDueDialog
                target={extend.target}
                open={!!extend.target}
                initialDueDate={defaultTomorrow}
                onOpenChange={(v) => {
                    if (!v)
                        setExtend({ target: null, dueDate: '', reason: '' });
                }}
                processing={processing}
                onConfirm={(dueDate, reason) => {
                    const inv = extend.target;
                    if (!inv) return;
                    setProcessing(true);
                    router.post(
                        route('management.invoices.extendDue', inv.id),
                        { due_date: dueDate, reason },
                        {
                            preserveScroll: true,
                            onFinish: () => {
                                setProcessing(false);
                                setExtend({
                                    target: null,
                                    dueDate: '',
                                    reason: '',
                                });
                            },
                        },
                    );
                }}
            />
        </AuthLayout>
    );
}
