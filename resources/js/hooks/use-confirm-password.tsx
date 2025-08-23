import { useForm } from '@inertiajs/react';
import * as React from 'react';
import { toast } from 'sonner';

function readXsrfCookie(): string | null {
    const match = document.cookie
        .split('; ')
        .find((c) => c.startsWith('XSRF-TOKEN='));
    if (!match) return null;
    const raw = match.split('=')[1];
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

async function ensureXsrfToken(): Promise<string | null> {
    let token = readXsrfCookie();
    if (token) return token;

    try {
        await fetch('/sanctum/csrf-cookie', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
    } catch {
        // ignore; we'll re-check token below
    }

    token = readXsrfCookie();
    return token;
}

export type UseConfirmPasswordDialogReturn = {
    confirmForm: ReturnType<typeof useForm<{ password: string }>>;
    submitting: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onSubmit: (e: React.FormEvent) => Promise<void>;
};

/**
 * Hook untuk menangani seluruh logic pada ConfirmPasswordDialog
 * (state, effect focus/reset, dan submit handling).
 */
export function useConfirmPasswordDialog(
    open: boolean,
    onClose: () => void,
    onConfirmed?: () => void,
): UseConfirmPasswordDialogReturn {
    const confirmForm = useForm<{ password: string }>({ password: '' });
    const [submitting, setSubmitting] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const ctrlRef = React.useRef<AbortController | null>(null);
    const mounted = React.useRef(true);

    React.useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            try {
                ctrlRef.current?.abort();
            } catch {
                /* ignore */
            }
            ctrlRef.current = null;
        };
    }, []);

    React.useEffect(() => {
        if (open) {
            confirmForm.reset('password');
            setTimeout(() => inputRef.current?.focus(), 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const onSubmit = React.useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (submitting) return;

            const token = await ensureXsrfToken();
            if (!token) {
                toast.error(
                    'Gagal mendapatkan CSRF token. Coba muat ulang halaman.',
                );
                return;
            }

            const ctrl = new AbortController();
            ctrlRef.current = ctrl;
            try {
                setSubmitting(true);
                const url = route('password.confirm');
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': token,
                        'X-Inertia': 'true',
                    },
                    body: JSON.stringify({
                        password: confirmForm.data.password,
                    }),
                    credentials: 'same-origin',
                    signal: ctrl.signal,
                });

                if (res.status === 204) {
                    confirmForm.clearErrors();
                    confirmForm.reset('password');
                    onClose();
                    onConfirmed?.();
                    return;
                }

                if (res.status === 422) {
                    let message = 'Password tidak valid.';
                    try {
                        const data: unknown = await res.json();
                        const err = (
                            data as { errors?: { password?: unknown[] } }
                        )?.errors?.password?.[0];
                        if (typeof err === 'string') message = err;
                    } catch {
                        /* ignore */
                    }
                    confirmForm.setError('password', message);
                    toast.error(message);
                    return;
                }

                if (res.status === 419) {
                    toast.error(
                        'Sesi kedaluwarsa. Silakan muat ulang halaman.',
                    );
                    return;
                }
            } catch (err: unknown) {
                const isAbort =
                    err instanceof DOMException
                        ? err.name === 'AbortError'
                        : typeof err === 'object' &&
                          err !== null &&
                          'name' in err &&
                          (err as { name?: unknown }).name === 'AbortError';
                if (!isAbort) {
                    toast.error(
                        'Gagal mengkonfirmasi password. Periksa koneksi Anda.',
                    );
                }
            } finally {
                ctrlRef.current = null;
                if (mounted.current) setSubmitting(false);
            }
        },
        [submitting, confirmForm, onClose, onConfirmed],
    );

    return {
        confirmForm,
        submitting,
        inputRef,
        onSubmit,
    } as const;
}

/**
 * Controller untuk kebutuhan buka/tutup modal konfirmasi password
 * dan memutuskan apakah konfirmasi diperlukan dari backend.
 * Tidak merender JSX (hindari circular dependency dengan komponen).
 */
export function useConfirmPasswordModal() {
    const [open, setOpen] = React.useState(false);
    const pendingRef = React.useRef<null | (() => void)>(null);

    const openConfirm = async (run: () => void) => {
        try {
            const url = route('password.confirm.needs');
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.required === false) {
                    run();
                    return;
                }
                if (data && data.required === true) {
                    pendingRef.current = run;
                    setOpen(true);
                    return;
                }
            }

            pendingRef.current = run;
            setOpen(true);
        } catch {
            pendingRef.current = run;
            setOpen(true);
        }
    };

    const handleConfirmed = () => {
        const fn = pendingRef.current;
        pendingRef.current = null;
        if (typeof fn === 'function') fn();
    };

    return { open, setOpen, openConfirm, handleConfirmed } as const;
}
