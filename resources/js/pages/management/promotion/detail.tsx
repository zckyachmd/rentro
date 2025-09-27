import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Check, ChevronDown, Plus } from 'lucide-react';
import React from 'react';
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
import { Button, Button as UIButton } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CopyInline } from '@/components/ui/copy-inline';
import { DataTable } from '@/components/ui/data-table';
import {
    DataTableServer,
    type PaginatorMeta,
} from '@/components/ui/data-table-server';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppLayout } from '@/layouts';
import BulkCouponDialog from '@/pages/management/promotion/dialogs/bulk-coupon-dialog';
import UpsertActionDialog from '@/pages/management/promotion/dialogs/upsert-action-dialog';
import UpsertCouponDialog from '@/pages/management/promotion/dialogs/upsert-coupon-dialog';
import UpsertRuleDialog from '@/pages/management/promotion/dialogs/upsert-rule-dialog';
import UpsertScopeDialog from '@/pages/management/promotion/dialogs/upsert-scope-dialog';
import { createActionColumns } from '@/pages/management/promotion/tables/actions-columns';
import { createCouponColumns } from '@/pages/management/promotion/tables/coupons-columns';
import { createRuleColumns } from '@/pages/management/promotion/tables/rules-columns';
import { createScopeColumns } from '@/pages/management/promotion/tables/scopes-columns';

type PromotionDTO = {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    valid_from?: string | null;
    valid_until?: string | null;
    stack_mode: string;
    priority: number;
    default_channel?: string | null;
    require_coupon: boolean;
    is_active: boolean;
    is_listed?: boolean;
    tags: string[];
    tnc?: string[];
    how?: string[];
};

type PageProps = {
    promotion: PromotionDTO;
    scopes: any[];
    rules: any[];
    actions: any[];
    coupons: any[];
    options: {
        buildings: { value: string; label: string; description?: string }[];
        floors: { value: string; label: string; description?: string }[];
        room_types: { value: string; label: string; description?: string }[];
        rooms: { value: string; label: string; description?: string }[];
    };
};

export default function PromotionDetail() {
    const { props } = usePage<InertiaPageProps & PageProps>();
    const promotion = props.promotion;
    const { t } = useTranslation();
    const { t: tProm } = useTranslation('management/promotions');

    const [scopeDialog, setScopeDialog] = React.useState({
        open: false,
        item: null as any,
    });
    const [ruleDialog, setRuleDialog] = React.useState({
        open: false,
        item: null as any,
    });
    const [actionDialog, setActionDialog] = React.useState({
        open: false,
        item: null as any,
    });

    const [confirmDel, setConfirmDel] = React.useState<{
        kind: 'scope' | 'rule' | 'action' | 'coupon';
        id: number;
        open: boolean;
    }>({ kind: 'scope', id: 0, open: false });
    const [overwriteGuides, setOverwriteGuides] = React.useState(false);
    const [applyHow, setApplyHow] = React.useState(true);
    const [applyTnc, setApplyTnc] = React.useState(true);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewLoading, setPreviewLoading] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<{
        tnc: string[];
        how: string[];
    }>({ tnc: [], how: [] });

    const generateGuides = React.useCallback(
        (type: 'tnc' | 'how' | 'both', overwrite?: boolean) => {
            const params = new URLSearchParams();
            params.set('type', type);
            if (overwrite ?? overwriteGuides) params.set('overwrite', '1');
            const url =
                route('management.promotions.guides.generate', promotion.id) +
                '?' +
                params.toString();
            toast.info('Mengaplikasikan template guides…');
            router.post(
                url,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () =>
                        toast.success('Guides berhasil diterapkan'),
                    onError: () => toast.error('Gagal menerapkan guides'),
                },
            );
        },
        [overwriteGuides, promotion.id],
    );

    const generateFromSelection = React.useCallback(() => {
        // if overwrite OFF: merge both
        if (!overwriteGuides) {
            generateGuides('both', false);
            return;
        }
        // overwrite ON: apply based on checkboxes
        const type: 'tnc' | 'how' | 'both' =
            applyHow && applyTnc ? 'both' : applyHow ? 'how' : 'tnc';
        if (!applyHow && !applyTnc) return; // nothing selected
        generateGuides(type, true);
    }, [overwriteGuides, applyHow, applyTnc, generateGuides]);

    const openPreview = React.useCallback(async () => {
        setPreviewOpen(true);
        setPreviewLoading(true);
        try {
            const url = route(
                'management.promotions.guides.preview',
                promotion.id,
            );
            const res = await fetch(url, {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            setPreviewData({ tnc: json?.tnc ?? [], how: json?.how ?? [] });
            toast.success('Preview guides dimuat');
        } catch {
            setPreviewData({ tnc: [], how: [] });
            toast.error('Gagal memuat preview guides');
        } finally {
            setPreviewLoading(false);
        }
    }, [promotion.id]);

    const scopeColumns: ColumnDef<unknown>[] = React.useMemo(() => {
        const bmap = new Map(
            (props.options?.buildings ?? []).map((o) => [
                Number(o.value),
                o.label,
            ]),
        );
        const fmap = new Map(
            (props.options?.floors ?? []).map((o) => [
                Number(o.value),
                o.label,
            ]),
        );
        const rtmap = new Map(
            (props.options?.room_types ?? []).map((o) => [
                Number(o.value),
                o.label,
            ]),
        );
        const rmap = new Map(
            (props.options?.rooms ?? []).map((o) => [Number(o.value), o.label]),
        );
        return createScopeColumns({
            onEdit: (it) => setScopeDialog({ open: true, item: it }),
            onDelete: (it) =>
                setConfirmDel({ open: true, id: it.id, kind: 'scope' }),
            resolvers: {
                building: (id) =>
                    id ? (bmap.get(Number(id)) ?? String(id)) : '-',
                floor: (id) =>
                    id ? (fmap.get(Number(id)) ?? String(id)) : '-',
                room_type: (id) =>
                    id ? (rtmap.get(Number(id)) ?? String(id)) : '-',
                room: (id) => (id ? (rmap.get(Number(id)) ?? String(id)) : '-'),
            },
        });
    }, [props.options]);
    const ruleColumns: ColumnDef<unknown>[] = React.useMemo(
        () =>
            createRuleColumns({
                onEdit: (it) => setRuleDialog({ open: true, item: it }),
                onDelete: (it) =>
                    setConfirmDel({ open: true, id: it.id, kind: 'rule' }),
            }),
        [],
    );
    const actionColumns: ColumnDef<unknown>[] = React.useMemo(
        () =>
            createActionColumns({
                onEdit: (it) => setActionDialog({ open: true, item: it }),
                onDelete: (it) =>
                    setConfirmDel({ open: true, id: it.id, kind: 'action' }),
            }),
        [],
    );
    const couponColumns: ColumnDef<unknown>[] = React.useMemo(
        () =>
            createCouponColumns({
                onEdit: (it) => setCouponDialog({ open: true, item: it }),
                onDelete: (it) =>
                    setConfirmDel({ open: true, id: it.id, kind: 'coupon' }),
            }),
        [],
    );

    const [couponDialog, setCouponDialog] = React.useState({
        open: false,
        item: null as any,
    });
    const [bulkDialog, setBulkDialog] = React.useState(false);

    // Coupons server table state
    const [couponRows, setCouponRows] = React.useState<any[]>([]);
    const [couponMeta, setCouponMeta] = React.useState<PaginatorMeta | null>(
        null,
    );
    const [couponLoading, setCouponLoading] = React.useState(false);
    const couponQueryRef = React.useRef<{
        page?: number;
        per_page?: number;
        search?: string;
        sort?: string | null;
        dir?: 'asc' | 'desc' | null;
        active?: '1' | '0' | undefined;
        expiry?: 'valid' | 'expired' | undefined;
    }>({
        page: 1,
        per_page: 10,
        search: '',
        sort: null,
        dir: null,
        active: undefined,
        expiry: undefined,
    });

    const fetchCoupons = React.useCallback(
        async (
            q?: Partial<{
                page?: number;
                per_page?: number;
                search?: string;
                sort?: string | null;
                dir?: 'asc' | 'desc' | null;
                active?: '1' | '0';
                expiry?: 'valid' | 'expired';
            }>,
        ) => {
            const next = { ...couponQueryRef.current, ...(q ?? {}) };
            couponQueryRef.current = next;
            const params = new URLSearchParams();
            if (next.page) params.set('page', String(next.page));
            if (next.per_page) params.set('per_page', String(next.per_page));
            if (next.search) params.set('search', String(next.search));
            if (next.sort) params.set('sort', String(next.sort));
            if (next.dir) params.set('dir', String(next.dir));
            if (typeof next.active !== 'undefined')
                params.set('active', String(next.active));
            if (next.expiry) params.set('expiry', String(next.expiry));
            const url =
                route('management.promotions.coupons.list', promotion.id) +
                '?' +
                params.toString();
            setCouponLoading(true);
            try {
                const res = await fetch(url, {
                    headers: { Accept: 'application/json' },
                });
                const json = await res.json();
                setCouponRows(json?.data ?? []);
                setCouponMeta({
                    total: json?.total ?? 0,
                    from: json?.from ?? 0,
                    to: json?.to ?? 0,
                    current_page: json?.current_page ?? 1,
                    last_page: json?.last_page ?? 1,
                    per_page: json?.per_page ?? 20,
                });
            } catch {
                // ignore
            } finally {
                setCouponLoading(false);
            }
        },
        [promotion.id],
    );

    React.useEffect(() => {
        void fetchCoupons({ page: 1, per_page: 10 });
    }, [fetchCoupons]);

    return (
        <AppLayout
            pageTitle={`${tProm('title', 'Promotions')}: ${promotion.name}`}
            pageDescription={promotion.description || ''}
            actions={
                <UIButton
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        router.visit(route('management.promotions.index'))
                    }
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />{' '}
                    {t('common.back', 'Back')}
                </UIButton>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>
                            {t('common.overview', 'Overview')}
                        </CardTitle>
                        <CardDescription>
                            {tProm('desc', 'Manage discount promotions')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant={
                                    promotion.is_active
                                        ? 'secondary'
                                        : 'outline'
                                }
                            >
                                {t('common.active')}:{' '}
                                {promotion.is_active
                                    ? t('common.yes')
                                    : t('common.no')}
                            </Badge>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant={
                                            promotion.is_listed
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        className="cursor-help"
                                    >
                                        Listed:{' '}
                                        {promotion.is_listed
                                            ? t('common.yes')
                                            : t('common.no')}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tProm(
                                        'listed_hint',
                                        'Tersembunyi jika channel=manual atau tag mengandung private/hidden. Selain itu, ditampilkan.',
                                    )}
                                </TooltipContent>
                            </Tooltip>
                            <Badge
                                variant={
                                    promotion.require_coupon
                                        ? 'secondary'
                                        : 'outline'
                                }
                            >
                                {tProm('promotion.label.require_coupon')}:{' '}
                                {promotion.require_coupon
                                    ? t('common.yes')
                                    : t('common.no')}
                            </Badge>
                            <Badge variant="outline">
                                {tProm('promotion.label.stack_mode')}:{' '}
                                {tProm(
                                    `promotion.stack.${String(promotion.stack_mode).toLowerCase()}`,
                                    String(promotion.stack_mode),
                                )}
                            </Badge>
                            <Badge variant="outline">
                                {tProm('promotion.label.channel')}:{' '}
                                {promotion.default_channel
                                    ? tProm(
                                          `channel.${String(promotion.default_channel).toLowerCase()}`,
                                          promotion.default_channel,
                                      )
                                    : tProm('common.any')}
                            </Badge>
                            <Badge variant="outline">
                                {tProm('promotion.label.priority')}:{' '}
                                {promotion.priority}
                            </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid grid-cols-[140px_1fr] items-center gap-1 text-sm">
                                <div className="text-muted-foreground">
                                    {tProm('promotion.label.valid_from')}:
                                </div>
                                <div className="text-foreground">
                                    {promotion.valid_from || '-'}
                                </div>
                                <div className="text-muted-foreground">
                                    {tProm('promotion.label.valid_until')}:
                                </div>
                                <div className="text-foreground">
                                    {promotion.valid_until || '-'}
                                </div>
                                <div className="text-muted-foreground">
                                    {tProm('promotion.label.slug')}:
                                </div>
                                <div className="flex items-center gap-1">
                                    {promotion.slug ? (
                                        <>
                                            <span className="font-mono">
                                                {promotion.slug}
                                            </span>
                                            <CopyInline
                                                value={promotion.slug}
                                                as="span"
                                                variant="icon"
                                                size="xs"
                                            />
                                        </>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                                <div className="text-muted-foreground">
                                    {t('common.tags', 'Tags')}:
                                </div>
                                <div className="flex flex-wrap items-center gap-1">
                                    {Array.isArray(promotion.tags) &&
                                    promotion.tags.length > 0 ? (
                                        promotion.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">
                                                #{tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground">
                                            -
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Guides (T&C and How-To) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>
                            {tProm('section.guides.title', 'Guides')}
                        </CardTitle>
                        <CardDescription>
                            {tProm(
                                'section.guides.desc',
                                'Generate standard templates for T&C and How-To',
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <div className="mb-1 text-sm font-medium">
                                    {tProm(
                                        'guides.tnc_list',
                                        'Terms & Conditions',
                                    )}
                                </div>
                                <Textarea
                                    defaultValue={(
                                        props.promotion.tnc ?? []
                                    ).join('\n')}
                                    placeholder="One item per line"
                                    className="min-h-48 md:min-h-56"
                                    onBlur={(e) => {
                                        const lines = e.currentTarget.value
                                            .split(/\n+/)
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                        router.put(
                                            route(
                                                'management.promotions.update',
                                                promotion.id,
                                            ),
                                            { tnc: lines },
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
                                        );
                                    }}
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium">
                                    {tProm('guides.how_list', 'How-To Steps')}
                                </div>
                                <Textarea
                                    defaultValue={(
                                        props.promotion.how ?? []
                                    ).join('\n')}
                                    placeholder="One step per line"
                                    className="min-h-48 md:min-h-56"
                                    onBlur={(e) => {
                                        const lines = e.currentTarget.value
                                            .split(/\n+/)
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                        router.put(
                                            route(
                                                'management.promotions.update',
                                                promotion.id,
                                            ),
                                            { how: lines },
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
                                        );
                                    }}
                                />
                            </div>
                        </div>

                        {/* Overwrite + selection + preview/apply row */}
                        <div className="mt-2 space-y-3 border-t pt-3">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                {/* Left: overwrite + selection */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="overwriteGuides"
                                            checked={overwriteGuides}
                                            onCheckedChange={(v) => {
                                                setOverwriteGuides(Boolean(v));
                                            }}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Label
                                                htmlFor="overwriteGuides"
                                                className="text-sm"
                                            >
                                                {tProm(
                                                    'guides.overwrite',
                                                    'Overwrite',
                                                )}
                                            </Label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-muted-foreground cursor-help text-xs underline decoration-dotted underline-offset-4">
                                                        {tProm(
                                                            'guides.overwrite_hint',
                                                            'Menimpa konten yang sudah ada.',
                                                        )}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {tProm(
                                                        'guides.overwrite_hint_long',
                                                        'Jika aktif, hasil generate akan menggantikan (overwrite) daftar S&K dan/atau Cara Penggunaan.',
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                    {overwriteGuides && (
                                        <>
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={applyHow}
                                                    onCheckedChange={(v) =>
                                                        setApplyHow(Boolean(v))
                                                    }
                                                />{' '}
                                                {tProm(
                                                    'guides.apply_how',
                                                    'Terapkan Cara Penggunaan',
                                                )}
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={applyTnc}
                                                    onCheckedChange={(v) =>
                                                        setApplyTnc(Boolean(v))
                                                    }
                                                />{' '}
                                                {tProm(
                                                    'guides.apply_tnc',
                                                    'Terapkan S&K',
                                                )}
                                            </label>
                                        </>
                                    )}
                                </div>
                                {/* Right: preview + single apply */}
                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={openPreview}
                                    >
                                        {tProm('guides.preview', 'Preview')}
                                    </Button>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                disabled={
                                                    overwriteGuides &&
                                                    !applyHow &&
                                                    !applyTnc
                                                }
                                                onClick={generateFromSelection}
                                            >
                                                {tProm('guides.apply', 'Apply')}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {tProm(
                                                'guides.apply_hint',
                                                'Merge jika Overwrite off; jika On, timpa sesuai pilihan.',
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Dialog */}
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-w-3xl md:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {tProm(
                                    'guides.preview_title',
                                    'Preview Guides',
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {tProm(
                                    'guides.preview_desc',
                                    'Berikut hasil generate (tidak langsung disimpan).',
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh]">
                            <div className="grid gap-4 p-1 md:grid-cols-2">
                                <div>
                                    <div className="mb-1 text-sm font-medium">
                                        {tProm(
                                            'guides.tnc_list',
                                            'Terms & Conditions',
                                        )}
                                    </div>
                                    {previewLoading ? (
                                        <div className="text-muted-foreground text-sm">
                                            {t('common.loading', 'Loading...')}
                                        </div>
                                    ) : (
                                        <ul className="list-disc pl-5 text-sm">
                                            {(previewData.tnc ?? []).map(
                                                (s, i) => (
                                                    <li key={`pv-tnc-${i}`}>
                                                        {s}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium">
                                        {tProm(
                                            'guides.how_list',
                                            'How-To Steps',
                                        )}
                                    </div>
                                    {previewLoading ? (
                                        <div className="text-muted-foreground text-sm">
                                            {t('common.loading', 'Loading...')}
                                        </div>
                                    ) : (
                                        <ol className="list-decimal pl-5 text-sm">
                                            {(previewData.how ?? []).map(
                                                (s, i) => (
                                                    <li key={`pv-how-${i}`}>
                                                        {s}
                                                    </li>
                                                ),
                                            )}
                                        </ol>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setPreviewOpen(false);
                                }}
                            >
                                {t('common.close', 'Close')}
                            </Button>
                            <Button
                                onClick={() => {
                                    setPreviewOpen(false);
                                    generateGuides('both');
                                }}
                            >
                                {tProm('guides.apply_merge', 'Apply (Merge)')}
                            </Button>
                            <Button
                                onClick={() => {
                                    setPreviewOpen(false);
                                    setOverwriteGuides(true);
                                    generateGuides('both');
                                }}
                            >
                                {tProm(
                                    'guides.apply_overwrite',
                                    'Apply (Overwrite)',
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Scopes */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>
                                {tProm('section.scopes.title', 'Scopes')}
                            </CardTitle>
                            <CardDescription>
                                {tProm(
                                    'section.scopes.desc',
                                    'Targeting for this promotion',
                                )}
                            </CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button
                                size="sm"
                                onClick={() =>
                                    setScopeDialog({ open: true, item: null })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />{' '}
                                {tProm('scope.create_title', 'Add Scope')}
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={scopeColumns}
                            data={props.scopes as unknown[]}
                        />
                    </CardContent>
                </Card>

                {/* Rules */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>
                                {tProm('section.rules.title', 'Rules')}
                            </CardTitle>
                            <CardDescription>
                                {tProm(
                                    'section.rules.desc',
                                    'Conditions for applying',
                                )}
                            </CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button
                                size="sm"
                                onClick={() =>
                                    setRuleDialog({ open: true, item: null })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />{' '}
                                {tProm('rule.create_title', 'Add Rule')}
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={ruleColumns}
                            data={props.rules as unknown[]}
                        />
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>
                                {tProm('section.actions.title', 'Actions')}
                            </CardTitle>
                            <CardDescription>
                                {tProm(
                                    'section.actions.desc',
                                    'Discount effects',
                                )}
                            </CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button
                                size="sm"
                                onClick={() =>
                                    setActionDialog({ open: true, item: null })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />{' '}
                                {tProm('action.create_title', 'Add Action')}
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={actionColumns}
                            data={props.actions as unknown[]}
                        />
                    </CardContent>
                </Card>

                {/* Coupons */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>
                                {tProm('section.coupons.title', 'Coupons')}
                            </CardTitle>
                            <CardDescription>
                                {tProm(
                                    'section.coupons.desc',
                                    'Shared or unique codes',
                                )}
                            </CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => setBulkDialog(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />{' '}
                                    {tProm('coupon.create_title', 'Add Coupon')}
                                </Button>
                            </div>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTableServer
                            columns={couponColumns as unknown as any}
                            rows={couponRows as unknown[]}
                            paginator={couponMeta}
                            search={String(couponQueryRef.current.search ?? '')}
                            onSearchChange={(v) => {
                                void fetchCoupons({ page: 1, search: v });
                            }}
                            searchKey="code"
                            onQueryChange={(next) => {
                                void fetchCoupons(next as any);
                            }}
                            sort={(couponQueryRef.current.sort ?? null) as any}
                            dir={(couponQueryRef.current.dir ?? null) as any}
                            onSortChange={({ sort, dir }) => {
                                void fetchCoupons({
                                    page: 1,
                                    sort: sort ?? null,
                                    dir: dir ?? null,
                                });
                            }}
                            showSubmitButton={false}
                            showRefresh={false}
                            showColumn={true}
                            loading={couponLoading}
                            rightSlot={
                                <div className="flex items-center gap-2">
                                    {/* Status dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <UIButton
                                                variant="outline"
                                                size="sm"
                                            >
                                                {t('common.status')}{' '}
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </UIButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-40"
                                        >
                                            <DropdownMenuLabel>
                                                {t('common.status')}
                                            </DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    (
                                                        couponQueryRef.current as any
                                                    ).active = undefined;
                                                    void fetchCoupons({
                                                        page: 1,
                                                        active: undefined,
                                                    });
                                                }}
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${(couponQueryRef.current as any).active ? 'opacity-0' : 'opacity-100'}`}
                                                />{' '}
                                                {t('common.all')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    (
                                                        couponQueryRef.current as any
                                                    ).active = '1';
                                                    void fetchCoupons({
                                                        page: 1,
                                                        active: '1',
                                                    });
                                                }}
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${(couponQueryRef.current as any).active === '1' ? 'opacity-100' : 'opacity-0'}`}
                                                />{' '}
                                                {t('common.active')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    (
                                                        couponQueryRef.current as any
                                                    ).active = '0';
                                                    void fetchCoupons({
                                                        page: 1,
                                                        active: '0',
                                                    });
                                                }}
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${(couponQueryRef.current as any).active === '0' ? 'opacity-100' : 'opacity-0'}`}
                                                />{' '}
                                                {t('common.inactive')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Expiry dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <UIButton
                                                variant="outline"
                                                size="sm"
                                            >
                                                {t('common.expiry', 'Expiry')}{' '}
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </UIButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-40"
                                        >
                                            <DropdownMenuLabel>
                                                {t('common.expiry', 'Expiry')}
                                            </DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    (
                                                        couponQueryRef.current as any
                                                    ).expiry = undefined;
                                                    void fetchCoupons({
                                                        page: 1,
                                                        expiry: undefined,
                                                    });
                                                }}
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${(couponQueryRef.current as any).expiry ? 'opacity-0' : 'opacity-100'}`}
                                                />{' '}
                                                {t('common.all')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    (
                                                        couponQueryRef.current as any
                                                    ).expiry = 'valid';
                                                    void fetchCoupons({
                                                        page: 1,
                                                        expiry: 'valid',
                                                    });
                                                }}
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${(couponQueryRef.current as any).expiry === 'valid' ? 'opacity-100' : 'opacity-0'}`}
                                                />{' '}
                                                {t('common.valid')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    (
                                                        couponQueryRef.current as any
                                                    ).expiry = 'expired';
                                                    void fetchCoupons({
                                                        page: 1,
                                                        expiry: 'expired',
                                                    });
                                                }}
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${(couponQueryRef.current as any).expiry === 'expired' ? 'opacity-100' : 'opacity-0'}`}
                                                />{' '}
                                                {t('common.expired')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <UIButton
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            window.open(
                                                route(
                                                    'management.promotions.coupons.export',
                                                    promotion.id,
                                                ),
                                                '_blank',
                                            )
                                        }
                                    >
                                        {t('common.export_csv', 'Export CSV')}
                                    </UIButton>
                                </div>
                            }
                        />
                    </CardContent>
                </Card>
            </div>

            <UpsertScopeDialog
                open={scopeDialog.open}
                onOpenChange={(v) => setScopeDialog((s) => ({ ...s, open: v }))}
                item={scopeDialog.item}
                promotionId={promotion.id}
                options={props.options}
            />
            <UpsertRuleDialog
                open={ruleDialog.open}
                onOpenChange={(v) => setRuleDialog((s) => ({ ...s, open: v }))}
                item={ruleDialog.item}
                promotionId={promotion.id}
            />
            <UpsertActionDialog
                open={actionDialog.open}
                onOpenChange={(v) =>
                    setActionDialog((s) => ({ ...s, open: v }))
                }
                item={actionDialog.item}
                promotionId={promotion.id}
            />

            <UpsertCouponDialog
                open={couponDialog.open}
                onOpenChange={(v) =>
                    setCouponDialog((s) => ({ ...s, open: v }))
                }
                item={couponDialog.item}
                promotionId={promotion.id}
                onSuccess={() => {
                    void fetchCoupons({ page: 1 });
                }}
            />
            <BulkCouponDialog
                open={bulkDialog}
                onOpenChange={setBulkDialog}
                promotionId={promotion.id}
                onSuccess={() => {
                    void fetchCoupons({ page: 1 });
                }}
            />

            <AlertDialog
                open={confirmDel.open}
                onOpenChange={(v) => setConfirmDel((s) => ({ ...s, open: v }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure want to delete this item?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                const { kind, id } = confirmDel;
                                const routes: Record<string, string> = {
                                    scope: 'management.promotions.scopes.destroy',
                                    rule: 'management.promotions.rules.destroy',
                                    action: 'management.promotions.actions.destroy',
                                    coupon: 'management.promotions.coupons.destroy',
                                };
                                const curPage =
                                    couponQueryRef.current.page ?? 1;
                                const targetPage =
                                    kind === 'coupon' &&
                                    (couponRows?.length ?? 0) <= 1 &&
                                    curPage > 1
                                        ? curPage - 1
                                        : curPage;
                                router.delete(route(routes[kind], id), {
                                    preserveScroll: true,
                                    preserveState: true,
                                    onSuccess: () => {
                                        setConfirmDel({
                                            ...confirmDel,
                                            open: false,
                                        });
                                        void fetchCoupons({ page: targetPage });
                                    },
                                });
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
