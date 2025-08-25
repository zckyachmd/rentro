import { Link, useForm } from '@inertiajs/react';
import { AtSign, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import GuestLayout from '@/layouts/guest-layout';

type RegisterForm = {
    name: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<RegisterForm>({
            name: '',
            username: '',
            email: '',
            password: '',
            password_confirmation: '',
        });

    const [show, setShow] = useState<{ password: boolean; confirm: boolean }>({
        password: false,
        confirm: false,
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
        <GuestLayout
            title="Register"
            description="Fill the fields below to get started."
            content={
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full name</Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                value={data.name}
                                placeholder="your full name"
                                aria-invalid={Boolean(errors.name)}
                                className="pl-10"
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                        </div>
                        {errors.name && (
                            <p className="text-sm text-red-500 dark:text-red-400">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                value={data.username}
                                placeholder="choose a username"
                                aria-invalid={Boolean(errors.username)}
                                className="pl-10"
                                onChange={(e) =>
                                    setData('username', e.target.value)
                                }
                            />
                        </div>
                        {errors.username && (
                            <p className="text-sm text-red-500 dark:text-red-400">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <AtSign className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={data.email}
                                placeholder="you@example.com"
                                aria-invalid={Boolean(errors.email)}
                                className="pl-10"
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-500 dark:text-red-400">
                                {errors.email}
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
                                type={show.password ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={data.password}
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
                                className="absolute right-0 top-0 h-full border-0 px-3 hover:border-0 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                onClick={() =>
                                    setShow((s) => ({
                                        ...s,
                                        password: !s.password,
                                    }))
                                }
                                tabIndex={-1}
                                aria-label={
                                    show.password
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                            >
                                {show.password ? (
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

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                                id="password_confirmation"
                                name="password_confirmation"
                                type={show.confirm ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                placeholder="confirm your password"
                                aria-invalid={Boolean(
                                    errors.password_confirmation,
                                )}
                                className="pl-10 pr-10"
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full border-0 px-3 hover:border-0 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                tabIndex={-1}
                                onClick={() =>
                                    setShow((s) => ({
                                        ...s,
                                        confirm: !s.confirm,
                                    }))
                                }
                                aria-label={
                                    show.confirm
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                            >
                                {show.confirm ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {errors.password_confirmation && (
                            <p className="text-sm text-red-500 dark:text-red-400">
                                {errors.password_confirmation}
                            </p>
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
                                Creating account...
                            </span>
                        ) : (
                            'Create account'
                        )}
                    </Button>

                    <div className="space-y-3">
                        <Separator />
                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                href={route('login')}
                                className="font-medium text-foreground underline underline-offset-4"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            }
        />
    );
}
