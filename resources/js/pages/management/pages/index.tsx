import { router, usePage } from '@inertiajs/react';
import { Filter, Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableServer } from '@/components/ui/data-table-server';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import type { PageProps } from '@/types';

import { createColumns, type PageSectionItem } from './tables/columns';

type Props = {
    pageSections: {
        data: PageSectionItem[];
        total: number;
        from: number | null;
        to: number | null;
        current_page: number;
        last_page: number;
        per_page: number;
    } | null;
    query: {
        page?: number;
        perPage?: number;
        sort?: string | null;
        dir?: 'asc' | 'desc' | null;
        search?: string | null;
        fpage?: string | null;
        [key: string]: unknown;
    };
    options: {
        pages: Array<{ value: string; label: string }>;
    };
};

export default function PagesIndex() {
    const { t: tPages } = useTranslation('management/pages');
    const { t } = useTranslation();
    const { props } = usePage<PageProps<Props>>();
    const { pageSections: paginator, query, options } = props;

    const rows = React.useMemo(() => paginator?.data ?? [], [paginator?.data]);

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const [processing, setProcessing] = React.useState(false);
    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: paginator ?? undefined,
        initial: query,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const columns = React.useMemo(
        () =>
            createColumns({
                onEdit: (row) =>
                    router.get(
                        route('management.pages.edit', [row.page, row.section]),
                    ),
            }),
        [],
    );

    // Add Section dialog state
    const [open, setOpen] = React.useState(false);
    const [newSection, setNewSection] = React.useState('');
    const [targetPage, setTargetPage] = React.useState<string>(() =>
        q.fpage ? String(q.fpage) : options.pages[0]?.value || 'home',
    );

    const createSection = React.useCallback(() => {
        const s = newSection.trim();
        const p = String(targetPage || 'home');
        if (!s) return;
        setOpen(false);
        setTimeout(() => {
            router.get(route('management.pages.edit', [p, s]));
        }, 10);
    }, [newSection, targetPage]);

    return (
        <AppLayout pageTitle={tPages('title')} pageDescription={tPages('desc')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Filter className="h-4 w-4" /> {t('common.filter')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                <div className="w-full max-w-[240px]">
                                    <Label className="text-muted-foreground mb-1 block text-xs">
                                        {tPages('filters.page')}
                                    </Label>
                                    <Select
                                        value={
                                            q.fpage ? String(q.fpage) : 'all'
                                        }
                                        onValueChange={(v) =>
                                            onQueryChange({
                                                page: 1,
                                                fpage: v === 'all' ? null : v,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={tPages(
                                                    'filters.select_page',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('common.all')}
                                            </SelectItem>
                                            {options.pages.map((p) => (
                                                <SelectItem
                                                    key={p.value}
                                                    value={p.value}
                                                >
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />{' '}
                                        {tPages('actions.add_section')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {tPages('actions.add_section')}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                {tPages('filters.page')}
                                            </label>
                                            <Select
                                                value={targetPage}
                                                onValueChange={(v) =>
                                                    setTargetPage(v)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={tPages(
                                                            'filters.select_page',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.pages.map((p) => (
                                                        <SelectItem
                                                            key={p.value}
                                                            value={p.value}
                                                        >
                                                            {p.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                {tPages('new_section.name')}
                                            </label>
                                            <Input
                                                value={newSection}
                                                onChange={(e) =>
                                                    setNewSection(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={tPages(
                                                    'new_section.placeholder',
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => setOpen(false)}
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={createSection}
                                            >
                                                {t('common.submit')}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <DataTableServer<PageSectionItem, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="section"
                            searchPlaceholder={t(
                                'datatable.search_placeholder',
                            )}
                            sort={q.sort as string | null}
                            dir={q.dir as 'asc' | 'desc' | null}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tPages('table.empty')}
                            showRefresh={false}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
