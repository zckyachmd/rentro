import { Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Info, XCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
import AuthLayout from '@/layouts/auth-layout';
import type { PaymentResultPageProps as PageProps } from '@/types/payment';

export default function PaymentResult(props: PageProps) {
    const { t } = useTranslation();
    const variant = (props.variant || 'finish') as
        | 'finish'
        | 'unfinish'
        | 'error';
    const backUrl = props.return_to || '/tenant/invoices';

    const meta = React.useMemo(() => {
        switch (variant) {
            case 'finish':
                return {
                    icon: (
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    ),
                    title: t('payment.result.finish.title'),
                    desc: t('payment.result.finish.desc'),
                    action: t('payment.result.finish.action'),
                } as const;
            case 'unfinish':
                return {
                    icon: <Info className="h-12 w-12 text-amber-500" />,
                    title: t('payment.result.unfinish.title'),
                    desc: t('payment.result.unfinish.desc'),
                    action: t('payment.result.unfinish.action'),
                } as const;
            case 'error':
            default:
                return {
                    icon: <XCircle className="h-12 w-12 text-red-600" />,
                    title: t('payment.result.error.title'),
                    desc: t('payment.result.error.desc'),
                    action: t('payment.result.error.action'),
                } as const;
        }
    }, [variant, t]);

    return (
        <AuthLayout
            pageTitle={meta.title}
            pageDescription={t('payment.result.page_desc')}
        >
            <div className="bg-card mx-auto mt-6 max-w-lg rounded-lg border p-6 text-center">
                <div className="mb-3 flex items-center justify-center">
                    {meta.icon}
                </div>
                <h1 className="mb-1 text-xl font-semibold">{meta.title}</h1>
                <p className="text-muted-foreground mx-auto max-w-md text-sm">
                    {meta.desc}
                </p>
                {props.provider ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                        {t('payment.result.provider_label')} {props.provider}
                    </p>
                ) : null}

                <div className="mt-6 flex items-center justify-center gap-2">
                    <Button asChild>
                        <Link href={backUrl}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> {meta.action}
                        </Link>
                    </Button>
                    <CopyInline
                        value={backUrl}
                        as="span"
                        className="cursor-pointer underline"
                        successMessage={t('common.link_copied')}
                    >
                        {t('common.copy_link')}
                    </CopyInline>
                </div>
            </div>
        </AuthLayout>
    );
}
