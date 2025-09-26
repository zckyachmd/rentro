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

export function discoverNamespacesFor(lang: string): string[] {
    const prefix = `../locales/${lang.toLowerCase()}/`;
    const suffix = '.json';

    const nsFromJson = Object.keys(jsonTable)
        .filter((k) => k.startsWith(prefix) && k.endsWith(suffix))
        .map((k) => k.slice(prefix.length, -suffix.length));

    const tsSuffix = '.ts';
    const jsSuffix = '.js';
    const nsFromModules = Object.keys(modTable)
        .filter(
            (k) =>
                k.startsWith(prefix) &&
                (k.endsWith(tsSuffix) || k.endsWith(jsSuffix)),
        )
        .map((k) => {
            const noPrefix = k.slice(prefix.length);
            return noPrefix.replace(/\.(ts|js)$/i, '');
        });

    return uniq([...nsFromJson, ...nsFromModules]).filter(
        (ns) => ns && ns !== 'common',
    );
}

const supported = (() => {
    const langs = new Set<string>();
    const collect = (key: string) => {
        const m = key.match(/\.\.\/locales\/([^/]+)\//);
        if (m && m[1]) langs.add(m[1].toLowerCase());
    };
    Object.keys(jsonTable).forEach(collect);
    Object.keys(modTable).forEach(collect);
    const arr = Array.from(langs);
    return arr.length ? arr : ['id', 'en'];
})();
const fallbackSetting = 'id';

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

export async function preloadLocaleNamespaces(locale?: string) {
    const active = (locale || i18n.language || fallbackSetting).toLowerCase();
    const base = active.split('-')[0];
    const core = (i18n.options?.ns as string[]) || ['common'];
    const discovered = uniq([
        ...discoverNamespacesFor(active),
        ...(base !== active ? discoverNamespacesFor(base) : []),
    ]);
    const all = uniq([...core, ...discovered]);
    // Ensure resources are fetched for all namespaces
    await i18n.reloadResources([active], all);
    await i18n.loadNamespaces(all);
}

if (!i18n.isInitialized) {
    void i18n
        .use(dynamicBackend as unknown as import('i18next').Module)
        .use(initReactI18next)
        .init({
            ns: ['common', 'menu', 'validation', 'nav', 'auth'],
            defaultNS: 'common',
            fallbackNS: ['common', 'menu', 'validation', 'nav', 'auth'],
            supportedLngs: supported,
            lng: 'id',
            fallbackLng: 'id',

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

            type MetaEnv = {
                VITE_I18N_PRELOAD_ALL?: string;
                DEV?: string | boolean;
            };
            const env = (import.meta as unknown as { env?: MetaEnv }).env || {};
            const envPreload =
                String(env.VITE_I18N_PRELOAD_ALL ?? '').toLowerCase() ===
                'true';
            const devFlag =
                typeof env.DEV === 'boolean'
                    ? env.DEV
                    : String(env.DEV ?? '').toLowerCase() === 'true';
            const preloadAll = devFlag || envPreload;

            if (preloadAll) {
                const core = (i18n.options?.ns as string[]) || ['common'];
                const candidates = uniq([
                    ...core,
                    ...discoverNamespacesFor(active),
                    ...(base !== active ? discoverNamespacesFor(base) : []),
                ]);
                if (candidates.length > 0) {
                    return i18n.loadNamespaces(candidates);
                }
            }
        });
}

export default i18n;
