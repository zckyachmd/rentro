import { Form, Link } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import GuestLayout from '@/layouts/guest-layout';

export default function VerifyEmail() {
    const { t } = useTranslation();
    return (
        <GuestLayout
            title={t('auth.verify.title')}
            description={t('auth.verify.desc')}
            content={
                <Form
                    method="post"
                    action={route('verification.send')}
                    className="space-y-4 text-center"
                >
                    {({ processing }) => (
                        <>
                            <Button disabled={processing} variant="secondary">
                                {processing && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t('auth.verify.resend_button')}
                            </Button>

                            <p className="text-muted-foreground text-center text-sm">
                                {t('auth.or')}{' '}
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    className="text-foreground font-medium underline underline-offset-4"
                                >
                                    {t('nav.logout')}
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
