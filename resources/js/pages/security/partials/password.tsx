import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

export default function PasswordTab() {
    const [show, setShow] = useState<{
        current: boolean;
        new: boolean;
        confirm: boolean;
    }>({
        current: false,
        new: false,
        confirm: false,
    });

    const passwordForm = useForm<{
        current_password: string;
        password: string;
        password_confirmation: string;
    }>({ current_password: '', password: '', password_confirmation: '' });

    const onSubmitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.patch(route('security.password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset(
                    'current_password',
                    'password',
                    'password_confirmation',
                );
                toast.success('Password berhasil diperbarui.');
            },
            onError: () =>
                toast.error('Gagal memperbarui password. Periksa input Anda.'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ubah Password</CardTitle>
                <CardDescription>
                    Pastikan password kuat dan unik.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmitPassword} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="current_password">
                                Password Saat Ini
                            </Label>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    type={show.current ? 'text' : 'password'}
                                    placeholder="Masukan password saat ini"
                                    value={passwordForm.data.current_password}
                                    className="pr-10"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'current_password',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShow((s) => ({
                                            ...s,
                                            current: !s.current,
                                        }))
                                    }
                                    className="absolute right-0 top-0 h-full border-0 px-3 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                    tabIndex={-1}
                                    aria-label={
                                        show.current
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {show.current ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {passwordForm.errors.current_password && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.errors.current_password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password Baru</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={show.new ? 'text' : 'password'}
                                    placeholder="Masukan password baru"
                                    value={passwordForm.data.password}
                                    className="pr-10"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShow((s) => ({ ...s, new: !s.new }))
                                    }
                                    className="absolute right-0 top-0 h-full border-0 px-3 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                    tabIndex={-1}
                                    aria-label={
                                        show.new
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {show.new ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {passwordForm.errors.password && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.errors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">
                                Konfirmasi Password Baru
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={show.confirm ? 'text' : 'password'}
                                    placeholder="Konfirmasi password baru"
                                    value={
                                        passwordForm.data.password_confirmation
                                    }
                                    className="pr-10"
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShow((s) => ({
                                            ...s,
                                            confirm: !s.confirm,
                                        }))
                                    }
                                    className="absolute right-0 top-0 h-full border-0 px-3 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                    tabIndex={-1}
                                    aria-label={
                                        show.confirm
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {show.confirm ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="submit"
                            disabled={passwordForm.processing}
                        >
                            Simpan
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => passwordForm.reset()}
                        >
                            Reset
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
