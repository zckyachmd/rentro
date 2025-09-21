import { Form } from '@inertiajs/react';
import { Loader2, Lock } from 'lucide-react';

import PasswordInput from '@/components/form/password-input';
import { Button } from '@/components/ui/button';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/guest-layout';

export default function ConfirmPassword() {
    return (
        <GuestLayout
            title="Confirm your password"
            description="This is a secure area of the application. Please confirm your password before continuing."
            content={
                <Form
                    method="post"
                    action={route('password.confirm')}
                    resetOnSuccess={['password']}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    autoFocus
                                    className="pl-9"
                                    leftAdornment={
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    }
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                >
                                    {processing && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Confirm password
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            }
            contentFooter={
                <Button
                    variant="link"
                    type="button"
                    onClick={() => window.history.back()}
                >
                    Back
                </Button>
            }
            fullWidthFooter={false}
        />
    );
}
