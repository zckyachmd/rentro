import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

import type { Config as ZiggyConfig } from 'ziggy-js';

import { route } from '../../vendor/tightenco/ziggy';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

type ZiggyRouteFn = typeof route;

declare global {
    var route: ZiggyRouteFn;
}

createServer((page) =>
    createInertiaApp({
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

            // Expose a typed global route that appends our Ziggy config automatically
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

            return <App {...props} />;
        },
    }),
);
