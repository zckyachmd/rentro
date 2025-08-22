import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import GuestLayout from '@/layouts/guest-layout';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AtSign, Eye, EyeOff, Loader2, Lock } from 'lucide-react';

type LoginForm = {
    login: string;
    password: string;
    remember: boolean;
};

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<LoginForm>({
            login: '',
            password: '',
            remember: false,
        });

    const [showPassword, setShowPassword] = useState(false);

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
                    {status && (
                        <div className="mb-6">
                            <Alert variant="default">
                                <AlertDescription className="text-sm">
                                    {status}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    <form onSubmit={submit} className="space-y-6">
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
                            {errors.login && (
                                <p className="text-sm text-red-500 dark:text-red-400">
                                    {errors.login}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                </span>

                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    autoComplete="current-password"
                                    placeholder="password"
                                    aria-invalid={Boolean(errors.password)}
                                    className="pl-10 pr-10"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-0 top-0 h-full border-0 px-3 hover:border-0 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                    tabIndex={-1}
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500 dark:text-red-400">
                                    {errors.password}
                                </p>
                            )}
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

                            {canResetPassword &&
                                typeof route === 'function' &&
                                route().has &&
                                route().has('password.request') && (
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

                        {typeof route === 'function' &&
                            route().has &&
                            route().has('register') && (
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
