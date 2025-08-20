import { useCallback, useEffect, useMemo, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

const DARK_MQ = '(prefers-color-scheme: dark)';

function applyThemeToDocument(theme: Theme, prefersDark: boolean) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
}

export function useAppearance(opts?: {
    defaultTheme?: Theme;
    storageKey?: string;
}) {
    const defaultTheme = opts?.defaultTheme ?? 'system';
    const storageKey = opts?.storageKey ?? 'vite-ui-theme';

    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return defaultTheme;
        try {
            return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
        } catch {
            return defaultTheme;
        }
    });

    const [prefersDark, setPrefersDark] = useState<boolean>(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        try {
            return window.matchMedia(DARK_MQ).matches;
        } catch {
            return false;
        }
    });

    // Persist theme
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, theme);
        } catch {
            // ignore
        }
    }, [theme, storageKey]);

    // Watch system appearance when theme = system
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        if (theme !== 'system') return;
        const mq = window.matchMedia(DARK_MQ);
        const handler = () => setPrefersDark(mq.matches);
        handler();
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, [theme]);

    // Apply to <html>
    useEffect(() => {
        applyThemeToDocument(theme, prefersDark);
    }, [prefersDark, theme]);

    const setTheme = useCallback((t: Theme) => setThemeState(t), []);

    const resolvedTheme = useMemo<'light' | 'dark'>(
        () =>
            theme === 'dark' || (theme === 'system' && prefersDark)
                ? 'dark'
                : 'light',
        [theme, prefersDark],
    );

    return { theme, setTheme, resolvedTheme, prefersDark };
}
