let askedOnce = false;

export function showWebNotification(title: string, body?: string, actionUrl?: string | null): void {
    try {
        const N: any = (globalThis as any).Notification;
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
                    try { window.focus(); } catch {}
                    try { window.location.assign(String(actionUrl)); } catch {}
                    try { n.close(); } catch {}
                };
            }
            // Auto-close after a few seconds
            setTimeout(() => { try { n.close(); } catch {} }, 5000);
        };

        if (N.permission === 'granted') {
            spawn();
            return;
        }

        if (N.permission === 'default' && !askedOnce) {
            askedOnce = true;
            N.requestPermission?.().then((perm: string) => {
                if (perm === 'granted') spawn();
            }).catch(() => void 0);
        }
    } catch {
        // ignore web notification failures
    }
}

