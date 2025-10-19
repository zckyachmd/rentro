import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import i18n, { preloadLocaleNamespaces } from '@/lib/i18n';
import { prefetchIcons } from '@/lib/lucide';
import '../css/app.css';

const appName =
    import.meta.env?.VITE_APP_NAME ??
    (typeof document !== 'undefined'
        ? (document
              .querySelector('meta[name="application-name"]')
              ?.getAttribute('content') ??
          document
              .querySelector('meta[property="og:site_name"]')
              ?.getAttribute('content'))
        : undefined) ??
    'Laravel';

createInertiaApp({
    title: (title) =>
        title && title.trim().length > 0 ? `${title} - ${appName}` : appName,
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const render = () => {
            if (el.hasChildNodes()) {
                hydrateRoot(
                    el,
                    <React.Suspense fallback={null}>
                        <App {...props} />
                    </React.Suspense>,
                );
            } else {
                createRoot(el).render(
                    <React.Suspense fallback={null}>
                        <App {...props} />
                    </React.Suspense>,
                );
            }
        };

        try {
            type PrefProps = {
                initialPage?: {
                    props?: {
                        preferences?: { locale?: string | null };
                        i18n?: { supported?: string[]; fallback?: string };
                    };
                };
                page?: {
                    props?: {
                        preferences?: { locale?: string | null };
                        i18n?: { supported?: string[]; fallback?: string };
                    };
                };
            };
            const p = props as PrefProps;
            const cfg =
                p?.initialPage?.props?.i18n ??
                p?.page?.props?.i18n ??
                undefined;
            if (cfg?.supported && Array.isArray(cfg.supported)) {
                (
                    i18n.options as unknown as { supportedLngs?: string[] }
                ).supportedLngs = cfg.supported;
            }
            const rawLocale =
                p?.initialPage?.props?.preferences?.locale ??
                p?.page?.props?.preferences?.locale ??
                'id';

            const toBase = (l?: string | null) =>
                (l ?? 'id').toLowerCase().split('-')[0];
            const locale = toBase(rawLocale);

            const ensure = async () => {
                try {
                    if (i18n.language !== locale) {
                        await i18n.changeLanguage(locale);
                    }
                    await preloadLocaleNamespaces(locale);
                    // Preload icons likely needed on the initial view to avoid lazy flicker
                    try {
                        type MenuLike = {
                            icon?: string;
                            children?: MenuLike[];
                        };
                        type RootProps = {
                            menus?: Array<{ items?: Array<MenuLike> }>;
                            publicMenus?: MenuLike[];
                        };
                        const rootProps: RootProps = (p?.initialPage?.props ??
                            p?.page?.props ??
                            {}) as RootProps;
                        const collect = new Set<string>();
                        // App menus
                        const menus = rootProps?.menus as
                            | Array<{
                                  items?: Array<{
                                      icon?: string;
                                      children?: Array<{ icon?: string }>;
                                  }>;
                              }>
                            | undefined;
                        if (Array.isArray(menus)) {
                            for (const g of menus) {
                                for (const it of g.items ?? []) {
                                    if (it?.icon) collect.add(String(it.icon));
                                    for (const ch of it.children ?? []) {
                                        if (ch?.icon)
                                            collect.add(String(ch.icon));
                                    }
                                }
                            }
                        }
                        // Public menus
                        const publicMenus = rootProps?.publicMenus;
                        if (Array.isArray(publicMenus)) {
                            const walk = (arr: MenuLike[]) => {
                                for (const it of arr) {
                                    if (it?.icon) collect.add(String(it.icon));
                                    if (Array.isArray(it?.children))
                                        walk(it.children);
                                }
                            };
                            walk(publicMenus);
                        }
                        if (collect.size > 0) {
                            await prefetchIcons(Array.from(collect));
                        }
                    } catch {
                        // ignore icon preload failures
                    }
                    try {
                        document.documentElement.lang = locale;
                    } catch {
                        void 0;
                    }
                } catch {
                    void 0;
                }
            };
            void ensure().then(render).catch(render);
        } catch {
            render();
        }
    },
    progress: { color: '#4B5563' },
});
