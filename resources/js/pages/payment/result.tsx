import { ArrowLeft, CheckCircle2, Info, XCircle } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

type PageProps = {
    variant?: 'finish' | 'unfinish' | 'error';
    return_to?: string;
    provider?: string | null;
};

function useCopy(url?: string) {
    const [copied, setCopied] = React.useState(false);
    const copy = React.useCallback(async () => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // ignore
        }
    }, [url]);
    return { copied, copy } as const;
}

export default function PaymentResult(props: PageProps) {
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
                    title: 'Pembayaran Berhasil',
                    desc: 'Terima kasih. Pembayaran Anda telah diproses.',
                    action: 'Kembali ke Pembayaran',
                } as const;
            case 'unfinish':
                return {
                    icon: <Info className="h-12 w-12 text-amber-500" />,
                    title: 'Pembayaran Belum Selesai',
                    desc: 'Anda dapat melanjutkan proses pembayaran dari halaman pembayaran.',
                    action: 'Kembali ke Pembayaran',
                } as const;
            case 'error':
            default:
                return {
                    icon: <XCircle className="h-12 w-12 text-red-600" />,
                    title: 'Terjadi Kesalahan',
                    desc: 'Pembayaran gagal diproses. Silakan coba lagi dari halaman pembayaran.',
                    action: 'Kembali ke Pembayaran',
                } as const;
        }
    }, [variant]);

    const { copied, copy } = useCopy(backUrl);

    return (
        <AuthLayout
            pageTitle={meta.title}
            pageDescription="Ringkasan redirect pembayaran"
        >
            <div className="mx-auto mt-6 max-w-lg rounded-lg border bg-card p-6 text-center">
                <div className="mb-3 flex items-center justify-center">
                    {meta.icon}
                </div>
                <h1 className="mb-1 text-xl font-semibold">{meta.title}</h1>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    {meta.desc}
                </p>
                {props.provider ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Provider: {props.provider}
                    </p>
                ) : null}

                <div className="mt-6 flex items-center justify-center gap-2">
                    <Button asChild>
                        <a href={backUrl}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> {meta.action}
                        </a>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={copy}
                        title="Salin tautan"
                    >
                        {copied ? 'Disalin' : 'Salin Tautan'}
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
