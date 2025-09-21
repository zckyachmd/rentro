import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    XCircle,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MidtransResultPageProps as PageProps } from '@/types/payment';

export default function MidtransResultPage(props: PageProps) {
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
                    title: 'Pembayaran Berhasil',
                    desc: 'Terima kasih, transaksi Anda telah diproses.',
                    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
                };
            case 'unfinish':
                return {
                    title: 'Transaksi Belum Selesai',
                    desc: 'Anda dapat melanjutkan pembayaran kapan saja.',
                    icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
                };
            default:
                return {
                    title: 'Terjadi Kesalahan',
                    desc: 'Maaf, terdapat kendala saat memproses transaksi.',
                    icon: <XCircle className="h-6 w-6 text-red-600" />,
                };
        }
    }, [variant]);

    return (
        <div className="mx-auto max-w-3xl p-4">
            <div className="mb-6 flex items-center gap-3">
                {meta.icon}
                <div>
                    <h1 className="text-xl font-semibold leading-tight">
                        {meta.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">{meta.desc}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ringkasan Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <InfoRow label="Order ID" value={order_id || '-'} />
                        <InfoRow
                            label="Status Kode"
                            value={status_code || '-'}
                        />
                        <InfoRow
                            label="Transaksi"
                            value={transaction_status || '-'}
                        />
                        <InfoRow label="Fraud" value={fraud_status || '-'} />
                        <InfoRow
                            label="Jumlah"
                            value={
                                gross_amount
                                    ? `Rp ${Number(gross_amount).toLocaleString('id-ID')}`
                                    : '-'
                            }
                        />
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-2">
                        <Button asChild>
                            <Link href={return_to}>
                                <ExternalLink className="mr-2 h-4 w-4" />{' '}
                                Kembali ke Tagihan
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
            <div className="break-all text-right font-medium">{value}</div>
        </div>
    );
}
