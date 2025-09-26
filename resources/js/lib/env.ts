export function getAppName(defaultName = 'Rentro'): string {
    try {
        const env = (
            import.meta as unknown as { env?: { VITE_APP_NAME?: string } }
        ).env;
        return env?.VITE_APP_NAME ?? defaultName;
    } catch {
        return defaultName;
    }
}

export function getAppUrl(defaultUrl = ''): string {
    try {
        const env = (
            import.meta as unknown as {
                env?: { VITE_APP_URL?: string };
            }
        ).env;
        const fromEnv = env?.VITE_APP_URL?.trim();
        if (fromEnv) return fromEnv.replace(/\/$/, '');
        if (typeof window !== 'undefined' && window.location?.origin) {
            return window.location.origin.replace(/\/$/, '');
        }
        return defaultUrl;
    } catch {
        return defaultUrl;
    }
}

export function getTwitterHandle(defaultHandle = ''): string {
    try {
        const env = (
            import.meta as unknown as { env?: { VITE_TWITTER_HANDLE?: string } }
        ).env;
        const h = (env?.VITE_TWITTER_HANDLE || '').trim();
        return h || defaultHandle;
    } catch {
        return defaultHandle;
    }
}

export function toAbsoluteUrl(urlOrPath?: string | null): string | undefined {
    if (!urlOrPath) return undefined;
    const s = String(urlOrPath).trim();
    if (!s) return undefined;
    const isAbs = /^https?:\/\//i.test(s);
    if (isAbs) return s;
    const base = getAppUrl('');
    if (!base) return s;
    return `${base}${s.startsWith('/') ? '' : '/'}${s}`;
}

export function getOgDefaultImage(defaultPath = '/logo.svg'): string {
    try {
        const env = (
            import.meta as unknown as {
                env?: { VITE_OG_DEFAULT_IMAGE?: string };
            }
        ).env;
        const v = (env?.VITE_OG_DEFAULT_IMAGE || '').trim();
        return v || defaultPath;
    } catch {
        return defaultPath;
    }
}
