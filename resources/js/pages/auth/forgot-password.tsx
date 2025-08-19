import { Form } from '@inertiajs/react';
import { AtSign, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Link } from '@inertiajs/react';

export default function ForgotPassword({ status }: { status?: string }) {
    useEffect(() => {
        if (status) {
            toast.success(status);
        }
    }, [status]);

    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
            content={
                <div className="space-y-6">
                    <Form method="post" action={route('password.email')}>
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <AtSign className="h-4 w-4 text-muted-foreground" />
                                        </span>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="off"
                                            autoFocus
                                            placeholder="email@example.com"
                                            aria-invalid={Boolean(errors.email)}
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-red-500 dark:text-red-400">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="my-6 flex items-center justify-start">
                                    <Button
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Email password reset link
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>

                    <div className="text-center text-sm text-muted-foreground">
                        <span>Or, return to </span>
                        <Link
                            href={route('login')}
                            className="font-medium text-foreground underline underline-offset-4"
                        >
                            log in
                        </Link>
                    </div>
                </div>
            }
        />
    );
}
