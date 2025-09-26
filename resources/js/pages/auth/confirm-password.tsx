import { Form } from '@inertiajs/react';
import { Loader2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/ui/password-input';
import GuestLayout from '@/layouts/guest-layout';

export default function ConfirmPassword() {
    const { t } = useTranslation();
    return (
        <GuestLayout
            title={t('auth.confirm.title')}
            description={t('auth.confirm.desc')}
            content={
                <Form
                    method="post"
                    action={route('password.confirm')}
                    resetOnSuccess={['password']}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    {t('auth.password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder={t('auth.password_placeholder')}
                                    autoComplete="current-password"
                                    autoFocus
                                    className="pl-9"
                                    leftAdornment={
                                        <Lock className="text-muted-foreground h-4 w-4" />
                                    }
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                >
                                    {processing && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t('auth.confirm.submit')}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            }
            contentFooter={
                <Button
                    variant="link"
                    type="button"
                    onClick={() => window.history.back()}
                >
                    {t('common.back')}
                </Button>
            }
            fullWidthFooter={false}
        />
    );
}
