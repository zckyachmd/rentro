import { router } from '@inertiajs/react';
import * as React from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type InertiaBeforeEvent = Event & {
    detail?: {
        visit?: { url?: string };
        href?: string;
        location?: { href?: string };
    };
};

export type LeaveGuardOptions = {
    enabled: boolean;
};

export function useLeaveGuard({ enabled }: LeaveGuardOptions) {
    const [open, setOpen] = React.useState(false);
    const pendingUrlRef = React.useRef<string | null>(null);
    const skipRef = React.useRef(false);
    const dirtyRef = React.useRef(enabled);

    React.useEffect(() => {
        dirtyRef.current = enabled;
    }, [enabled]);

    React.useEffect(() => {
        const isModifiedClick = (ev: MouseEvent, el: HTMLAnchorElement) => {
            if (ev.defaultPrevented) return true;
            const target = el.getAttribute('target');
            return (
                ev.metaKey ||
                ev.ctrlKey ||
                ev.shiftKey ||
                ev.altKey ||
                ev.button === 1 ||
                target === '_blank' ||
                el.hasAttribute('download')
            );
        };

        const beforeUnload = (e: BeforeUnloadEvent) => {
            if (!dirtyRef.current) return;
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        const inertiaBefore = (e: Event) => {
            if (skipRef.current) return;
            if (!dirtyRef.current) return;
            const ev = e as InertiaBeforeEvent;
            const url: string | undefined =
                ev?.detail?.visit?.url ||
                ev?.detail?.href ||
                ev?.detail?.location?.href;
            if (url) {
                e.preventDefault();
                pendingUrlRef.current = url;
                setOpen(true);
            }
        };

        const clickCapture = (e: MouseEvent) => {
            if (skipRef.current) return;
            if (!dirtyRef.current) return;
            const target = e.target as HTMLElement | null;
            const a = target?.closest('a') as HTMLAnchorElement | null;
            if (!a || !a.href) return;
            if (a.dataset.noGuard === 'true') return;
            if (isModifiedClick(e, a)) return;
            const current = window.location.href.split('#')[0];
            const next = a.href.split('#')[0];
            if (current === next) return;
            e.preventDefault();
            pendingUrlRef.current = a.href;
            setOpen(true);
        };

        const touchInteraction: EventListener = () => {};
        window.addEventListener('mousedown', touchInteraction, {
            once: true,
            passive: true,
        });
        window.addEventListener('keydown', touchInteraction, {
            once: true,
            passive: true,
        });

        window.addEventListener('beforeunload', beforeUnload, {
            capture: true,
        });
        window.onbeforeunload = beforeUnload;
        document.addEventListener(
            'inertia:before',
            inertiaBefore as EventListener,
        );
        document.addEventListener('click', clickCapture, true);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload, true);
            window.onbeforeunload = null;
            window.removeEventListener('mousedown', touchInteraction);
            window.removeEventListener('keydown', touchInteraction);
            document.removeEventListener(
                'inertia:before',
                inertiaBefore as EventListener,
            );
            document.removeEventListener('click', clickCapture, true);
        };
    }, []);

    const proceed = React.useCallback(() => {
        const url = pendingUrlRef.current;
        if (!url) {
            setOpen(false);
            return;
        }
        skipRef.current = true;
        setOpen(false);
        pendingUrlRef.current = null;
        router.visit(url);
        setTimeout(() => {
            skipRef.current = false;
        }, 500);
    }, []);

    const cancel = React.useCallback(() => {
        pendingUrlRef.current = null;
        setOpen(false);
    }, []);

    const beginSkip = React.useCallback(() => {
        skipRef.current = true;
    }, []);
    const endSkip = React.useCallback(() => {
        setTimeout(() => {
            skipRef.current = false;
        }, 300);
    }, []);
    const skipWhile = React.useCallback(
        async <T,>(fn: () => Promise<T> | T): Promise<T> => {
            beginSkip();
            try {
                return await fn();
            } finally {
                endSkip();
            }
        },
        [beginSkip, endSkip],
    );

    return {
        open,
        setOpen,
        proceed,
        cancel,
        beginSkip,
        endSkip,
        skipWhile,
    } as const;
}

/**
 * Komponen dialog siap-pakai untuk leave guard.
 * Bisa override teks/label sesuai halaman.
 */
export function LeaveGuardDialog(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    confirmText?: React.ReactNode;
    cancelText?: React.ReactNode;
}) {
    const {
        open,
        onOpenChange,
        onConfirm,
        onCancel,
        title = 'Keluar tanpa menyimpan?',
        description = (
            <>
                Anda memiliki perubahan yang belum disimpan (form/foto). Jika
                keluar, perubahan akan hilang.
            </>
        ),
        confirmText = 'Keluar Halaman',
        cancelText = 'Batal',
    } = props;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
