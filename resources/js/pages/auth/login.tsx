import { Link, useForm } from '@inertiajs/react';
import { AtSign, Loader2, Lock } from 'lucide-react';
import { FormEventHandler } from 'react';

import PasswordInput from '@/components/form/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
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
            title="Sign in"
            description="Use your email/username and password to sign in."
            content={
                <>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="grid gap-2">
                                <Label htmlFor="login">Email or username</Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <AtSign className="h-4 w-4 text-muted-foreground" />
                                    </span>
                                    <Input
                                        id="login"
                                        name="login"
                                        type="text"
                                        value={data.login}
                                        autoComplete="username"
                                        placeholder="email or username"
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
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    placeholder="password"
                                    aria-invalid={Boolean(errors.password)}
                                    leftAdornment={
                                        <Lock className="h-4 w-4 text-muted-foreground" />
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
                                <span className="text-sm text-muted-foreground">
                                    Remember me
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                                >
                                    Forgot password?
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
                                    Processing...
                                </span>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                        {canRegister && (
                            <div className="space-y-3">
                                <Separator />
                                <p className="text-center text-sm text-muted-foreground">
                                    Don’t have an account?{' '}
                                    <Link
                                        href={route('register')}
                                        className="font-medium text-foreground underline underline-offset-4"
                                    >
                                        Create one
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
