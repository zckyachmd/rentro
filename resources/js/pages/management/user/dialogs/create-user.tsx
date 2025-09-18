import { router, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import React, { useCallback, useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

export type CreateUserDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    roles: { id: number; name: string }[];
    autoReload?: boolean;
};

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
            send_verification: true,
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
                toast.success('Pengguna berhasil dibuat.');
                if (autoReload) router.reload({ preserveUrl: true });
                close();
            },
            onError: (errs) => {
                const first = Object.values(errs)[0];
                const msg = Array.isArray(first) ? first[0] : first;
                toast.error(msg || 'Gagal menyimpan, periksa isian Anda.');
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
                <div className="space-y-3 text-sm">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            ref={nameRef}
                            value={data.name}
                            onChange={onInput('name')}
                            placeholder="Nama lengkap"
                        />
                        {errors.name ? (
                            <div className="text-xs text-destructive">
                                {errors.name}
                            </div>
                        ) : null}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            ref={emailRef}
                            value={data.email}
                            onChange={onInput('email')}
                            placeholder="email@contoh.com"
                        />
                        {errors.email ? (
                            <div className="text-xs text-destructive">
                                {errors.email}
                            </div>
                        ) : null}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telepon</Label>
                        <Input
                            id="phone"
                            value={data.phone}
                            onChange={onInput('phone')}
                            placeholder="08xxxxxxxxxx"
                        />
                        {errors.phone ? (
                            <div className="text-xs text-destructive">
                                {errors.phone}
                            </div>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
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
                            {(data.roles ?? []).map((rid) => (
                                <button
                                    key={rid}
                                    type="button"
                                    className="rounded border bg-muted/30 px-2 py-1 hover:bg-muted"
                                    onClick={() =>
                                        setData(
                                            'roles',
                                            (data.roles ?? []).filter(
                                                (id) => id !== rid,
                                            ),
                                        )
                                    }
                                    title="Hapus peran"
                                >
                                    #{rid}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2 text-xs">
                            <Checkbox
                                checked={data.force_password_change}
                                onCheckedChange={(v) =>
                                    setData('force_password_change', Boolean(v))
                                }
                            />
                            Wajib ubah password saat login
                        </Label>
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
                <div className="flex items-center justify-between px-6 pb-5 pt-2">
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
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
