import React, {
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from 'react';

import i18n, { preloadLocaleNamespaces } from '@/lib/i18n';

export type AppLocale = 'en' | 'id';

const STORAGE_KEY = 'rentro:preferences';

function readCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const m = document.cookie.match(
        new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'),
    );
    return m ? decodeURIComponent(m[1]) : undefined;
}

function normalizeLocale(v?: string | null): AppLocale | undefined {
    if (!v) return undefined;
    const x = String(v).toLowerCase();
    if (x === 'en' || x.startsWith('en-')) return 'en';
    if (x === 'id' || x.startsWith('id-')) return 'id';
    return undefined;
}

export function useLocalePreference() {
    function readPrefsFromLS():
        | { theme?: string; locale?: AppLocale }
        | undefined {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return undefined;
            // Support legacy string (ignore; was theme-only)
            if (raw === 'dark' || raw === 'light' || raw === 'system')
                return undefined;
            const obj = JSON.parse(raw) as unknown;
            if (
                obj &&
                typeof obj === 'object' &&
                ('theme' in obj || 'locale' in obj)
            )
                return obj as { theme?: string; locale?: AppLocale };
        } catch {
            void 0;
        }
        return undefined;
    }
    const [locale, setLocale] = useState<AppLocale>(() => {
        try {
            const htmlLang = normalizeLocale(
                typeof document !== 'undefined'
                    ? document.documentElement?.lang
                    : undefined,
            );
            if (htmlLang) return htmlLang;

            const c = normalizeLocale(readCookie('locale'));
            if (c) return c;

            const ls = normalizeLocale(readPrefsFromLS()?.locale);
            if (ls) return ls;

            const nav = normalizeLocale(navigator.language);
            return nav ?? 'en';
        } catch {
            return 'en';
        }
    });

    useEffect(() => {
        let cancelled = false;
        const apply = async () => {
            try {
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    const base =
                        raw &&
                        raw !== 'dark' &&
                        raw !== 'light' &&
                        raw !== 'system'
                            ? JSON.parse(raw)
                            : {};
                    const next = {
                        ...(base && typeof base === 'object' ? base : {}),
                        locale,
                    } as Record<string, unknown>;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                    void 0;
                }
                document.cookie = `locale=${encodeURIComponent(locale)}; path=/; max-age=31536000`;

                try {
                    await preloadLocaleNamespaces(locale);
                } catch (e) {
                    if (
                        typeof console !== 'undefined' &&
                        process.env.NODE_ENV === 'development'
                    ) {
                        console.warn(
                            '[locale] failed to load resources for',
                            locale,
                            e,
                        );
                    }
                    return;
                }

                if (i18n.language !== locale) {
                    await i18n.changeLanguage(locale);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (i18n as any).emit?.('languageChanged', locale);
                }

                if (cancelled) return;
                try {
                    if (typeof document !== 'undefined') {
                        document.documentElement.lang = locale;
                    }
                } catch {
                    void 0;
                }
            } catch (err) {
                if (
                    typeof console !== 'undefined' &&
                    process.env.NODE_ENV === 'development'
                ) {
                    console.debug(
                        '[locale] failed to persist/apply locale:',
                        err,
                    );
                }
            }
        };
        void apply();
        return () => {
            cancelled = true;
        };
    }, [locale]);

    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key !== STORAGE_KEY || !e.newValue) return;
            try {
                const obj = JSON.parse(e.newValue) as { locale?: string };
                const next = normalizeLocale(obj?.locale);
                if (next) setLocale((prev) => (prev === next ? prev : next));
            } catch {
                void 0;
            }
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        const reconcile = () => {
            const c = normalizeLocale(readCookie('locale'));
            if (c) setLocale((prev) => (prev === c ? prev : c));
        };
        window.addEventListener('focus', reconcile);
        document.addEventListener('visibilitychange', reconcile);
        return () => {
            window.removeEventListener('focus', reconcile);
            document.removeEventListener('visibilitychange', reconcile);
        };
    }, []);

    return { locale, setLocale } as const;
}

type LocaleContextValue = ReturnType<typeof useLocalePreference>;
const LocaleContext = React.createContext<LocaleContextValue | undefined>(
    undefined,
);

export function LocaleProvider({ children }: PropsWithChildren) {
    const value = useLocalePreference();
    return (
        <LocaleContext.Provider value={value}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale() {
    const ctx = useContext(LocaleContext);
    const fallback = useLocalePreference();
    return ctx ?? fallback;
}
