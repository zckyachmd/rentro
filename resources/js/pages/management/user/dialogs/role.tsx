'use client';

import { router } from '@inertiajs/react';
import { Loader2, Search, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

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
import type { RoleDialogProps } from '@/types/management';

export function RoleDialog({
    open,
    onOpenChange,
    user,
    roles,
    autoReload = true,
}: RoleDialogProps) {
    const [query, setQuery] = React.useState('');
    const [selected, setSelected] = React.useState<Set<number>>(
        () => new Set((user.roles ?? []).map((r) => r.id)),
    );
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open) setSelected(new Set((user.roles ?? []).map((r) => r.id)));
    }, [open, user.id, user.roles]);

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter((r) => r.name.toLowerCase().includes(q));
    }, [roles, query]);

    const toggle = React.useCallback((id: number, checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const handleToggleAll = React.useCallback(() => {
        setSelected((prev) =>
            prev.size === roles.length
                ? new Set()
                : new Set(roles.map((r) => r.id)),
        );
    }, [roles]);

    const handleSubmit = React.useCallback(() => {
        const roleIds = Array.from(selected);
        setSaving(true);
        router.post(
            route('management.users.roles.update', user.id),
            { _method: 'put', role_ids: roleIds },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Peran berhasil diperbarui');
                    if (autoReload) router.reload({ preserveUrl: true });
                    onOpenChange(false);
                },
                onError: (errors: Record<string, string>) => {
                    const message =
                        errors.role_ids ||
                        errors.roles ||
                        Object.values(errors)[0] ||
                        'Gagal memperbarui peran';
                    toast.error(message);
                },
                onFinish: () => setSaving(false),
            },
        );
    }, [selected, user.id, onOpenChange, autoReload]);

    const countSelected = selected.size;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" /> Kelola Peran
                    </DialogTitle>
                    <DialogDescription>
                        Pilih atau ubah peran yang dimiliki pengguna ini.
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-2 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                        <Input
                            placeholder="Cari peran…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleToggleAll}
                    >
                        {selected.size === roles.length
                            ? 'Hapus semua'
                            : 'Pilih semua'}
                    </Button>
                </div>

                <ScrollArea className="max-h-72 rounded-md border">
                    <div className="divide-y">
                        {filtered.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Tidak ada peran
                            </div>
                        ) : (
                            filtered.map((role) => {
                                const checked = selected.has(role.id);
                                return (
                                    <label
                                        key={role.id}
                                        className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/40"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(v) =>
                                                toggle(role.id, Boolean(v))
                                            }
                                        />
                                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                            <div className="truncate">
                                                {role.name}
                                            </div>
                                            {checked ? (
                                                <Badge variant="outline">
                                                    Dipilih
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Terpilih:{' '}
                            <span className="font-medium text-foreground">
                                {countSelected}
                            </span>
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                        Simpan…
                                    </>
                                ) : (
                                    'Simpan'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
