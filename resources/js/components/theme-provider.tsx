import React, {
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const DEFAULT_THEME_STORAGE_KEY = 'rentro:preferences';

function readCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const m = document.cookie.match(
        new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'),
    );
    return m ? decodeURIComponent(m[1]) : undefined;
}

export function useAppearance({
    defaultTheme = 'system',
    storageKey = DEFAULT_THEME_STORAGE_KEY,
}: {
    defaultTheme?: Theme;
    storageKey?: string;
} = {}) {
    function readPrefsFromLS(): { theme?: Theme; locale?: string } | undefined {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return undefined;
            if (raw === 'dark' || raw === 'light' || raw === 'system') {
                return { theme: raw } as { theme: Theme };
            }
            const obj = JSON.parse(raw) as unknown;
            if (
                obj &&
                typeof obj === 'object' &&
                ('theme' in obj || 'locale' in obj)
            )
                return obj as { theme?: Theme; locale?: string };
        } catch {
            void 0;
        }
        return undefined;
    }

    const [themeState, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return defaultTheme;

        const fromDataset = document.documentElement.dataset.theme as
            | Theme
            | undefined;
        if (
            fromDataset === 'dark' ||
            fromDataset === 'light' ||
            fromDataset === 'system'
        )
            return fromDataset;

        const fromCookie = readCookie('theme') as Theme | undefined;
        if (
            fromCookie === 'dark' ||
            fromCookie === 'light' ||
            fromCookie === 'system'
        )
            return fromCookie;

        const fromPrefs = readPrefsFromLS()?.theme;
        if (
            fromPrefs === 'dark' ||
            fromPrefs === 'light' ||
            fromPrefs === 'system'
        )
            return fromPrefs;

        return defaultTheme;
    });

    useEffect(() => {
        try {
            try {
                const raw = localStorage.getItem(storageKey);
                const base =
                    raw && raw !== 'dark' && raw !== 'light' && raw !== 'system'
                        ? JSON.parse(raw)
                        : {};
                const next = {
                    ...(base && typeof base === 'object' ? base : {}),
                    theme: themeState,
                } as Record<string, unknown>;
                localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                localStorage.setItem(storageKey, themeState);
            }
            const root = document.documentElement;
            root.dataset.theme = themeState;
            const prefersDark =
                window.matchMedia &&
                window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark =
                themeState === 'dark' ||
                (themeState === 'system' && prefersDark);
            root.classList.toggle('dark', isDark);
            root.style.colorScheme = isDark ? 'dark' : 'light';
            document.cookie = `theme=${encodeURIComponent(themeState)}; path=/; max-age=31536000`;
        } catch (err) {
            if (
                typeof console !== 'undefined' &&
                process.env.NODE_ENV === 'development'
            ) {
                console.debug('[theme] failed to persist/apply theme:', err);
            }
        }
    }, [themeState, storageKey]);

    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key !== storageKey || !e.newValue) return;
            try {
                // Support legacy string value
                if (
                    e.newValue === 'dark' ||
                    e.newValue === 'light' ||
                    e.newValue === 'system'
                ) {
                    setThemeState(e.newValue);
                    return;
                }
                const obj = JSON.parse(e.newValue) as { theme?: Theme };
                const next = obj?.theme;
                if (next === 'dark' || next === 'light' || next === 'system')
                    setThemeState((prev) => (prev === next ? prev : next));
            } catch {
                void 0;
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

    const resolvedTheme: Theme = (() => {
        if (themeState !== 'system') return themeState;
        if (typeof window === 'undefined') return 'light';
        try {
            const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
            return mq && typeof mq.matches === 'boolean' && mq.matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    })();

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
    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    const fallback = useAppearance();
    return ctx ?? fallback;
}
