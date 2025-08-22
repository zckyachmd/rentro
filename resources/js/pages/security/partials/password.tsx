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
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                                    type={
                                        showCurrentPassword
                                            ? 'text'
                                            : 'password'
                                    }
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
                                        setShowCurrentPassword((s) => !s)
                                    }
                                    className="absolute right-0 top-0 h-full border-0 px-3 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                    tabIndex={-1}
                                    aria-label={
                                        showCurrentPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showCurrentPassword ? (
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
                                    type={showNewPassword ? 'text' : 'password'}
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
                                        setShowNewPassword((s) => !s)
                                    }
                                    className="absolute right-0 top-0 h-full border-0 px-3 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                    tabIndex={-1}
                                    aria-label={
                                        showNewPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showNewPassword ? (
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
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
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
                                        setShowConfirmPassword((s) => !s)
                                    }
                                    className="absolute right-0 top-0 h-full border-0 px-3 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                    tabIndex={-1}
                                    aria-label={
                                        showConfirmPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showConfirmPassword ? (
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
