import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
import { Button } from '@/components/ui/button';
import { Button as UIButton } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DataTableServer, type PaginatorMeta } from '@/components/ui/data-table-server';
import { Badge } from '@/components/ui/badge';
import { CopyInline } from '@/components/ui/copy-inline';

import BulkCouponDialog from '@/features/promotion/dialogs/bulk-coupon-dialog';
import UpsertActionDialog from '@/features/promotion/dialogs/upsert-action-dialog';
import UpsertCouponDialog from '@/features/promotion/dialogs/upsert-coupon-dialog';
import UpsertRuleDialog from '@/features/promotion/dialogs/upsert-rule-dialog';
import UpsertScopeDialog from '@/features/promotion/dialogs/upsert-scope-dialog';
import { createActionColumns } from '@/features/promotion/tables/actions-columns';
import { createCouponColumns } from '@/features/promotion/tables/coupons-columns';
import { createRuleColumns } from '@/features/promotion/tables/rules-columns';
import { createScopeColumns } from '@/features/promotion/tables/scopes-columns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { AppLayout } from '@/layouts';

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
    tags: string[];
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

    const [scopeDialog, setScopeDialog] = React.useState({ open: false, item: null as any });
    const [ruleDialog, setRuleDialog] = React.useState({ open: false, item: null as any });
    const [actionDialog, setActionDialog] = React.useState({ open: false, item: null as any });

    const [confirmDel, setConfirmDel] = React.useState<{ kind: 'scope'|'rule'|'action'|'coupon'; id: number; open: boolean}>({ kind: 'scope', id: 0, open: false });

    const scopeColumns: ColumnDef<unknown>[] = React.useMemo(() => {
        const bmap = new Map((props.options?.buildings ?? []).map((o) => [Number(o.value), o.label]));
        const fmap = new Map((props.options?.floors ?? []).map((o) => [Number(o.value), o.label]));
        const rtmap = new Map((props.options?.room_types ?? []).map((o) => [Number(o.value), o.label]));
        const rmap = new Map((props.options?.rooms ?? []).map((o) => [Number(o.value), o.label]));
        return createScopeColumns({
            onEdit: (it) => setScopeDialog({ open: true, item: it }),
            onDelete: (it) => setConfirmDel({ open: true, id: it.id, kind: 'scope' }),
            resolvers: {
                building: (id) => (id ? bmap.get(Number(id)) ?? String(id) : '-'),
                floor: (id) => (id ? fmap.get(Number(id)) ?? String(id) : '-'),
                room_type: (id) => (id ? rtmap.get(Number(id)) ?? String(id) : '-'),
                room: (id) => (id ? rmap.get(Number(id)) ?? String(id) : '-'),
            },
        });
    }, [props.options]);
    const ruleColumns: ColumnDef<unknown>[] = React.useMemo(
        () => createRuleColumns({
            onEdit: (it) => setRuleDialog({ open: true, item: it }),
            onDelete: (it) => setConfirmDel({ open: true, id: it.id, kind: 'rule' }),
        }),
        [],
    );
    const actionColumns: ColumnDef<unknown>[] = React.useMemo(
        () => createActionColumns({
            onEdit: (it) => setActionDialog({ open: true, item: it }),
            onDelete: (it) => setConfirmDel({ open: true, id: it.id, kind: 'action' }),
        }),
        [],
    );
    const couponColumns: ColumnDef<unknown>[] = React.useMemo(
        () => createCouponColumns({
            onEdit: (it) => setCouponDialog({ open: true, item: it }),
            onDelete: (it) => setConfirmDel({ open: true, id: it.id, kind: 'coupon' }),
        }),
        [],
    );

    const [couponDialog, setCouponDialog] = React.useState({ open: false, item: null as any });
    const [bulkDialog, setBulkDialog] = React.useState(false);

    // Coupons server table state
    const [couponRows, setCouponRows] = React.useState<any[]>([]);
    const [couponMeta, setCouponMeta] = React.useState<PaginatorMeta | null>(null);
    const [couponLoading, setCouponLoading] = React.useState(false);
    const couponQueryRef = React.useRef<{
        page?: number;
        per_page?: number;
        search?: string;
        sort?: string | null;
        dir?: 'asc' | 'desc' | null;
        active?: '1' | '0' | undefined;
        expiry?: 'valid' | 'expired' | undefined;
    }>({ page: 1, per_page: 10, search: '', sort: null, dir: null, active: undefined, expiry: undefined });

    const fetchCoupons = React.useCallback(async (q?: Partial<{
        page?: number;
        per_page?: number;
        search?: string;
        sort?: string | null;
        dir?: 'asc' | 'desc' | null;
        active?: '1' | '0';
        expiry?: 'valid' | 'expired';
    }>) => {
        const next = { ...couponQueryRef.current, ...(q ?? {}) };
        couponQueryRef.current = next;
        const params = new URLSearchParams();
        if (next.page) params.set('page', String(next.page));
        if (next.per_page) params.set('per_page', String(next.per_page));
        if (next.search) params.set('search', String(next.search));
        if (next.sort) params.set('sort', String(next.sort));
        if (next.dir) params.set('dir', String(next.dir));
        if (typeof next.active !== 'undefined') params.set('active', String(next.active));
        if (next.expiry) params.set('expiry', String(next.expiry));
        const url = route('management.promotions.coupons.list', promotion.id) + '?' + params.toString();
        setCouponLoading(true);
        try {
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
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
    }, [promotion.id]);

    React.useEffect(() => { void fetchCoupons({ page: 1, per_page: 10 }); }, [fetchCoupons]);

    return (
        <AppLayout
            pageTitle={`${tProm('title', 'Promotions')}: ${promotion.name}`}
            pageDescription={promotion.description || ''}
            actions={(
                <UIButton size="sm" variant="outline" onClick={() => router.visit(route('management.promotions.index'))}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', 'Back')}
                </UIButton>
            )}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{t('common.overview', 'Overview')}</CardTitle>
                        <CardDescription>{tProm('desc', 'Manage discount promotions')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={promotion.is_active ? 'secondary' : 'outline'}>
                                {t('common.active')}: {promotion.is_active ? t('common.yes') : t('common.no')}
                            </Badge>
                            <Badge variant={promotion.require_coupon ? 'secondary' : 'outline'}>
                                {tProm('promotion.label.require_coupon')}: {promotion.require_coupon ? t('common.yes') : t('common.no')}
                            </Badge>
                            <Badge variant="outline">
                                {tProm('promotion.label.stack_mode')}: {tProm(`promotion.stack.${String(promotion.stack_mode).toLowerCase()}`, String(promotion.stack_mode))}
                            </Badge>
                            <Badge variant="outline">
                                {tProm('promotion.label.channel')}: {promotion.default_channel ? tProm(`channel.${String(promotion.default_channel).toLowerCase()}`, promotion.default_channel) : tProm('common.any')}
                            </Badge>
                            <Badge variant="outline">{tProm('promotion.label.priority')}: {promotion.priority}</Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid grid-cols-[140px_1fr] items-center gap-1 text-sm">
                                <div className="text-muted-foreground">{tProm('promotion.label.valid_from')}:</div>
                                <div className="text-foreground">{promotion.valid_from || '-'}</div>
                                <div className="text-muted-foreground">{tProm('promotion.label.valid_until')}:</div>
                                <div className="text-foreground">{promotion.valid_until || '-'}</div>
                                <div className="text-muted-foreground">{tProm('promotion.label.slug')}:</div>
                                <div className="flex items-center gap-1">
                                    {promotion.slug ? (
                                        <>
                                            <span className="font-mono">{promotion.slug}</span>
                                            <CopyInline value={promotion.slug} as="span" variant="icon" size="xs" />
                                        </>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                                <div className="text-muted-foreground">{t('common.tags', 'Tags')}:</div>
                                <div className="flex flex-wrap items-center gap-1">
                                    {Array.isArray(promotion.tags) && promotion.tags.length > 0 ? (
                                        promotion.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">#{tag}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Scopes */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <div>
                            <CardTitle>{tProm('section.scopes.title', 'Scopes')}</CardTitle>
                            <CardDescription>{tProm('section.scopes.desc', 'Targeting for this promotion')}</CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button size="sm" onClick={() => setScopeDialog({ open: true, item: null })}>
                                <Plus className="mr-2 h-4 w-4" /> {tProm('scope.create_title', 'Add Scope')}
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={scopeColumns} data={props.scopes as unknown[]} />
                    </CardContent>
                </Card>

                {/* Rules */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <div>
                            <CardTitle>{tProm('section.rules.title', 'Rules')}</CardTitle>
                            <CardDescription>{tProm('section.rules.desc', 'Conditions for applying')}</CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button size="sm" onClick={() => setRuleDialog({ open: true, item: null })}>
                                <Plus className="mr-2 h-4 w-4" /> {tProm('rule.create_title', 'Add Rule')}
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={ruleColumns} data={props.rules as unknown[]} />
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <div>
                            <CardTitle>{tProm('section.actions.title', 'Actions')}</CardTitle>
                            <CardDescription>{tProm('section.actions.desc', 'Discount effects')}</CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button size="sm" onClick={() => setActionDialog({ open: true, item: null })}>
                                <Plus className="mr-2 h-4 w-4" /> {tProm('action.create_title', 'Add Action')}
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={actionColumns} data={props.actions as unknown[]} />
                    </CardContent>
                </Card>

                {/* Coupons */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <div>
                            <CardTitle>{tProm('section.coupons.title', 'Coupons')}</CardTitle>
                            <CardDescription>{tProm('section.coupons.desc', 'Shared or unique codes')}</CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => setBulkDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> {tProm('coupon.create_title', 'Add Coupon')}
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
                            onSearchChange={(v) => { void fetchCoupons({ page: 1, search: v }); }}
                            searchKey="code"
                            onQueryChange={(next) => { void fetchCoupons(next as any); }}
                            sort={(couponQueryRef.current.sort ?? null) as any}
                            dir={(couponQueryRef.current.dir ?? null) as any}
                            onSortChange={({ sort, dir }) => { void fetchCoupons({ page: 1, sort: sort ?? null, dir: dir ?? null }); }}
                            showSubmitButton={false}
                            showRefresh={false}
                            showColumn={true}
                            loading={couponLoading}
                            rightSlot={(
                                <div className="flex items-center gap-2">
                                    {/* Status dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <UIButton variant="outline" size="sm">
                                                {t('common.status')} <ChevronDown className="ml-2 h-4 w-4" />
                                            </UIButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuLabel>{t('common.status')}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => { (couponQueryRef.current as any).active = undefined; void fetchCoupons({ page: 1, active: undefined }); }}>
                                                <Check className={`mr-2 h-4 w-4 ${ (couponQueryRef.current as any).active ? 'opacity-0' : 'opacity-100' }`} /> {t('common.all')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { (couponQueryRef.current as any).active = '1'; void fetchCoupons({ page: 1, active: '1' }); }}>
                                                <Check className={`mr-2 h-4 w-4 ${ (couponQueryRef.current as any).active === '1' ? 'opacity-100' : 'opacity-0' }`} /> {t('common.active')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { (couponQueryRef.current as any).active = '0'; void fetchCoupons({ page: 1, active: '0' }); }}>
                                                <Check className={`mr-2 h-4 w-4 ${ (couponQueryRef.current as any).active === '0' ? 'opacity-100' : 'opacity-0' }`} /> {t('common.inactive')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Expiry dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <UIButton variant="outline" size="sm">
                                                {t('common.expiry', 'Expiry')} <ChevronDown className="ml-2 h-4 w-4" />
                                            </UIButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuLabel>{t('common.expiry', 'Expiry')}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => { (couponQueryRef.current as any).expiry = undefined; void fetchCoupons({ page: 1, expiry: undefined }); }}>
                                                <Check className={`mr-2 h-4 w-4 ${ (couponQueryRef.current as any).expiry ? 'opacity-0' : 'opacity-100' }`} /> {t('common.all')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { (couponQueryRef.current as any).expiry = 'valid'; void fetchCoupons({ page: 1, expiry: 'valid' }); }}>
                                                <Check className={`mr-2 h-4 w-4 ${ (couponQueryRef.current as any).expiry === 'valid' ? 'opacity-100' : 'opacity-0' }`} /> {t('common.valid')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { (couponQueryRef.current as any).expiry = 'expired'; void fetchCoupons({ page: 1, expiry: 'expired' }); }}>
                                                <Check className={`mr-2 h-4 w-4 ${ (couponQueryRef.current as any).expiry === 'expired' ? 'opacity-100' : 'opacity-0' }`} /> {t('common.expired')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <UIButton
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(route('management.promotions.coupons.export', promotion.id), '_blank')}
                                    >
                                        {t('common.export_csv', 'Export CSV')}
                                    </UIButton>
                                </div>
                            )}
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
                onOpenChange={(v) => setActionDialog((s) => ({ ...s, open: v }))}
                item={actionDialog.item}
                promotionId={promotion.id}
            />

            <UpsertCouponDialog
                open={couponDialog.open}
                onOpenChange={(v) => setCouponDialog((s) => ({ ...s, open: v }))}
                item={couponDialog.item}
                promotionId={promotion.id}
                onSuccess={() => { void fetchCoupons({ page: 1 }); }}
            />
            <BulkCouponDialog open={bulkDialog} onOpenChange={setBulkDialog} promotionId={promotion.id} onSuccess={() => { void fetchCoupons({ page: 1 }); }} />

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
                                const curPage = couponQueryRef.current.page ?? 1;
                                const targetPage = (kind === 'coupon' && (couponRows?.length ?? 0) <= 1 && curPage > 1) ? curPage - 1 : curPage;
                                router.delete(route(routes[kind], id), {
                                    preserveScroll: true,
                                    preserveState: true,
                                    onSuccess: () => { setConfirmDel({ ...confirmDel, open: false }); void fetchCoupons({ page: targetPage }); },
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
