import { Form, Link } from '@inertiajs/react';
import { AtSign, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/layouts';

export default function ForgotPassword() {
    const { t } = useTranslation();
    return (
        <AuthLayout
            title={t('auth.forgot.title')}
            description={t('auth.forgot.desc')}
            content={
                <div className="space-y-4">
                    <Form method="post" action={route('password.email')}>
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        {t('auth.forgot.email_label')}
                                    </Label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <AtSign className="text-muted-foreground h-4 w-4" />
                                        </span>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="off"
                                            autoFocus
                                            placeholder={t(
                                                'auth.register.email_placeholder',
                                            )}
                                            aria-invalid={Boolean(errors.email)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                <div className="my-6 flex items-center justify-start">
                                    <Button
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {t('auth.forgot.submit')}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>

                    <div className="text-muted-foreground text-center text-sm">
                        <span>
                            {t('auth.or')} {t('auth.forgot.return')}{' '}
                        </span>
                        <Link
                            href={route('login')}
                            className="text-foreground font-medium underline underline-offset-4"
                        >
                            {t('auth.login.submit')}
                        </Link>
                    </div>
                </div>
            }
        />
    );
}
