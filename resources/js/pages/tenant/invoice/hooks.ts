import React from 'react';
import { toast } from 'sonner';

import type { TenantInvoiceDTO, PendingInfo } from '@/types/tenant';

export function useInvoiceLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<TenantInvoiceDTO | null>(null);
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
                if (!controller.signal.aborted)
                    setData(json as TenantInvoiceDTO);
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
            const d = Math.floor(diff / 86_400_000);
            const h = Math.floor((diff % 86_400_000) / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            const s = Math.floor((diff % 60_000) / 1000);
            const pad = (n: number) => String(n).padStart(2, '0');
            const dh = d > 0 ? `${d}d ` : '';
            setRemaining(`${dh}${pad(h)}:${pad(m)}:${pad(s)}`);
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
