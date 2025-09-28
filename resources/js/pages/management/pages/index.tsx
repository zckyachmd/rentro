import { router, usePage } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Eye, XCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Can } from '@/components/acl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DataTableServer,
    type QueryBag,
} from '@/components/ui/data-table-server';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { PageProps as AppPageProps } from '@/types';

import { createColumns } from './components/columns';
import type { PageItem } from './types';

type PageIndexProps = {
    pages: {
        data: PageItem[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number | null;
        to: number | null;
    };
    query?: QueryBag;
};

export default function PagesIndex() {
    const { t } = useTranslation();
    const { t: tPages } = useTranslation('management/pages');
    const { props } = usePage<
        AppPageProps<{
            pages: PageIndexProps['pages'];
            query?: QueryBag;
        }>
    >();
    const paginator = props.pages;
    // Simplified mode: hide create/delete flows for a fixed set of pages
    const SIMPLE_MODE = true;
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [slug, setSlug] = useState('');
    const [confirmDel, setConfirmDel] = useState<{
        open: boolean;
        item: PageItem | null;
    }>({ open: false, item: null });
    const [confirmPublish, setConfirmPublish] = useState<{
        open: boolean;
        item: PageItem | null;
        allPublished: boolean;
    }>({ open: false, item: null, allPublished: false });

    const rows: PageItem[] = useMemo(
        () => paginator?.data ?? [],
        [paginator?.data],
    );

    const currentPath = useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );
    const [processing, setProcessing] = useState(false);
    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: paginator ?? null,
        initial: props.query,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });
    // Simplified: no status filter, no publish/unpublish actions
    const statusOptions: Array<{ value: string; label: string }> = [];

    /* legacy columns removed (replaced by computedColumns) */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const __columns_legacy_placeholder = useMemo(() => {
        return [
            {
                id: 'slug',
                accessorKey: 'slug',
                header: tPages('columns.slug'),

                cell: ({ row }: any) => (
                    <a
                        className="underline"
                        href={route('management.pages.edit', {
                            page: row.original.id,
                        })}
                    >
                        {row.original.slug}
                    </a>
                ),
            },
            {
                id: 'locales',
                header: tPages('columns.locales'),

                cell: ({ row }: any) => {
                    const list = (row.original.locales || [])
                        .slice()
                        .sort((a: any, b: any) =>
                            a.locale.localeCompare(b.locale),
                        );
                    if (list.length === 0)
                        return <span className="text-muted-foreground">-</span>;
                    return (
                        <div className="flex flex-wrap gap-1">
                            {list.map((l: any) => {
                                const variant =
                                    l.status === 'published'
                                        ? 'default'
                                        : l.status === 'scheduled'
                                          ? 'secondary'
                                          : l.status === 'archived'
                                            ? 'outline'
                                            : 'outline';
                                return (
                                    <Badge
                                        key={l.id}
                                        variant={
                                            variant as
                                                | 'default'
                                                | 'secondary'
                                                | 'destructive'
                                                | 'outline'
                                        }
                                    >
                                        {l.locale.toUpperCase()}: {l.status}@v
                                        {l.version}
                                    </Badge>
                                );
                            })}
                        </div>
                    );
                },
            },
            {
                id: 'updated_at',
                accessorKey: 'updated_at',
                header: tPages('columns.updated_at'),

                cell: ({ row }: any) =>
                    new Date(row.original.updated_at).toLocaleString(),
            },
            {
                id: 'actions',
                header: tPages('columns.actions'),

                cell: ({ row }: any) => {
                    const it = row.original;
                    return (
                        <div className="flex items-center justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={t('common.actions')}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuLabel>
                                        {t('common.actions')}
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            (window.location.href = route(
                                                'management.pages.edit',
                                                { page: it.id },
                                            ))
                                        }
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />{' '}
                                        {t('common.edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            window.open(
                                                route('public.pages.show', {
                                                    slug: it.slug,
                                                }),
                                                '_blank',
                                            )
                                        }
                                    >
                                        <Eye className="mr-2 h-4 w-4" />{' '}
                                        {t('common.view_detail')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <span className="flex items-center">
                                                <Eye className="mr-2 h-4 w-4" />{' '}
                                                {tPages('actions.preview')}
                                            </span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            {it.locales?.length ? (
                                                it.locales
                                                    .slice()
                                                    .sort((a: any, b: any) =>
                                                        a.locale.localeCompare(
                                                            b.locale,
                                                        ),
                                                    )
                                                    .map((l: any) => (
                                                        <DropdownMenuItem
                                                            key={l.id}
                                                            onClick={async () => {
                                                                try {
                                                                    const res =
                                                                        await fetch(
                                                                            route(
                                                                                'management.pages.preview',
                                                                                {
                                                                                    page: it.id,
                                                                                    locale: l.locale,
                                                                                },
                                                                            ),
                                                                        );
                                                                    if (!res.ok)
                                                                        return toast.error(
                                                                            t(
                                                                                'common.preview_not_available',
                                                                            ),
                                                                        );
                                                                    const d: {
                                                                        url?: string;
                                                                    } =
                                                                        await res
                                                                            .json()
                                                                            .catch(
                                                                                () =>
                                                                                    ({}) as {
                                                                                        url?: string;
                                                                                    },
                                                                            );
                                                                    const url =
                                                                        d?.url;
                                                                    if (url)
                                                                        window.open(
                                                                            url,
                                                                            '_blank',
                                                                        );
                                                                    else
                                                                        toast.error(
                                                                            t(
                                                                                'common.preview_not_available',
                                                                            ),
                                                                        );
                                                                } catch {
                                                                    toast.error(
                                                                        t(
                                                                            'common.preview_not_available',
                                                                        ),
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {l.locale.toUpperCase()}{' '}
                                                            • {l.status}@v
                                                            {l.version}
                                                        </DropdownMenuItem>
                                                    ))
                                            ) : (
                                                <DropdownMenuItem disabled>
                                                    -
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <span className="flex items-center">
                                                <CheckCircle2 className="mr-2 h-4 w-4" />{' '}
                                                {tPages('actions.publish')}
                                            </span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            {it.locales
                                                .slice()
                                                .sort((a: any, b: any) =>
                                                    a.locale.localeCompare(
                                                        b.locale,
                                                    ),
                                                )
                                                .map((l: any) => {
                                                    const isPublished =
                                                        l.status ===
                                                        'published';
                                                    return (
                                                        <DropdownMenuItem
                                                            key={l.id}
                                                            onClick={async () => {
                                                                try {
                                                                    const res =
                                                                        await fetch(
                                                                            route(
                                                                                isPublished
                                                                                    ? 'management.pages.unpublish'
                                                                                    : 'management.pages.publish',
                                                                                {
                                                                                    page: it.id,
                                                                                    locale: l.locale,
                                                                                },
                                                                            ),
                                                                            {
                                                                                method: 'POST',
                                                                                headers:
                                                                                    {
                                                                                        'X-CSRF-TOKEN':
                                                                                            (
                                                                                                document.querySelector(
                                                                                                    'meta[name="csrf-token"]',
                                                                                                ) as HTMLMetaElement | null
                                                                                            )
                                                                                                ?.content ??
                                                                                            '',
                                                                                        'X-Requested-With':
                                                                                            'XMLHttpRequest',
                                                                                    },
                                                                            },
                                                                        );
                                                                    const data =
                                                                        await res
                                                                            .json()
                                                                            .catch(
                                                                                () =>
                                                                                    ({}) as {
                                                                                        url?: string;
                                                                                    },
                                                                            );
                                                                    if (
                                                                        res.ok
                                                                    ) {
                                                                        toast.success(
                                                                            data?.message ||
                                                                                (isPublished
                                                                                    ? tPages(
                                                                                          'toasts.unpublished',
                                                                                      )
                                                                                    : tPages(
                                                                                          'toasts.published',
                                                                                      )),
                                                                        );
                                                                        onQueryChange(
                                                                            {
                                                                                page: 1,
                                                                            },
                                                                        );
                                                                    } else {
                                                                        toast.error(
                                                                            data?.message ||
                                                                                (isPublished
                                                                                    ? tPages(
                                                                                          'toasts.failed_unpublish',
                                                                                      )
                                                                                    : tPages(
                                                                                          'toasts.failed_publish',
                                                                                      )),
                                                                        );
                                                                    }
                                                                } catch {
                                                                    toast.error(
                                                                        isPublished
                                                                            ? tPages(
                                                                                  'toasts.failed_unpublish',
                                                                              )
                                                                            : tPages(
                                                                                  'toasts.failed_publish',
                                                                              ),
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {isPublished ? (
                                                                <span className="flex items-center">
                                                                    <XCircle className="mr-2 h-4 w-4" />{' '}
                                                                    {l.locale.toUpperCase()}{' '}
                                                                    •{' '}
                                                                    {tPages(
                                                                        'actions.unpublish',
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center">
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" />{' '}
                                                                    {l.locale.toUpperCase()}{' '}
                                                                    •{' '}
                                                                    {tPages(
                                                                        'actions.publish',
                                                                    )}
                                                                </span>
                                                            )}
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuSeparator />
                                    <Can all={['page.delete']}>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() =>
                                                setConfirmDel({
                                                    open: true,
                                                    item: it,
                                                })
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('common.delete')}
                                        </DropdownMenuItem>
                                    </Can>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ];
    }, [tPages, t, onQueryChange]);
    void __columns_legacy_placeholder;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const computedColumns = useMemo(
        () =>
            createColumns({
                t,
                tPages,
                onEdit: (row) =>
                    (window.location.href = route('management.pages.edit', {
                        page: row.id,
                    })),
            }),
        [t, tPages],
    );
    // No publish toggle in simplified mode

    const createPage = async () => {
        if (!slug) return;
        const res = await fetch(route('management.pages.store'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ slug }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            toast.success(data?.message || tPages('toasts.created'));
            setSlug('');
            setCreateOpen(false);
            onQueryChange({ page: 1 });
        } else {
            toast.error(data?.message || tPages('toasts.failed_create'));
        }
    };

    return (
        <AppLayout pageTitle={tPages('title')} pageDescription={tPages('desc')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{tPages('title')}</CardTitle>
                        <CardDescription>{tPages('desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-end gap-2" />
                            {!SIMPLE_MODE && (
                                <Can all={['page.create']}>
                                    <Button
                                        size="sm"
                                        onClick={() => setCreateOpen(true)}
                                    >
                                        {/* Create page (hidden in SIMPLE_MODE) */}
                                        {tPages('actions.create')}
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<PageItem, unknown>
                            columns={computedColumns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="slug"
                            searchPlaceholder={tPages(
                                'placeholders.search_slug',
                            )}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tPages('empty')}
                            showRefresh
                            autoRefreshDefault="off"
                        />
                    </CardContent>
                </Card>
            </div>

            {!SIMPLE_MODE && (
                <Dialog
                    open={createOpen}
                    onOpenChange={(v) => {
                        setCreateOpen(v);
                        if (!v) {
                            setSlug('');
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{tPages('actions.create')}</DialogTitle>
                            <DialogDescription>{tPages('desc')}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 text-sm">
                            <div className="grid gap-1">
                                <Label htmlFor="slug">
                                    {tPages('columns.slug')}
                                </Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder={tPages('placeholders.slug')}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                disabled={
                                    creating ||
                                    !/^([a-z0-9]+(?:-[a-z0-9]+)*)$/.test(slug)
                                }
                                onClick={async () => {
                                    if (creating) return;
                                    setCreating(true);
                                    await createPage();
                                    setCreating(false);
                                }}
                            >
                                {creating
                                    ? tPages('actions.creating')
                                    : tPages('actions.create')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {!SIMPLE_MODE && (
            {/* Delete flow removed in simplified mode */}
            )}

            {/* Publish/Unpublish flow removed in simplified mode */}
        </AppLayout>
    );
}
