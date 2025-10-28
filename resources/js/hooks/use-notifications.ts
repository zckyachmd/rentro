import * as React from 'react';

import { ensureXsrfToken } from '@/hooks/use-confirm-password';
import { useNotificationsStore } from '@/stores/notifications';

/**
 * Notifications actions hook: persist read state to server and sync local store.
 */
export function useNotificationsActions() {
    const { markRead: markReadLocal, markAllRead: markAllReadLocal } =
        useNotificationsStore();

    const markRead = React.useCallback(
        async (id: string) => {
            try {
                const token = await ensureXsrfToken();
                const url = route('notifications.read', { id });
                const res = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': token || '',
                        'X-Inertia': 'true',
                    },
                    credentials: 'same-origin',
                });
                if (res.ok || res.status === 204) {
                    markReadLocal(id);
                }
            } catch {
                // Network errors are ignored; local state not updated to avoid mismatch
            }
        },
        [markReadLocal],
    );

    const markAllRead = React.useCallback(async () => {
        try {
            const token = await ensureXsrfToken();
            const url = route('notifications.read_all');
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': token || '',
                    'X-Inertia': 'true',
                },
                credentials: 'same-origin',
            });
            if (res.ok || res.status === 204) {
                markAllReadLocal();
            }
        } catch {
            // ignore
        }
    }, [markAllReadLocal]);

    return { markRead, markAllRead } as const;
}

