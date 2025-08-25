'use client';

import { router } from '@inertiajs/react';
import { Loader2, Search, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

import { UserRow } from '.';

export type Role = { id: number; name: string };

type RoleDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserRow;
    roles: Role[];
    autoReload?: boolean;
};

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
        if (open) {
            setSelected(new Set((user.roles ?? []).map((r) => r.id)));
        }
    }, [open, user.id, user.roles]);

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter((r) => r.name.toLowerCase().includes(q));
    }, [roles, query]);

    const toggle = React.useCallback((id: number, checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }, []);

    const handleToggleAll = React.useCallback(() => {
        setSelected((prev) => {
            if (prev.size === roles.length) {
                return new Set();
            }
            return new Set(roles.map((r) => r.id));
        });
    }, [roles]);

    const handleSubmit = React.useCallback(() => {
        const roleIds = Array.from(selected);

        setSaving(true);
        router.put(
            route('management.users.roles.update', user.id),
            { role_ids: roleIds },
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
                onFinish: () => {
                    setSaving(false);
                },
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
                        Pilih atau ubah peran yang dimiliki pengguna ini. Peran
                        akan menentukan hak akses dan menu yang dapat digunakan.
                    </DialogDescription>
                </DialogHeader>

                {/* User heading */}
                <div className="mb-3 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        {user.avatar ? (
                            <AvatarImage src={user.avatar} alt={user.name} />
                        ) : (
                            <AvatarFallback>{user.initials}</AvatarFallback>
                        )}
                    </Avatar>
                    <div className="min-w-0">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                            {user.email}
                        </div>
                    </div>
                </div>

                {/* Controls */}
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

                {/* Roles list */}
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
                                                toggle(role.id, !!v)
                                            }
                                            aria-label={`Pilih ${role.name}`}
                                        />
                                        <span className="text-sm">
                                            {role.name}
                                        </span>
                                        {checked && (
                                            <Badge
                                                className="ml-auto"
                                                variant="secondary"
                                            >
                                                Dipilih
                                            </Badge>
                                        )}
                                    </label>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4 flex items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                        Dipilih:{' '}
                        <span className="font-medium">{countSelected}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
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
