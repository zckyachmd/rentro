import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import OtpInput from '@/components/ui/otp-input';
import AuthLayout from '@/layouts/auth-layout';

export default function TwoFactorChallenge() {
    const form = useForm<{ token: string }>({ token: '' });
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.twofactor.title')}
            description={t('auth.twofactor.desc')}
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
                            {t('auth.twofactor.label')}
                        </Label>
                        <OtpInput
                            id="token"
                            placeholder={t('auth.twofactor.placeholder')}
                            value={form.data.token}
                            onChange={(v) => form.setData('token', v)}
                            aria-invalid={Boolean(form.errors.token)}
                        />
                        <InputError message={form.errors.token} />
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
                            {t('auth.twofactor.submit')}
                        </Button>
                    </div>
                </form>
            }
            fullWidthFooter={false}
        />
    );
}
