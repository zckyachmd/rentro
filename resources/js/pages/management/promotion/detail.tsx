import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import React from 'react';

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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import UpsertScopeDialog from '@/features/promotion/dialogs/upsert-scope-dialog';
import UpsertRuleDialog from '@/features/promotion/dialogs/upsert-rule-dialog';
import UpsertActionDialog from '@/features/promotion/dialogs/upsert-action-dialog';
import { createScopeColumns } from '@/features/promotion/tables/scopes-columns';
import { createRuleColumns } from '@/features/promotion/tables/rules-columns';
import { createActionColumns } from '@/features/promotion/tables/actions-columns';
import { createCouponColumns } from '@/features/promotion/tables/coupons-columns';
import UpsertCouponDialog from '@/features/promotion/dialogs/upsert-coupon-dialog';
import BulkCouponDialog from '@/features/promotion/dialogs/bulk-coupon-dialog';
import { Button as UIButton } from '@/components/ui/button';
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
        buildings: { value: string; label: string; description?: string | null }[];
        floors: { value: string; label: string; description?: string | null }[];
        room_types: { value: string; label: string; description?: string | null }[];
        rooms: { value: string; label: string; description?: string | null }[];
    };
};

export default function PromotionDetail() {
    const { props } = usePage<InertiaPageProps & PageProps>();
    const promotion = props.promotion;

    const [scopeDialog, setScopeDialog] = React.useState({ open: false, item: null as any });
    const [ruleDialog, setRuleDialog] = React.useState({ open: false, item: null as any });
    const [actionDialog, setActionDialog] = React.useState({ open: false, item: null as any });

    const [confirmDel, setConfirmDel] = React.useState<{ kind: 'scope'|'rule'|'action'|'coupon'; id: number; open: boolean}>({ kind: 'scope', id: 0, open: false });

    const scopeColumns: ColumnDef<any>[] = React.useMemo(
        () => createScopeColumns({
            onEdit: (it) => setScopeDialog({ open: true, item: it }),
            onDelete: (it) => setConfirmDel({ open: true, id: it.id, kind: 'scope' }),
        }),
        [],
    );
    const ruleColumns: ColumnDef<any>[] = React.useMemo(
        () => createRuleColumns({
            onEdit: (it) => setRuleDialog({ open: true, item: it }),
            onDelete: (it) => setConfirmDel({ open: true, id: it.id, kind: 'rule' }),
        }),
        [],
    );
    const actionColumns: ColumnDef<any>[] = React.useMemo(
        () => createActionColumns({
            onEdit: (it) => setActionDialog({ open: true, item: it }),
            onDelete: (it) => setConfirmDel({ open: true, id: it.id, kind: 'action' }),
        }),
        [],
    );
    const couponColumns: ColumnDef<any>[] = React.useMemo(
        () => createCouponColumns({
            onEdit: (it) => setCouponDialog({ open: true, item: it }),
            onDelete: (it) => setConfirmDel({ open: true, id: it.id, kind: 'coupon' }),
        }),
        [],
    );

    const [couponDialog, setCouponDialog] = React.useState({ open: false, item: null as any });
    const [bulkDialog, setBulkDialog] = React.useState(false);

    return (
        <AppLayout
            pageTitle={`Promotion: ${promotion.name}`}
            pageDescription={promotion.description || ''}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{promotion.name}</CardTitle>
                        <CardDescription>{promotion.slug}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <div className="text-sm text-muted-foreground">
                            Valid: {promotion.valid_from || '-'} ~ {promotion.valid_until || '-'} | Stack: {promotion.stack_mode} | Priority: {promotion.priority}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Channel: {promotion.default_channel || 'any'} | Active: {promotion.is_active ? 'Yes' : 'No'} | Coupon: {promotion.require_coupon ? 'Required' : 'No'}
                        </div>
                    </CardContent>
                </Card>

                {/* Scopes */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <div>
                            <CardTitle>Scopes</CardTitle>
                            <CardDescription>Targeting for this promotion</CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button size="sm" onClick={() => setScopeDialog({ open: true, item: null })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Scope
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={scopeColumns} rows={props.scopes} />
                    </CardContent>
                </Card>

                {/* Rules */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <div>
                            <CardTitle>Rules</CardTitle>
                            <CardDescription>Conditions for applying</CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button size="sm" onClick={() => setRuleDialog({ open: true, item: null })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Rule
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={ruleColumns} rows={props.rules} />
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <div>
                            <CardTitle>Actions</CardTitle>
                            <CardDescription>Discount effects</CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <Button size="sm" onClick={() => setActionDialog({ open: true, item: null })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Action
                            </Button>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={actionColumns} rows={props.actions} />
                    </CardContent>
                </Card>

                {/* Coupons */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <div>
                            <CardTitle>Coupons</CardTitle>
                            <CardDescription>Shared or unique codes</CardDescription>
                        </div>
                        <Can all={[`promotion.update`]}>
                            <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => setCouponDialog({ open: true, item: null })}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Coupon
                                </Button>
                                <UIButton size="sm" variant="outline" onClick={() => setBulkDialog(true)}>
                                    Bulk Generate
                                </UIButton>
                                <UIButton
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(route('management.promotions.coupons.export', promotion.id), '_blank')}
                                >
                                    Export CSV
                                </UIButton>
                            </div>
                        </Can>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={couponColumns} rows={props.coupons} />
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
            />
            <BulkCouponDialog open={bulkDialog} onOpenChange={setBulkDialog} promotionId={promotion.id} />

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
                                router.delete(route(routes[kind], id), {
                                    preserveScroll: true,
                                    preserveState: true,
                                    onFinish: () => setConfirmDel({ ...confirmDel, open: false }),
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
