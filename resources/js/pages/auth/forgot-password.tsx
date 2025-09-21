import { Form, Link } from '@inertiajs/react';
import { AtSign, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/guest-layout';

export default function ForgotPassword() {
    return (
        <GuestLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
            content={
                <div className="space-y-4">
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
