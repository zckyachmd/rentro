import { Form } from '@inertiajs/react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/guest-layout';

export default function ResetPassword({
    email,
    token,
}: {
    email: string;
    token: string;
}) {
    const [show, setShow] = useState<{ password: boolean; confirm: boolean }>({
        password: false,
        confirm: false,
    });

    return (
        <>
            <GuestLayout
                title="Reset password"
                description="Enter your new password below."
                content={
                    <Form
                        method="post"
                        action={route('password.store')}
                        transform={(data) => ({
                            ...data,
                            token,
                            email,
                        })}
                        onError={(errors) => {
                            const fieldErrors = [
                                'password',
                                'password_confirmation',
                            ];

                            const generalErrors = Object.entries(errors)
                                .filter(([key]) => !fieldErrors.includes(key))
                                .map(([, message]) => message);

                            if (generalErrors.length > 0) {
                                toast.error(generalErrors.join(' '));
                            }
                        }}
                    >
                        {({ processing, errors }) => (
                            <div className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New password
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                        </span>
                                        <Input
                                            id="password"
                                            name="password"
                                            type={
                                                show.password
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="new-password"
                                            placeholder="********"
                                            aria-invalid={Boolean(
                                                errors.password,
                                            )}
                                            className="pl-10 pr-10"
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
                                                    password: !s.password,
                                                }))
                                            }
                                        >
                                            {show.password ? (
                                                <EyeOff />
                                            ) : (
                                                <Eye />
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
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                        </span>
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={
                                                show.confirm
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="new-password"
                                            placeholder="********"
                                            aria-invalid={Boolean(
                                                errors.password_confirmation,
                                            )}
                                            className="pl-10 pr-10"
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
                                        >
                                            {show.confirm ? (
                                                <EyeOff />
                                            ) : (
                                                <Eye />
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
                                    {processing
                                        ? 'Resetting...'
                                        : 'Reset password'}
                                </Button>
                            </div>
                        )}
                    </Form>
                }
            />
        </>
    );
}
