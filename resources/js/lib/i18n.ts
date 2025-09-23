import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const jsonLoaders = import.meta.glob('../locales/**/*.json', { eager: false });
const tsJsLoaders = import.meta.glob('../locales/**/*.{ts,js}', {
    eager: false,
});

type JsonLoader = () => Promise<{ default: unknown }>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleLoader = () => Promise<any>;
const jsonTable = jsonLoaders as Record<string, JsonLoader>;

const modTable = tsJsLoaders as Record<string, ModuleLoader>;

function uniq<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
}

function discoverNamespacesFor(lang: string): string[] {
    const prefix = `../locales/${lang.toLowerCase()}/`;
    const suffix = '.json';

    const nsFromJson = Object.keys(jsonTable)
        .filter((k) => k.startsWith(prefix) && k.endsWith(suffix))
        .map((k) => k.slice(prefix.length, -suffix.length));

    const tsSuffix = '.ts';
    const jsSuffix = '.js';
    const nsFromModules = Object.keys(modTable)
        .filter((k) => k.startsWith(prefix) && (k.endsWith(tsSuffix) || k.endsWith(jsSuffix)))
        .map((k) => {
            const noPrefix = k.slice(prefix.length);
            return noPrefix.replace(/\.(ts|js)$/i, '');
        });

    return uniq([...nsFromJson, ...nsFromModules]).filter((ns) => ns && ns !== 'common');
}

function readMeta(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const el = document.querySelector(`meta[name="${name}"]`);
    return el?.getAttribute('content') || undefined;
}

function detectSupported(): string[] {
    const raw = readMeta('i18n-supported');
    if (raw) {
        const arr = raw
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
        if (arr.length > 0) return arr;
    }
    return ['en', 'id'];
}

function detectFallback(): string {
    const raw = readMeta('i18n-fallback');
    return (raw && raw.toLowerCase()) || 'en';
}

const supported = detectSupported();
const fallbackSetting = detectFallback();

const dynamicBackend = {
    type: 'backend' as const,

    init() {},
    async read(
        language: string,
        namespace: string,
        callback: (err: unknown, data?: unknown) => void,
    ) {
        const fallback = fallbackSetting;
        try {
            const lang = (language || fallback).toLowerCase();
            const base = lang.split('-')[0];

            const candidates = [
                { kind: 'json', key: `../locales/${lang}/${namespace}.json` },
                base !== lang
                    ? {
                          kind: 'json',
                          key: `../locales/${base}/${namespace}.json`,
                      }
                    : null,
                { kind: 'mod', key: `../locales/${lang}/${namespace}.ts` },
                { kind: 'mod', key: `../locales/${lang}/${namespace}.js` },
                base !== lang
                    ? { kind: 'mod', key: `../locales/${base}/${namespace}.ts` }
                    : null,
                base !== lang
                    ? { kind: 'mod', key: `../locales/${base}/${namespace}.js` }
                    : null,
            ].filter(Boolean) as Array<{ kind: 'json' | 'mod'; key: string }>;

            for (const c of candidates) {
                if (c.kind === 'json') {
                    const loader = jsonTable[c.key];
                    if (loader) {
                        const mod = await loader();
                        return callback(null, mod.default);
                    }
                } else {
                    const loader = modTable[c.key];
                    if (loader) {
                        const mod = await loader();
                        const data = mod?.default ?? mod;
                        return callback(null, data);
                    }
                }
            }

            if (import.meta.env?.DEV) {
                console.warn(
                    `[i18n] Missing locale for ${language}/${namespace}. Checked:`,
                    candidates.map((c) => c.key),
                );
            }

            throw new Error(
                `i18n: no locale found for ${language}/${namespace}`,
            );
        } catch (err) {
            callback(err);
        }
    },
};

if (!i18n.isInitialized) {
    void i18n
        .use(dynamicBackend as unknown as import('i18next').Module)
        .use(initReactI18next)
        .init({
            ns: ['common'],
            defaultNS: 'common',
            fallbackNS: 'common',
            supportedLngs: supported,
            lng: 'en',
            fallbackLng: (code?: string) => {
                if (!code) return [];
                const lower = code.toLowerCase();
                const base = lower.split('-')[0];
                return base && base !== lower ? [base] : [];
            },

            load: 'currentOnly',
            nonExplicitSupportedLngs: true,
            lowerCaseLng: true,

            keySeparator: '.',

            interpolation: { escapeValue: false },
            returnNull: false,
            returnEmptyString: false,

            parseMissingKeyHandler: (key: string, defaultValue?: unknown) =>
                typeof defaultValue === 'string' ? defaultValue : key,

            resources: {},

            initImmediate: false,

            react: { useSuspense: false },

            debug: !!import.meta.env?.DEV,
        })
        .then(() => {
            const active = (i18n.language || fallbackSetting).toLowerCase();
            const base = active.split('-')[0];

            const envPreload = String((import.meta as any).env?.VITE_I18N_PRELOAD_ALL || '').toLowerCase() === 'true';
            const preloadAll = (Boolean((import.meta as any).env?.DEV) === true) || envPreload;

            if (!preloadAll) {
                return;
            }

            const candidates = uniq([
                ...discoverNamespacesFor(active),
                ...(base !== active ? discoverNamespacesFor(base) : []),
            ]);

            if (candidates.length > 0) {
                return i18n.loadNamespaces(candidates);
            }
        });
}

export default i18n;
