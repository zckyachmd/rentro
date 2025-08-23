import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/guest-layout';

export default function TwoFactorChallenge() {
    const form = useForm<{ token: string }>({ token: '' });

    return (
        <GuestLayout
            title="Two-factor Authentication"
            description="Masukkan OTP 6 digit dari aplikasi autentikator Anda atau recovery code yang Anda simpan."
            content={
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('twofactor.store'));
                    }}
                    className="space-y-4"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="token">
                            Kode OTP atau Recovery Code
                        </Label>
                        <Input
                            id="token"
                            placeholder="Contoh: 123456 atau 12345678-ABCDEFGH"
                            value={form.data.token}
                            onChange={(e) =>
                                form.setData('token', e.target.value)
                            }
                            autoComplete="one-time-code"
                            inputMode="text"
                            aria-invalid={Boolean(form.errors.token)}
                        />
                        {form.errors.token && (
                            <p className="text-sm text-red-500 dark:text-red-400">
                                {form.errors.token}
                            </p>
                        )}
                    </div>

                    <div className="my-2 flex items-center justify-start">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={form.processing}
                        >
                            {form.processing && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Verifikasi
                        </Button>
                    </div>
                </form>
            }
            fullWidthFooter={false}
        />
    );
}
