'use client';

import { usePage } from '@inertiajs/react';
import * as React from 'react';
import { toast } from 'sonner';

import type { PageProps } from '@/types';

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
    /**
     * Durasi toast (ms). Dipakai juga sebagai fallback cleanup dedupe.
     * default: 4000
     */
    toastDuration?: number;
};

export default function FlashToaster({
    priority = ['success', 'error', 'warning', 'info', 'message'],
    dedupe = true,
    toastDuration = 4000,
}: FlashToasterProps) {
    const { props } = usePage<PageProps<PageShared>>();

    const activeRef = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        const f = props.flash || {};
        const c = props.cb || {};

        const show = (type: ToastKey, message: string) => {
            const sig = `${type}|${message}`;
            if (dedupe && activeRef.current.has(sig)) return;
            activeRef.current.add(sig);

            const fallback = window.setTimeout(() => {
                activeRef.current.delete(sig);
            }, toastDuration + 300);

            const common: { duration: number; onDismiss: () => void } = {
                duration: toastDuration,
                onDismiss: () => {
                    activeRef.current.delete(sig);
                    window.clearTimeout(fallback);
                },
            };

            switch (type) {
                case 'success':
                    toast.success(message, common);
                    break;
                case 'error':
                    toast.error(message, common);
                    break;
                case 'warning': {
                    const t = (
                        toast as {
                            warning?: (
                                msg: string,
                                opts?: {
                                    duration?: number;
                                    onDismiss?: () => void;
                                },
                            ) => void;
                        }
                    ).warning;
                    if (t) t(message, common);
                    else toast(message, common);
                    break;
                }
                case 'info': {
                    const t = (
                        toast as {
                            info?: (
                                msg: string,
                                opts?: {
                                    duration?: number;
                                    onDismiss?: () => void;
                                },
                            ) => void;
                        }
                    ).info;
                    if (t) t(message, common);
                    else toast(message, common);
                    break;
                }
                case 'message':
                    toast(message, common);
                    break;
            }
        };

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
                    show('success', String(val));
                    return;
                case 'error':
                    show('error', String(val));
                    return;
                case 'warning':
                    show('warning', String(val));
                    return;
                case 'info':
                    show('info', String(val));
                    return;
                case 'message':
                    show('message', String(val));
                    return;
            }
        }
    }, [props.flash, props.cb, dedupe, priority, toastDuration]);

    return null;
}
