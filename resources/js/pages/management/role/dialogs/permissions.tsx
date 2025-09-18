'use client';

import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

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

import type { RoleItem } from '..';

export type Permission = { id: number; name: string; guard_name: string };

export type PermissionsDialogProps = {
    open: boolean;
    role: RoleItem | null;
    permissions: Permission[];
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    preselected?: number[];
};

export default function PermissionsDialog({
    open,
    role,
    permissions,
    onOpenChange,
    onSuccess,
    preselected = [],
}: PermissionsDialogProps) {
    const [saving, setSaving] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [selected, setSelected] = React.useState<Set<number>>(
        () => new Set(preselected),
    );

    React.useEffect(() => {
        setSelected(new Set(preselected));
        setSearch('');
    }, [role?.id, preselected]);

    const close = React.useCallback(
        () => onOpenChange?.(false),
        [onOpenChange],
    );
    const toggle = React.useCallback((id: number, checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase();
        const guard = role?.guard_name;
        return permissions
            .filter((p) => (!guard ? true : p.guard_name === guard))
            .filter((p) => (q ? p.name.toLowerCase().includes(q) : true));
    }, [permissions, search, role?.guard_name]);

    const grouped = React.useMemo(() => {
        const map = new Map<string, Permission[]>();
        for (const p of filtered) {
            const key = p.name.includes('.') ? p.name.split('.')[0] : 'others';
            const arr = map.get(key) ?? [];
            arr.push(p);
            map.set(key, arr);
        }
        return Array.from(map.entries()).sort((a, b) =>
            a[0].localeCompare(b[0]),
        );
    }, [filtered]);

    const isGroupAllSelected = React.useCallback(
        (groupPerms: Permission[]) =>
            groupPerms.length > 0 &&
            groupPerms.every((p) => selected.has(p.id)),
        [selected],
    );
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
                    close();
                },
            },
        );
    }, [role, selected, onSuccess, close]);

    return (
        <Dialog open={open} onOpenChange={(v) => (v ? undefined : close())}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Atur Permissions</DialogTitle>
                    </div>
                    <DialogDescription>
                        Kelompokkan dan pilih permissions untuk role ini.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari permission…"
                            className="h-9"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleToggleAll}
                        >
                            Pilih semua
                        </Button>
                    </div>
                    <ScrollArea className="max-h-[60vh] rounded-md border">
                        <div className="divide-y">
                            {grouped.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Tidak ada permission
                                </div>
                            ) : (
                                grouped.map(([group, items]) => (
                                    <Accordion
                                        key={group}
                                        type="single"
                                        collapsible
                                    >
                                        <AccordionItem value="item-1">
                                            <AccordionTrigger className="px-3 py-2">
                                                <div className="flex w-full items-center justify-between">
                                                    <span className="text-sm font-medium capitalize">
                                                        {group}
                                                    </span>
                                                    {isGroupAllSelected(
                                                        items,
                                                    ) ? (
                                                        <Badge variant="outline">
                                                            Semua
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-1 px-3 pb-3">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            toggleGroup(items)
                                                        }
                                                    >
                                                        Toggle semua
                                                    </Button>
                                                    <div className="grid gap-2 pt-2 sm:grid-cols-2">
                                                        {items.map((p) => {
                                                            const checked =
                                                                selected.has(
                                                                    p.id,
                                                                );
                                                            return (
                                                                <label
                                                                    key={p.id}
                                                                    className="flex cursor-pointer items-center gap-3 rounded px-2 py-1 hover:bg-muted/40"
                                                                >
                                                                    <Checkbox
                                                                        checked={
                                                                            checked
                                                                        }
                                                                        onCheckedChange={(
                                                                            v,
                                                                        ) =>
                                                                            toggle(
                                                                                p.id,
                                                                                Boolean(
                                                                                    v,
                                                                                ),
                                                                            )
                                                                        }
                                                                    />
                                                                    <div className="truncate text-sm">
                                                                        {p.name}
                                                                    </div>
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
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                    >
                        Batal
                    </Button>
                    <Button type="button" disabled={saving} onClick={submit}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                Simpan…
                            </>
                        ) : (
                            'Simpan'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
