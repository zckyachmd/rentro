import { Form } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/ui/password-input';
import { AuthLayout } from '@/layouts';

export default function ResetPassword({
    email,
    token,
}: {
    email: string;
    token: string;
}) {
    const { t } = useTranslation();
    return (
        <>
            <AuthLayout
                title={t('auth.reset.title')}
                description={t('auth.reset.desc')}
                content={
                    <Form
                        method="post"
                        action={route('password.store')}
                        transform={(data) => ({
                            ...data,
                            token,
                            email,
                        })}
                        onError={() => {}}
                    >
                        {({ processing, errors }) => (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            {t('auth.reset.new_password_label')}
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="********"
                                            aria-invalid={Boolean(
                                                errors.password,
                                            )}
                                            className="pl-10"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">
                                            {t(
                                                'auth.reset.confirm_password_label',
                                            )}
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            placeholder="********"
                                            aria-invalid={Boolean(
                                                errors.password_confirmation,
                                            )}
                                            className="pl-10"
                                        />
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={processing}
                                >
                                    {processing
                                        ? t('auth.reset.processing')
                                        : t('auth.reset.submit')}
                                </Button>
                            </div>
                        )}
                    </Form>
                }
            />
        </>
    );
}
