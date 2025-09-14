import React from 'react';
import { toast } from 'sonner';

export type InvoiceItemMeta = {
    qty?: number;
    unit_price_cents?: number;
};

export type InvoiceData = {
    invoice: {
        id: string;
        number: string;
        status: string;
        due_date?: string | null;
        amount_cents: number;
        items: Array<{
            label: string;
            amount_cents: number;
            meta?: InvoiceItemMeta;
        }>;
    };
    payment_summary?: { outstanding: number };
};

export type PendingInfo = Partial<{
    payment_type: string;
    bank: string | null;
    va_number: string | null;
    expiry_time: string | null;
    pdf_url: string | null;
    payment_code: string | null;
    store: string | null;
}>;

export function useInvoiceLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<InvoiceData | null>(null);
    React.useEffect(() => {
        const controller = new AbortController();
        async function load() {
            if (!target) return;
            setLoading(true);
            try {
                const res = await fetch(
                    route('tenant.invoices.show', target.id),
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                        signal: controller.signal,
                    },
                );
                if (!res.ok) throw new Error('Gagal memuat invoice');
                const json = await res.json();
                if (!controller.signal.aborted) setData(json as InvoiceData);
            } catch (e) {
                void e; // no-op
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        load();
        return () => controller.abort();
    }, [target]);
    return { loading, data } as const;
}

export function usePendingLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [pending, setPending] = React.useState<PendingInfo | null>(null);
    const controllerRef = React.useRef<AbortController | null>(null);

    const load = React.useCallback(async () => {
        if (!target) return;
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        try {
            const res = await fetch(
                route('tenant.invoices.pay.status', target.id),
                {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                    signal: controller.signal,
                },
            );
            if (!res.ok) throw new Error('Gagal memuat status');
            const json = await res.json();
            if (!controller.signal.aborted)
                setPending((json?.pending ?? null) as PendingInfo | null);
        } catch (e) {
            void e; // no-op
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [target]);

    React.useEffect(() => {
        load();
        return () => controllerRef.current?.abort();
    }, [load]);

    return { loading, pending, reload: load } as const;
}

export function useCountdown(expiry?: string | null) {
    const [remaining, setRemaining] = React.useState<string | null>(null);
    React.useEffect(() => {
        if (!expiry) return setRemaining(null);
        const target = new Date(expiry).getTime();
        const tick = () => {
            const diff = Math.max(0, target - Date.now());
            if (diff <= 0) return setRemaining('00:00:00');
            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            const s = Math.floor((diff % 60_000) / 1000);
            const pad = (n: number) => String(n).padStart(2, '0');
            setRemaining(`${pad(h)}:${pad(m)}:${pad(s)}`);
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [expiry]);
    return remaining;
}

export function useCopyToast() {
    const [copied, setCopied] = React.useState(false);
    const copy = React.useCallback(async (text: string, success: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast.success(success);
        } catch {
            toast.message('Salin manual jika gagal.');
        }
    }, []);
    return { copied, copy } as const;
}
