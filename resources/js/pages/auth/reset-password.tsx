import { Form } from '@inertiajs/react';

import PasswordInput from '@/components/form/password-input';
import { Button } from '@/components/ui/button';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/guest-layout';

export default function ResetPassword({
    email,
    token,
}: {
    email: string;
    token: string;
}) {
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
                        onError={() => {}}
                    >
                        {({ processing, errors }) => (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            New password
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="********"
                                            aria-invalid={Boolean(
                                                errors.password,
                                            )}
                                            className="pl-10"
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
                                            placeholder="********"
                                            aria-invalid={Boolean(
                                                errors.password_confirmation,
                                            )}
                                            className="pl-10"
                                        />
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>
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
