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
        <Dialog
            open={open}
            onOpenChange={(v) => {
                onOpenChange(v);
                if (!v) close();
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Tambah Pengguna
                    </DialogTitle>
                    <DialogDescription>
                        Buat akun baru untuk pengguna. Sistem akan mengirimkan
                        tautan setel password (reset link) dan opsional
                        verifikasi email.
                    </DialogDescription>
                </DialogHeader>

                <form
                    noValidate
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                    }}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">
                            Nama <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Nama lengkap"
                            ref={nameRef}
                            value={data.name}
                            onChange={onInput('name')}
                            autoComplete="name"
                            required
                            disabled={processing}
                            aria-invalid={Boolean(errors.name) || undefined}
                            aria-describedby={
                                errors.name ? 'name-error' : undefined
                            }
                        />
                        {errors.name && (
                            <p
                                id="name-error"
                                className="text-sm text-destructive"
                            >
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="nama@email.com"
                            ref={emailRef}
                            value={data.email}
                            onChange={onInput('email')}
                            autoComplete="email"
                            required
                            disabled={processing}
                            aria-invalid={Boolean(errors.email) || undefined}
                            aria-describedby={
                                errors.email ? 'email-error' : undefined
                            }
                        />
                        {errors.email && (
                            <p
                                id="email-error"
                                className="text-sm text-destructive"
                            >
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telepon</Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="08xxxxxxxxxx"
                            value={data.phone}
                            onChange={onInput('phone')}
                            autoComplete="tel"
                            inputMode="tel"
                            disabled={processing}
                            aria-invalid={Boolean(errors.phone) || undefined}
                            aria-describedby={
                                errors.phone ? 'phone-error' : undefined
                            }
                        />
                        {errors.phone && (
                            <p
                                id="phone-error"
                                className="text-sm text-destructive"
                            >
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Peran <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.roles[0] ? String(data.roles[0]) : ''}
                            onValueChange={(v) => setData('roles', [Number(v)])}
                            disabled={processing}
                        >
                            <SelectTrigger
                                disabled={processing}
                                aria-invalid={
                                    Boolean(errors.roles) || undefined
                                }
                            >
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
                        {errors.roles && (
                            <p className="text-sm text-destructive">
                                {String(errors.roles)}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="fpc"
                            name="force_password_change"
                            checked={data.force_password_change}
                            onCheckedChange={(v) =>
                                setData('force_password_change', Boolean(v))
                            }
                            disabled={processing}
                        />
                        <Label htmlFor="fpc">
                            Paksa ganti password saat login pertama
                        </Label>
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="sv"
                            name="send_verification"
                            checked={data.send_verification}
                            onCheckedChange={(v) =>
                                setData('send_verification', Boolean(v))
                            }
                            disabled={processing}
                        />
                        <Label htmlFor="sv">Kirim email verifikasi</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={close}
                            type="button"
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button disabled={processing} type="submit">
                            {processing ? 'Menyimpan…' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
