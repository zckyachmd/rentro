import { Form, Link } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import GuestLayout from '@/layouts/guest-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    useEffect(() => {
        if (status === 'verification-link-sent') {
            toast.success(
                'A new verification link has been sent to the email address you provided during registration.',
            );
        }
    }, [status]);

    return (
        <GuestLayout
            title="Verify email"
            description="Please verify your email address to continue."
            content={
                <Form
                    method="post"
                    action={route('verification.send')}
                    className="space-y-6 text-center"
                >
                    {({ processing }) => (
                        <>
                            <Button disabled={processing} variant="secondary">
                                {processing && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Resend verification email
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Or,{' '}
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    className="font-medium text-foreground underline underline-offset-4"
                                >
                                    log out
                                </Link>
                            </p>
                        </>
                    )}
                </Form>
            }
            fullWidthFooter={false}
        />
    );
}
