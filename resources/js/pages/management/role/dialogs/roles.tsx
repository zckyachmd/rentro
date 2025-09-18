'use client';

import { router } from '@inertiajs/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { RoleUpsertDialogProps } from '@/types/management';

export default function RoleUpsertDialog({
    open,
    role,
    onOpenChange,
    onSuccess,
    guards = ['web', 'api'],
}: RoleUpsertDialogProps) {
    const isEdit = !!role?.id;
    const [saving, setSaving] = React.useState(false);
    const [form, setForm] = React.useState({
        name: '',
        guard_name: guards[0] ?? 'web',
    });

    React.useEffect(() => {
        setForm({
            name: role?.name ?? '',
            guard_name: role?.guard_name ?? guards[0] ?? 'web',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role?.id, guards.join(':')]);

    const close = React.useCallback(
        () => onOpenChange?.(false),
        [onOpenChange],
    );
    const canSubmit = form.name.trim().length > 0 && !saving;

    type UpsertPayload = { name: string; guard_name: string; _method?: 'PUT' };
    const submit = React.useCallback(() => {
        if (!canSubmit) return;
        const url = isEdit
            ? route('management.roles.update', role!.id)
            : route('management.roles.store');
        const payload: UpsertPayload = isEdit
            ? { ...form, _method: 'PUT' as const }
            : { ...form };
        router.post(url, payload, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            onSuccess: () => {
                onSuccess?.();
                close();
            },
        });
    }, [canSubmit, isEdit, role, form, onSuccess, close]);

    return (
        <Dialog open={open} onOpenChange={(v) => (v ? undefined : close())}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>
                            {isEdit ? 'Edit Role' : 'Buat Role'}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {isEdit
                            ? 'Ubah nama dan guard role. Perubahan akan langsung diterapkan.'
                            : 'Buat role baru dan tentukan guard-nya.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="role-name">Nama</Label>
                        <Input
                            id="role-name"
                            autoFocus
                            value={form.name}
                            onChange={(e) =>
                                setForm((s) => ({ ...s, name: e.target.value }))
                            }
                            placeholder={
                                isEdit ? 'mis. Manajer' : 'mis. Supervisor'
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Nama harus unik dan deskriptif, mis. "Manajer
                            Operasional".
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label>Guard</Label>
                        <Select
                            value={form.guard_name}
                            onValueChange={(v) =>
                                setForm((s) => ({ ...s, guard_name: v }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {guards.map((g) => (
                                    <SelectItem key={g} value={g}>
                                        {g}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={close}>
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSubmit}
                        onClick={submit}
                    >
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
