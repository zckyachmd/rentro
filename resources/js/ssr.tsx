import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import i18n, { preloadLocaleNamespaces } from '@/lib/i18n';
import type { Config as ZiggyConfig } from 'ziggy-js';

import { route } from '../../vendor/tightenco/ziggy';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

type ZiggyRouteFn = typeof route;

declare global {
    var route: ZiggyRouteFn;
}

createServer(async (page) => {
    try {
        const cfg = (
            page.props as unknown as {
                i18n?: { supported?: string[]; fallback?: string };
            }
        ).i18n;
        if (cfg?.fallback) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (i18n.options as any).fallbackLng = cfg.fallback;
        }
        if (cfg?.supported && Array.isArray(cfg.supported)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (i18n.options as any).supportedLngs = cfg.supported;
        }
        type PrefProps = { preferences?: { locale?: string | null } };
        const rawLocale =
            (page.props as unknown as PrefProps).preferences?.locale ?? 'en';
        const toBase = (l?: string | null) =>
            (l ?? 'en').toLowerCase().split('-')[0];
        const locale = toBase(rawLocale);
        if (i18n.language !== locale) {
            await i18n.changeLanguage(locale);
        }
        await preloadLocaleNamespaces(locale);
    } catch {
        // ignore
    }

    return createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => `${title} - ${appName}`,
        resolve: (name) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => {
            const ziggy = (page.props as Record<string, unknown>)
                .ziggy as ZiggyConfig & {
                location?:
                    | string
                    | {
                          host?: string;
                          pathname?: string;
                          search?: string;
                      };
            };

            const ziggyLocationObj = (() => {
                const loc = ziggy.location;
                if (loc && typeof loc === 'object') {
                    return loc;
                }
                const base = typeof loc === 'string' ? loc : ziggy.url;
                try {
                    const u = new URL(base);
                    return {
                        host: u.host,
                        pathname: u.pathname,
                        search: u.search,
                    };
                } catch {
                    return undefined;
                }
            })();

            const ziggyConfig: ZiggyConfig = {
                ...ziggy,
                ...(ziggyLocationObj ? { location: ziggyLocationObj } : {}),
            };

            const routeWithConfig = ((...args: Parameters<ZiggyRouteFn>) => {
                const [name, params, absolute] = args;
                return (route as ZiggyRouteFn)(
                    name,
                    params,
                    absolute,
                    ziggyConfig,
                );
            }) as ZiggyRouteFn;

            globalThis.route = routeWithConfig;

            return (
                <React.Suspense fallback={null}>
                    <App {...props} />
                </React.Suspense>
            );
        },
    });
});
