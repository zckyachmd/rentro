import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/guest-layout';
import { Form } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);

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
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 text-muted-foreground">
                                        <Lock className="h-4 w-4" />
                                    </span>
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        name="password"
                                        placeholder="Password"
                                        autoComplete="current-password"
                                        autoFocus
                                        className="pl-9 pr-10"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-0 h-full px-2 hover:border-0 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
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
                                    <p className="px-1 text-xs text-red-600 dark:text-red-400">
                                        {errors.password}
                                    </p>
                                )}
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
