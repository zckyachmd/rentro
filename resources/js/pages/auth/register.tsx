import { Link, useForm } from '@inertiajs/react';
import { AtSign, Loader2, Lock, User } from 'lucide-react';
import { FormEventHandler } from 'react';

import PasswordInput from '@/components/form/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import GuestLayout from '@/layouts/guest-layout';
import type { RegisterForm } from '@/types/auth';

export default function Register() {
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
        <GuestLayout
            title="Register"
            description="Fill the fields below to get started."
            content={
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
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
                            <InputError message={errors.name} />
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
                            <InputError message={errors.username} />
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
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                value={data.password}
                                placeholder="password"
                                aria-invalid={Boolean(errors.password)}
                                className="pl-10"
                                leftAdornment={
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                }
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                placeholder="confirm your password"
                                aria-invalid={Boolean(
                                    errors.password_confirmation,
                                )}
                                className="pl-10"
                                leftAdornment={
                                    <Lock className="h-4 w-4 text-muted-foreground" />
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
