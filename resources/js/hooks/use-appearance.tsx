import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from 'react';

const DEFAULT_STORAGE_KEY = 'vite-ui-theme' as const;

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
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
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
    const storageKey = opts?.storageKey ?? DEFAULT_STORAGE_KEY;

    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return defaultTheme;
        try {
            return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
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
