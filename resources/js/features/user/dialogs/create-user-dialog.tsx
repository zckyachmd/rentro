import { router, useForm } from '@inertiajs/react';
import { UserPlus, X } from 'lucide-react';
import React, { useCallback, useRef } from 'react';

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
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { CreateUserDialogProps } from '@/types/management';

export default function CreateUserDialog({
    open,
    onOpenChange,
    roles,
    autoReload = true,
}: CreateUserDialogProps) {
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            email: '',
            phone: '',
            roles: [] as number[],
            force_password_change: true,
            send_verification: false,
        });

    const onInput = useCallback(
        (field: 'name' | 'email' | 'phone') =>
            (e: React.ChangeEvent<HTMLInputElement>) =>
                setData(field, e.target.value),
        [setData],
    );

    const close = useCallback(() => {
        onOpenChange(false);
        reset();
        clearErrors();
    }, [onOpenChange, reset, clearErrors]);

    const submit = useCallback(() => {
        clearErrors();
        post(route('management.users.store'), {
            preserveScroll: true,
            onSuccess: () => {
                if (autoReload) router.reload({ preserveUrl: true });
                close();
            },
        });
    }, [post, autoReload, close, clearErrors]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" /> Tambah Pengguna
                    </DialogTitle>
                    <DialogDescription>
                        Buat pengguna baru dan atur peran
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                    <div className="grid gap-1">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            ref={nameRef}
                            value={data.name}
                            onChange={onInput('name')}
                            placeholder="Nama lengkap"
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            ref={emailRef}
                            value={data.email}
                            onChange={onInput('email')}
                            placeholder="email@contoh.com"
                        />
                        <InputError message={errors.email} />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="phone">Telepon</Label>
                        <Input
                            id="phone"
                            value={data.phone}
                            onChange={onInput('phone')}
                            placeholder="08xxxxxxxxxx"
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="grid gap-1">
                        <Label>Peran</Label>
                        <Select
                            value=""
                            onValueChange={(v) =>
                                setData(
                                    'roles',
                                    Array.from(
                                        new Set([
                                            ...(data.roles ?? []),
                                            Number(v),
                                        ]),
                                    ),
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih peran" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                        {r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {(data.roles ?? []).map((rid) => {
                                const label =
                                    roles.find((r) => r.id === rid)?.name ||
                                    `#${rid}`;
                                return (
                                    <button
                                        key={rid}
                                        type="button"
                                        className="group inline-flex items-center gap-1 rounded border bg-muted/30 px-2 py-1 hover:bg-muted"
                                        onClick={() =>
                                            setData(
                                                'roles',
                                                (data.roles ?? []).filter(
                                                    (id) => id !== rid,
                                                ),
                                            )
                                        }
                                        title={`Hapus peran ${label}`}
                                    >
                                        <span>{label}</span>
                                        <X className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                                    </button>
                                );
                            })}
                        </div>
                        <InputError name="roles" />
                    </div>

                    <div className="grid gap-1">
                        <Label className="flex items-center gap-2 text-xs">
                            <Checkbox
                                checked={data.send_verification}
                                onCheckedChange={(v) =>
                                    setData('send_verification', Boolean(v))
                                }
                            />
                            Kirim email verifikasi
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={submit}
                    >
                        Daftarkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
