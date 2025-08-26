'use client';

import { usePage } from '@inertiajs/react';
import * as React from 'react';
import { toast } from 'sonner';

export type FlashBag = {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
    message?: string;
    data?: unknown;
};

export type ToastKey = Exclude<keyof FlashBag, 'data'>;

export type CallbackBag = {
    success?: string;
    error?: string;
    data?: unknown;
};

type PageShared = {
    flash?: FlashBag;
    cb?: CallbackBag;
};

export type FlashToasterProps = {
    /**
     * Prioritas urutan toast yang akan ditampilkan bila multiple tersedia
     * default: ['success','error','warning','info','message']
     */
    priority?: Array<ToastKey>;
    /**
     * Apakah menampilkan toast hanya saat value flash berubah (mencegah double-fire)? default: true
     */
    dedupe?: boolean;
};

export default function FlashToaster({
    priority = ['success', 'error', 'warning', 'info', 'message'],
    dedupe = true,
}: FlashToasterProps) {
    const { props } = usePage<PageShared>();

    const keyRef = React.useRef<string>('');

    React.useEffect(() => {
        const f = props.flash || {};
        const c = props.cb || {};

        // gabungkan yang relevan jadi satu signature untuk dedupe
        const signature = JSON.stringify({
            s: f.success ?? c.success,
            e: f.error ?? c.error,
            w: f.warning,
            i: f.info,
            m: f.message,
        });

        if (dedupe && signature === keyRef.current) return;
        keyRef.current = signature;

        // pilih pesan sesuai prioritas
        for (const k of priority) {
            const val: string | undefined =
                (f[k as ToastKey] as string | undefined) ??
                (k === 'success'
                    ? c.success
                    : k === 'error'
                      ? c.error
                      : undefined);
            if (!val) continue;
            switch (k) {
                case 'success':
                    toast.success(String(val));
                    return;
                case 'error':
                    toast.error(String(val));
                    return;
                case 'warning':
                    if (
                        typeof (toast as { warning?: (msg: string) => void })
                            .warning === 'function'
                    ) {
                        (toast as { warning?: (msg: string) => void }).warning!(
                            String(val),
                        );
                    } else {
                        toast(String(val));
                    }
                    return;
                case 'info':
                    if (
                        typeof (toast as { info?: (msg: string) => void })
                            .info === 'function'
                    ) {
                        (toast as { info?: (msg: string) => void }).info!(
                            String(val),
                        );
                    } else {
                        toast(String(val));
                    }
                    return;
                case 'message':
                    toast(String(val));
                    return;
            }
        }
    }, [props.flash, props.cb, dedupe, priority]);

    return null;
}
