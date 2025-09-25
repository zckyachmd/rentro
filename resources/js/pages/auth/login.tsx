import { Link, useForm } from '@inertiajs/react';
import { AtSign, Loader2, Lock } from 'lucide-react';
import { FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/ui/password-input';
import { Separator } from '@/components/ui/separator';
import GuestLayout from '@/layouts/guest-layout';
import type { LoginForm } from '@/types/auth';

export default function Login({
    canResetPassword,
    canRegister,
}: {
    canResetPassword: boolean;
    canRegister: boolean;
}) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<LoginForm>({
            login: '',
            password: '',
            remember: false,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onStart: () => {
                clearErrors();
            },
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title={t('auth.login.title')}
            description={t('auth.login.desc')}
            content={
                <>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="grid gap-2">
                                <Label htmlFor="login">
                                    {t('auth.login.login_label')}
                                </Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <AtSign className="text-muted-foreground h-4 w-4" />
                                    </span>
                                    <Input
                                        id="login"
                                        name="login"
                                        type="text"
                                        value={data.login}
                                        autoComplete="username"
                                        placeholder={t(
                                            'auth.login.login_placeholder',
                                        )}
                                        aria-invalid={Boolean(errors.login)}
                                        className="pl-10"
                                        onChange={(e) =>
                                            setData('login', e.target.value)
                                        }
                                    />
                                </div>
                                <InputError message={errors.login} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    {t('auth.password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    placeholder={t('auth.password_placeholder')}
                                    aria-invalid={Boolean(errors.password)}
                                    leftAdornment={
                                        <Lock className="text-muted-foreground h-4 w-4" />
                                    }
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                <InputError message={errors.password} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) =>
                                        setData('remember', Boolean(checked))
                                    }
                                />
                                <span className="text-muted-foreground text-sm">
                                    {t('auth.remember')}
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
                                >
                                    {t('auth.forgot.link', 'Forgot?')}
                                </Link>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t('common.processing')}
                                </span>
                            ) : (
                                t('auth.login.submit')
                            )}
                        </Button>
                        {canRegister && (
                            <div className="space-y-3">
                                <Separator />
                                <p className="text-muted-foreground text-center text-sm">
                                    {t('auth.login.no_account')}{' '}
                                    <Link
                                        href={route('register')}
                                        className="text-foreground font-medium underline underline-offset-4"
                                    >
                                        {t('auth.login.register_link')}
                                    </Link>
                                </p>
                            </div>
                        )}
                    </form>
                </>
            }
        />
    );
}
