import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const DEFAULT_THEME_STORAGE_KEY = 'theme';

function readCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : undefined;
}

export function useAppearance({
    defaultTheme = 'system',
    storageKey = DEFAULT_THEME_STORAGE_KEY,
}: {
    defaultTheme?: Theme;
    storageKey?: string;
} = {}) {
    const [themeState, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return defaultTheme;

        const fromDataset = document.documentElement.dataset.theme as Theme | undefined;
        if (fromDataset === 'dark' || fromDataset === 'light' || fromDataset === 'system') return fromDataset;

        const fromCookie = readCookie('theme') as Theme | undefined;
        if (fromCookie === 'dark' || fromCookie === 'light' || fromCookie === 'system') return fromCookie;

        const fromLS = localStorage.getItem(storageKey) as Theme | null;
        if (fromLS === 'dark' || fromLS === 'light' || fromLS === 'system') return fromLS;

        return defaultTheme;
    });

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, themeState);
            const root = document.documentElement;
            root.dataset.theme = themeState;
            // compute resolved and apply class + color-scheme
            const prefersDark =
                window.matchMedia &&
                window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = themeState === 'dark' || (themeState === 'system' && prefersDark);
            root.classList.toggle('dark', isDark);
            root.style.colorScheme = isDark ? 'dark' : 'light';
            // sync cookie (1 year)
            document.cookie = `theme=${encodeURIComponent(themeState)}; path=/; max-age=31536000`;
        } catch {}
    }, [themeState, storageKey]);

    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key === storageKey && e.newValue) {
                if (e.newValue === 'dark' || e.newValue === 'light' || e.newValue === 'system') {
                    setThemeState(e.newValue);
                }
            }
        }
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

    const resolvedTheme =
        themeState === 'system'
            ? window.matchMedia &&
              window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            : themeState;

    return {
        theme: themeState,
        setTheme: setThemeState,
        resolvedTheme,
    };
}

type ThemeContextValue = ReturnType<typeof useAppearance>;
const ThemeContext = React.createContext<ThemeContextValue | undefined>(
    undefined,
);

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = DEFAULT_THEME_STORAGE_KEY,
}: PropsWithChildren<{ defaultTheme?: Theme; storageKey?: string }>) {
    const value = useAppearance({ defaultTheme, storageKey });
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    return ctx ?? useAppearance();
}
