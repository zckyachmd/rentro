let askedOnce = false;

export function showWebNotification(
    title: string,
    body?: string,
    actionUrl?: string | null,
): void {
    try {
        type NotificationCtor = typeof Notification;
        const N = (globalThis as { Notification?: NotificationCtor })
            .Notification;
        if (!N) return;

        const spawn = () => {
            if (N.permission !== 'granted') return;
            const n = new N(title, {
                body: body || '',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'rentro-app',
            });
            if (actionUrl) {
                n.onclick = () => {
                    try {
                        window.focus();
                    } catch {
                        /* noop */
                    }
                    try {
                        window.location.assign(String(actionUrl));
                    } catch {
                        /* noop */
                    }
                    try {
                        n.close();
                    } catch {
                        /* noop */
                    }
                };
            }
            // Auto-close after a few seconds
            setTimeout(() => {
                try {
                    n.close();
                } catch {
                    /* noop */
                }
            }, 5000);
        };

        if (N.permission === 'granted') {
            spawn();
            return;
        }

        if (N.permission === 'default' && !askedOnce) {
            askedOnce = true;
            N.requestPermission?.()
                .then((perm: string) => {
                    if (perm === 'granted') spawn();
                })
                .catch(() => void 0);
        }
    } catch {
        /* noop - ignore web notification failures */
    }
}

export function ensureWebNotificationPermission(): void {
    try {
        type NotificationCtor = typeof Notification;
        const N = (globalThis as { Notification?: NotificationCtor })
            .Notification;
        if (!N) return;
        if (N.permission === 'default' && !askedOnce) {
            askedOnce = true;
            N.requestPermission?.().catch(() => void 0);
        }
    } catch {
        /* noop */
    }
}
