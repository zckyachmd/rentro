import { Link, useForm } from '@inertiajs/react';
import { AtSign, Loader2, Lock, User } from 'lucide-react';
import { FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/ui/password-input';
import { Separator } from '@/components/ui/separator';
import AuthLayout from '@/layouts/auth-layout';
import type { RegisterForm } from '@/types/auth';

export default function Register() {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<RegisterForm>({
            name: '',
            username: '',
            email: '',
            password: '',
            password_confirmation: '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onStart: () => {
                clearErrors();
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={t('auth.register.title')}
            description={t('auth.register.desc')}
            content={
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                {t('auth.register.name_label')}
                            </Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <User className="text-muted-foreground h-4 w-4" />
                                </span>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    value={data.name}
                                    placeholder={t(
                                        'auth.register.name_placeholder',
                                    )}
                                    aria-invalid={Boolean(errors.name)}
                                    className="pl-10"
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username">
                                {t('auth.register.username_label')}
                            </Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <User className="text-muted-foreground h-4 w-4" />
                                </span>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    value={data.username}
                                    placeholder={t(
                                        'auth.register.username_placeholder',
                                    )}
                                    aria-invalid={Boolean(errors.username)}
                                    className="pl-10"
                                    onChange={(e) =>
                                        setData('username', e.target.value)
                                    }
                                />
                            </div>
                            <InputError message={errors.username} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">
                                {t('auth.register.email_label')}
                            </Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <AtSign className="text-muted-foreground h-4 w-4" />
                                </span>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={data.email}
                                    placeholder={t(
                                        'auth.register.email_placeholder',
                                    )}
                                    aria-invalid={Boolean(errors.email)}
                                    className="pl-10"
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                {t('auth.password')}
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                value={data.password}
                                placeholder={t('auth.password_placeholder')}
                                aria-invalid={Boolean(errors.password)}
                                className="pl-10"
                                leftAdornment={
                                    <Lock className="text-muted-foreground h-4 w-4" />
                                }
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                {t('auth.register.confirm_label')}
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                placeholder={t(
                                    'auth.register.confirm_placeholder',
                                )}
                                aria-invalid={Boolean(
                                    errors.password_confirmation,
                                )}
                                className="pl-10"
                                leftAdornment={
                                    <Lock className="text-muted-foreground h-4 w-4" />
                                }
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={processing}
                    >
                        {processing ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('auth.register.processing')}
                            </span>
                        ) : (
                            t('auth.register.submit')
                        )}
                    </Button>

                    <div className="space-y-3">
                        <Separator />
                        <p className="text-muted-foreground text-center text-sm">
                            {t('auth.register.already_have')}{' '}
                            <Link
                                href={route('login')}
                                className="text-foreground font-medium underline underline-offset-4"
                            >
                                {t('auth.login.submit')}
                            </Link>
                        </p>
                    </div>
                </form>
            }
        />
    );
}
