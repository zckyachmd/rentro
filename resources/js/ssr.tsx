import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { renderToString } from 'react-dom/server';

import i18n, { preloadLocaleNamespaces } from '@/lib/i18n';
import { prefetchIcons } from '@/lib/lucide';
import route from 'ziggy-js';

type I18nCarrier = {
    i18n?: { locale?: string | null };
    preferences?: { locale?: string | null };
};

export default async (page: unknown) => {
    // Ensure i18n is ready on the server before rendering to string
    try {
        // Read initial locale from the page props sent by Laravel
        // Fallback to 'id' if missing (base language only)
        const rawLocale =
            (page as unknown as { props?: I18nCarrier })?.props?.i18n?.locale ??
            (page as unknown as { props?: I18nCarrier })?.props?.preferences
                ?.locale ??
            'id';
        const locale = String(rawLocale || 'id')
            .toLowerCase()
            .split('-')[0];

        if (i18n.language !== locale) {
            await i18n.changeLanguage(locale);
        }
        await preloadLocaleNamespaces(locale);
    } catch {
        // best-effort; avoid failing SSR for i18n issues
    }

    // Preload likely-used icons on the server so SSR markup matches client hydration
    try {
        type MenuLike = { icon?: string; children?: MenuLike[] };
        type RootProps = {
            menus?: Array<{ items?: Array<MenuLike> }>;
            publicMenus?: MenuLike[];
        };
        const rootProps =
            (page as unknown as { props?: RootProps })?.props ?? {};
        const collect = new Set<string>();

        const menus = rootProps.menus ?? [];
        for (const g of menus) {
            for (const it of g.items ?? []) {
                if (it?.icon) collect.add(String(it.icon));
                for (const ch of it.children ?? []) {
                    if (ch?.icon) collect.add(String(ch.icon));
                }
            }
        }

        const publicMenus = rootProps.publicMenus ?? [];
        const walk = (arr: MenuLike[]) => {
            for (const it of arr) {
                if (it?.icon) collect.add(String(it.icon));
                if (Array.isArray(it?.children)) walk(it.children);
            }
        };
        walk(publicMenus);

        if (collect.size > 0) {
            await prefetchIcons(Array.from(collect));
        }
    } catch {
        // ignore icon preload failures on SSR
    }

    return createInertiaApp({
        // Cast to satisfy SSR types without importing duplicate Page types
        page: page as unknown as string,
        render: renderToString,
        resolve: (name: string) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.{tsx,ts,jsx,js}'),
            ),
        setup: ({ App, props }) => {
            const resolvedRoute =
                (route as unknown as { route?: typeof route }).route ?? route;
            (globalThis as unknown as { route: typeof route }).route =
                resolvedRoute;

            try {
                // Prefer the Ziggy config sent via Inertia props
                const p = (props ?? {}) as {
                    initialPage?: { props?: unknown };
                    page?: { props?: unknown };
                };
                const pageProps = (p?.initialPage?.props ??
                    p?.page?.props ??
                    {}) as { ziggy?: unknown };
                const ziggyConfig = pageProps?.ziggy;
                if (ziggyConfig) {
                    (globalThis as unknown as { Ziggy?: unknown }).Ziggy =
                        ziggyConfig;
                }
            } catch {
                // ignore
            }

            return <App {...props} />;
        },
    });
};
