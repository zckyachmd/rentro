'use client';

import { router } from '@inertiajs/react';
import { Loader2, Search, ShieldCheck } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { RoleItem } from '.';

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

    const close = React.useCallback(() => {
        onOpenChange?.(false);
    }, [onOpenChange]);

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

    const countSelected = selected.size;

    return (
        <Dialog open={open} onOpenChange={(v) => (v ? undefined : close())}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Kelola Permissions</DialogTitle>
                    <DialogDescription>
                        Centang izin yang ingin diberikan ke role.
                    </DialogDescription>
                </DialogHeader>

                {/* Role heading */}
                <div className="mb-3 flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5" />
                    <div className="min-w-0">
                        <div className="truncate font-medium">
                            {role?.name ?? '—'}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                            Guard: {role?.guard_name ?? '—'}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="mb-2 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                        <Input
                            id="perm-search"
                            placeholder="Cari permission…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleToggleAll}
                    >
                        {(() => {
                            const allIds = grouped.flatMap(([, arr]) =>
                                arr.map((p) => p.id),
                            );
                            const isAll =
                                allIds.length > 0 &&
                                allIds.every((id) => selected.has(id));
                            return isAll ? 'Hapus semua' : 'Pilih semua';
                        })()}
                    </Button>
                </div>

                <div className="grid gap-3 py-2">
                    <div className="grid gap-2">
                        <Label>
                            Grup Permission
                            {role?.guard_name
                                ? ` (guard: ${role.guard_name})`
                                : ''}
                        </Label>
                        <ScrollArea className="h-72 rounded border">
                            <Accordion
                                type="multiple"
                                defaultValue={grouped.map(([g]) => g)}
                                className="w-full"
                            >
                                {grouped.length === 0 && (
                                    <div className="p-3 text-sm text-muted-foreground">
                                        Tidak ada permission.
                                    </div>
                                )}
                                {grouped.map(([group, perms]) => {
                                    const groupAll = isGroupAllSelected(perms);
                                    const groupSelectedCount = perms.reduce(
                                        (acc, p) =>
                                            acc + (selected.has(p.id) ? 1 : 0),
                                        0,
                                    );
                                    return (
                                        <AccordionItem
                                            key={group}
                                            value={group}
                                            className="border-b"
                                        >
                                            <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                                <div className="flex w-full items-center gap-3">
                                                    <Checkbox
                                                        checked={groupAll}
                                                        onCheckedChange={() =>
                                                            toggleGroup(perms)
                                                        }
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                                        <span className="truncate font-medium capitalize">
                                                            {group}
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className="ml-auto"
                                                        >
                                                            {groupSelectedCount}
                                                            /{perms.length}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="divide-y">
                                                    {perms.map((p) => (
                                                        <label
                                                            key={p.id}
                                                            className="flex cursor-pointer items-center gap-3 p-3 pl-9"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <Checkbox
                                                                checked={selected.has(
                                                                    p.id,
                                                                )}
                                                                onCheckedChange={(
                                                                    v,
                                                                ) =>
                                                                    toggle(
                                                                        p.id,
                                                                        !!v,
                                                                    )
                                                                }
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">
                                                                    {p.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        p.guard_name
                                                                    }
                                                                </span>
                                                            </div>
                                                            {selected.has(
                                                                p.id,
                                                            ) && (
                                                                <Badge
                                                                    className="ml-auto"
                                                                    variant="secondary"
                                                                >
                                                                    Dipilih
                                                                </Badge>
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="mt-4 flex items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                        Dipilih:{' '}
                        <span className="font-medium">{countSelected}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={close}
                            disabled={saving}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={submit}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                    Menyimpan…
                                </>
                            ) : (
                                'Simpan'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
