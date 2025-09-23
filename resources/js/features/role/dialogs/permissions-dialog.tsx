import { router } from '@inertiajs/react';
import { Shield } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Permission, PermissionsDialogProps } from '@/types/management';

export default function PermissionsDialog({
    open,
    role,
    permissions,
    onOpenChange,
    onSuccess,
    preselected = [],
}: PermissionsDialogProps & { onOpenChange: (open: boolean) => void }) {
    const { t } = useTranslation();
    const [search, setSearch] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [selected, setSelected] = React.useState<Set<number>>(new Set());

    React.useEffect(() => {
        const set = new Set<number>();
        for (const id of preselected ?? []) set.add(id);
        setSelected(set);
    }, [preselected]);

    const filtered = React.useMemo(() => {
        const s = search.trim().toLowerCase();
        const groupOf = (p: Permission) => {
            const name = p.name || '';
            const idx = name.indexOf('.');
            return idx > 0 ? name.slice(0, idx) : name || 'other';
        };
        return s
            ? permissions.filter((p) =>
                  `${groupOf(p)}:${p.name}`.toLowerCase().includes(s),
              )
            : permissions;
    }, [search, permissions]);

    const grouped = React.useMemo(() => {
        const groupOf = (p: Permission) => {
            const name = p.name || '';
            const idx = name.indexOf('.');
            return idx > 0
                ? name.slice(0, idx)
                : name || p.guard_name || 'other';
        };
        const map = new Map<string, Permission[]>();
        for (const p of filtered) {
            const g = groupOf(p);
            const arr = map.get(g) || [];
            arr.push(p);
            map.set(g, arr);
        }
        return Array.from(map.entries());
    }, [filtered]);

    const isGroupAllSelected = React.useCallback(
        (groupPerms: Permission[]): boolean =>
            groupPerms.length > 0 &&
            groupPerms.every((p) => selected.has(p.id)),
        [selected],
    );
    const toggle = React.useCallback((id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);
    const toggleGroup = React.useCallback((groupPerms: Permission[]) => {
        setSelected((prev) => {
            const next = new Set(prev);
            const all = groupPerms.every((p) => next.has(p.id));
            if (all) {
                for (const p of groupPerms) next.delete(p.id);
            } else {
                for (const p of groupPerms) next.add(p.id);
            }
            return next;
        });
    }, []);
    const handleToggleAll = React.useCallback(() => {
        setSelected((prev) => {
            const allIds = grouped.flatMap(([, arr]) => arr.map((p) => p.id));
            const isAll =
                allIds.length > 0 && allIds.every((id) => prev.has(id));
            return isAll ? new Set<number>() : new Set<number>(allIds);
        });
    }, [grouped]);

    const submit = React.useCallback(() => {
        if (!role) return;
        router.post(
            route('management.roles.permissions.update', role.id),
            { permission_ids: Array.from(selected), _method: 'PUT' },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: () => {
                    onSuccess?.();
                    onOpenChange(false);
                },
            },
        );
    }, [role, selected, onSuccess, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>
                            {t('role.permissions.title')}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {t('role.permissions.desc')}
                    </DialogDescription>
                </DialogHeader>

                {role && (
                    <div className="bg-card mb-1 rounded-lg border px-4 py-3 shadow-sm">
                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Role */}
                            <div className="flex flex-col">
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <Shield className="text-primary h-4 w-4" />
                                    <span className="text-[12px] font-medium tracking-wide uppercase">
                                        {t('role.label')}
                                    </span>
                                </div>
                                <span className="text-foreground mt-1 text-base font-semibold break-words">
                                    {role.name}
                                </span>
                            </div>

                            {/* Guard */}
                            <div className="flex flex-col sm:items-end">
                                <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
                                    Guard
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="mt-1 w-fit tracking-wide uppercase"
                                >
                                    {role.guard_name}
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('role.permissions.search_placeholder')}
                            className="h-9"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={handleToggleAll}
                        >
                            {t('role.permissions.select_all')}
                        </Button>
                    </div>
                    <ScrollArea className="h-[30vh] rounded-md border">
                        <div className="divide-y">
                            {grouped.length === 0 ? (
                                <div className="text-muted-foreground p-4 text-center text-sm">
                                    {t('role.permissions.empty')}
                                </div>
                            ) : (
                                grouped.map(([group, items]) => (
                                    <Accordion
                                        key={group}
                                        type="single"
                                        collapsible
                                    >
                                        <AccordionItem value={`group-${group}`}>
                                            <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                                <div className="flex w-full items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        {(() => {
                                                            const all =
                                                                isGroupAllSelected(
                                                                    items,
                                                                );
                                                            const some =
                                                                items.some(
                                                                    (p) =>
                                                                        selected.has(
                                                                            p.id,
                                                                        ),
                                                                );
                                                            const state:
                                                                | boolean
                                                                | 'indeterminate' =
                                                                all
                                                                    ? true
                                                                    : some
                                                                      ? 'indeterminate'
                                                                      : false;
                                                            return (
                                                                <Checkbox
                                                                    checked={
                                                                        state
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        toggleGroup(
                                                                            items,
                                                                        )
                                                                    }
                                                                    aria-label={t(
                                                                        'role.permissions.select_group',
                                                                        {
                                                                            group,
                                                                        },
                                                                    )}
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                />
                                                            );
                                                        })()}
                                                        <span className="text-sm font-medium capitalize no-underline">
                                                            {group}
                                                        </span>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="px-3 pb-3">
                                                    <div className="grid gap-2 pt-2 sm:grid-cols-2">
                                                        {items.map((p) => {
                                                            const checked =
                                                                selected.has(
                                                                    p.id,
                                                                );
                                                            return (
                                                                <label
                                                                    key={p.id}
                                                                    className="flex cursor-pointer items-center gap-2"
                                                                >
                                                                    <Checkbox
                                                                        checked={
                                                                            checked
                                                                        }
                                                                        onCheckedChange={() =>
                                                                            toggle(
                                                                                p.id,
                                                                            )
                                                                        }
                                                                        aria-label={t(
                                                                            'role.permissions.select_permission',
                                                                            {
                                                                                name: p.name,
                                                                            },
                                                                        )}
                                                                    />
                                                                    <span className="text-sm">
                                                                        {p.name}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('common.close')}
                    </Button>
                    <Button onClick={submit} disabled={saving}>
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
