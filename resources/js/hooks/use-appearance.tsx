import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from 'react';

function readCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : undefined;
}

export const DEFAULT_THEME_STORAGE_KEY: string = (typeof document !== 'undefined' && document.documentElement && (document.documentElement as HTMLElement).dataset && (document.documentElement as HTMLElement).dataset.themeStorageKey) || 'rentro-theme';

export type Theme = 'dark' | 'light' | 'system';

function useSystemPrefersDark(): boolean {
    const subscribe = useCallback((notify: () => void) => {
        if (typeof window === 'undefined' || !window.matchMedia)
            return () => {};
        const mq = window.matchMedia(DARK_MQ);
        const handler = () => notify();
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, []);

    const getSnapshot = useCallback(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia(DARK_MQ).matches;
    }, []);

    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

const DARK_MQ = '(prefers-color-scheme: dark)';

function applyThemeToDocument(theme: Theme, prefersDark: boolean) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement as HTMLElement;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.dataset.theme = theme;
    root.dataset.themeResolved = isDark ? 'dark' : 'light';
    root.classList.toggle('dark', isDark);
    (root as HTMLElement).style.colorScheme = isDark ? 'dark' : 'light';
}

export type UseAppearanceReturn = {
    theme: Theme;
    setTheme: (t: Theme) => void;
    resolvedTheme: 'light' | 'dark';
    prefersDark: boolean;
};

export function useAppearance(opts?: {
    defaultTheme?: Theme;
    storageKey?: string;
}): UseAppearanceReturn {
    const defaultTheme = opts?.defaultTheme ?? 'system';
    const storageKey = opts?.storageKey ?? DEFAULT_THEME_STORAGE_KEY;

    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return defaultTheme;
        try {
            const fromDataset = (document.documentElement as HTMLElement).dataset?.theme as Theme | undefined;
            if (fromDataset === 'dark' || fromDataset === 'light' || fromDataset === 'system') return fromDataset;
            const fromCookie = readCookie('theme') as Theme | undefined;
            if (fromCookie === 'dark' || fromCookie === 'light' || fromCookie === 'system') return fromCookie;
            const fromLS = localStorage.getItem(storageKey) as Theme | null;
            return (fromLS as Theme) || defaultTheme;
        } catch {
            return defaultTheme;
        }
    });

    const prefersDark = useSystemPrefersDark();

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, theme);
        } catch {
            // ignore
        }
        applyThemeToDocument(theme, prefersDark);
    }, [theme, storageKey, prefersDark]);

    useEffect(() => {
        try {
            document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {
            // ignore
        }
    }, [theme]);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === storageKey && e.newValue) {
                const next = e.newValue as Theme;
                setThemeState((prev) => (prev === next ? prev : next));
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [storageKey]);

    useEffect(() => {
        const reconcile = () => {
            const c = readCookie('theme') as Theme | undefined;
            if (c && (c === 'dark' || c === 'light' || c === 'system')) {
                setThemeState((prev) => (prev === c ? prev : c));
            }
        };
        window.addEventListener('focus', reconcile);
        document.addEventListener('visibilitychange', reconcile);
        return () => {
            window.removeEventListener('focus', reconcile);
            document.removeEventListener('visibilitychange', reconcile);
        };
    }, []);

    const setTheme = useCallback((t: Theme) => {
        setThemeState((prev) => (prev === t ? prev : t));
    }, []);

    const resolvedTheme = useMemo<'light' | 'dark'>(
        () =>
            theme === 'dark' || (theme === 'system' && prefersDark)
                ? 'dark'
                : 'light',
        [theme, prefersDark],
    );

    return { theme, setTheme, resolvedTheme, prefersDark };
}
