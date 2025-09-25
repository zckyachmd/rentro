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

type PageShared = {
    alert?: FlashBag;
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
    const storeKey = 'rentro:alert:consumed:v1';

    const readConsumed = React.useCallback((): Record<string, number> => {
        try {
            const raw = sessionStorage.getItem(storeKey);
            if (!raw) return {};
            const obj = JSON.parse(raw) as Record<string, number>;
            return obj && typeof obj === 'object' ? obj : {};
        } catch {
            return {};
        }
    }, []);

    const writeConsumed = React.useCallback((obj: Record<string, number>) => {
        try {
            const now = Date.now();
            const pruned: Record<string, number> = {};
            const entries = Object.entries(obj)
                .filter(([, ts]) => now - ts < 30 * 60 * 1000)
                .slice(-100);
            for (const [k, v] of entries) pruned[k] = v;
            sessionStorage.setItem(storeKey, JSON.stringify(pruned));
        } catch {
            // ignore
        }
    }, []);

    type HistoryState = { __alertConsumed?: Record<string, boolean> } & Record<
        string,
        unknown
    >;

    const historyConsumed = React.useCallback((type: ToastKey): boolean => {
        try {
            const raw = (window.history && window.history.state) || {};
            const st: HistoryState =
                typeof raw === 'object' && raw !== null
                    ? (raw as Record<string, unknown>)
                    : {};
            const consumed = (st as HistoryState).__alertConsumed;
            return Boolean(consumed && consumed[type]);
        } catch {
            return false;
        }
    }, []);

    const markHistoryConsumed = React.useCallback((type: ToastKey) => {
        try {
            const raw = (window.history && window.history.state) || {};
            const st: HistoryState =
                typeof raw === 'object' && raw !== null
                    ? (raw as Record<string, unknown>)
                    : {};
            const consumed = {
                ...((st.__alertConsumed as
                    | Record<string, boolean>
                    | undefined) ?? {}),
                [type]: true,
            };
            const next = { ...st, __alertConsumed: consumed } as HistoryState;
            window.history.replaceState(
                next as unknown as object,
                '',
                window.location.href,
            );
        } catch {
            // ignore
        }
    }, []);

    React.useEffect(() => {
        const f = props.alert || {};

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
            const val: string | undefined = f[k as ToastKey] as
                | string
                | undefined;
            if (!val) continue;

            if (dedupe && historyConsumed(k as ToastKey)) {
                return;
            }
            markHistoryConsumed(k as ToastKey);

            const path =
                (typeof window !== 'undefined' && window.location?.pathname) ||
                '';
            const token = `path:${path}|type:${k}`;
            const consumed = readConsumed();
            consumed[token] = Date.now();
            writeConsumed(consumed);
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
    }, [
        props.alert,
        dedupe,
        priority,
        toastDuration,
        readConsumed,
        writeConsumed,
        historyConsumed,
        markHistoryConsumed,
    ]);

    return null;
}
