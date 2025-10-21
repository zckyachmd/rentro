import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    XCircle,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/format';
import type { MidtransResultPageProps as PageProps } from '@/types/payment';

export default function MidtransResultPage(props: PageProps) {
    const { t } = useTranslation();
    const {
        variant,
        order_id,
        status_code,
        transaction_status,
        fraud_status,
        gross_amount,
        return_to,
    } = props;

    const meta = React.useMemo(() => {
        switch (variant) {
            case 'finish':
                return {
                    title: t('payment.midtrans.finish.title'),
                    desc: t('payment.midtrans.finish.desc'),
                    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
                };
            case 'unfinish':
                return {
                    title: t('payment.midtrans.unfinish.title'),
                    desc: t('payment.midtrans.unfinish.desc'),
                    icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
                };
            default:
                return {
                    title: t('payment.midtrans.error.title'),
                    desc: t('payment.midtrans.error.desc'),
                    icon: <XCircle className="h-6 w-6 text-red-600" />,
                };
        }
    }, [variant, t]);

    return (
        <div className="mx-auto max-w-3xl p-4">
            <div className="mb-6 flex items-center gap-3">
                {meta.icon}
                <div>
                    <h1 className="text-xl leading-tight font-semibold">
                        {meta.title}
                    </h1>
                    <p className="text-muted-foreground text-sm">{meta.desc}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('payment.midtrans.summary.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <InfoRow
                            label={t('payment.midtrans.fields.order_id')}
                            value={order_id || '-'}
                        />
                        <InfoRow
                            label={t('payment.midtrans.fields.status_code')}
                            value={status_code || '-'}
                        />
                        <InfoRow
                            label={t('payment.midtrans.fields.transaction')}
                            value={transaction_status || '-'}
                        />
                        <InfoRow
                            label={t('payment.midtrans.fields.fraud')}
                            value={fraud_status || '-'}
                        />
                        <InfoRow
                            label={t('payment.midtrans.fields.amount')}
                            value={
                                gross_amount != null && gross_amount !== ''
                                    ? formatIDR(gross_amount)
                                    : '-'
                            }
                        />
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-2">
                        <Button asChild>
                            <Link href={return_to}>
                                <ExternalLink className="mr-2 h-4 w-4" />{' '}
                                {t('payment.midtrans.back_to_billing')}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground">{label}</div>
            <div className="text-right font-medium break-all">{value}</div>
        </div>
    );
}
