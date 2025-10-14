import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const disableHmr =
        (env.VITE_DISABLE_HMR || '').toLowerCase() === 'true' ||
        env.VITE_DISABLE_HMR === '1';

    const ssrEnabled = String(env.INERTIA_SSR_ENABLED ?? '').toLowerCase() === 'true';

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: ssrEnabled ? 'resources/js/ssr.tsx' : undefined,
                refresh: true,
                hotFile: 'public/hot',
                buildDirectory: 'build',
            }),
            react(),
            tailwindcss(),
        ],
        esbuild: {
            jsx: 'automatic',
        },
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                '@inertiajs/react',
                'i18next',
                'react-i18next',
            ],
        },
        build: {
            target: 'es2020',
            cssCodeSplit: true,
            modulePreload: { polyfill: false },
            // esbuild is fast; for even smaller bundles you can switch to 'terser'
            minify: 'esbuild',
            reportCompressedSize: false,
            sourcemap: false,
            // Raise slightly to avoid noise once chunks are well-split
            chunkSizeWarningLimit: 1600,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (!id.includes('node_modules')) return;

                        // Be robust for pnpm paths like .../node_modules/.pnpm/pkg@ver/node_modules/pkg
                        const segmentsAfterNm = id.split('node_modules/');
                        const last = segmentsAfterNm[segmentsAfterNm.length - 1] || '';
                        const segs = last.split('/');
                        const first = segs[0] || '';
                        const pkg = first.startsWith('@') && segs.length > 1 ? `${first}/${segs[1]}` : first;

                        // Core buckets
                        if (pkg === 'react' || pkg === 'react-dom') return 'react';
                        if (pkg === '@inertiajs/react' || pkg === '@inertiajs/core' || pkg === 'ziggy-js') return 'inertia';
                        if (pkg === 'i18next' || pkg === 'react-i18next') return 'i18n';
                        // Fine-grained splitting for lucide-react icons. Avoid bundling all icons together.
                        if (pkg === 'lucide-react') {
                            // Split per-icon file when path contains /icons/
                            const marker = `${path.sep}icons${path.sep}`;
                            const idx = id.lastIndexOf(marker);
                            if (idx !== -1) {
                                const after = id.slice(idx + marker.length);
                                const file = after.split(/[\\/]/)[0] || 'icon';
                                const base = file.replace(/\.[a-zA-Z0-9]+$/, '');
                                return `icon-${base}`;
                            }
                            // Otherwise let Rollup decide (don’t group entire lucide into one chunk)
                            return undefined;
                        }
                        if (pkg === 'lodash' || pkg === 'lodash-es') return 'lodash';
                        if (pkg === 'date-fns') return 'date-fns';

                        // Fallback: split per top-level package to avoid giant vendor bundles
                        return `vendor-${pkg.replace('@', '').replace('/', '-')}`;
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'resources/js'),
            },
            // Ensure a single React instance is used
            dedupe: ['react', 'react-dom'],
        },
        // Fine-tune SSR bundling: keep heavy UI libs external to slim SSR bundle
        ssr: {
            external: [
                'react',
                'react-dom',
                '@inertiajs/core',
                '@inertiajs/react',
                'lucide-react',
                '@radix-ui/react-accordion',
                '@radix-ui/react-alert-dialog',
                '@radix-ui/react-aspect-ratio',
                '@radix-ui/react-avatar',
                '@radix-ui/react-checkbox',
                '@radix-ui/react-collapsible',
                '@radix-ui/react-dialog',
                '@radix-ui/react-dropdown-menu',
                '@radix-ui/react-label',
                '@radix-ui/react-navigation-menu',
                '@radix-ui/react-popover',
                '@radix-ui/react-radio-group',
                '@radix-ui/react-scroll-area',
                '@radix-ui/react-select',
                '@radix-ui/react-separator',
                '@radix-ui/react-slot',
                '@radix-ui/react-switch',
                '@radix-ui/react-tabs',
                '@radix-ui/react-toast',
                '@radix-ui/react-toggle',
                '@radix-ui/react-toggle-group',
                '@radix-ui/react-tooltip',
                'i18next',
                'react-i18next',
                'date-fns',
            ],
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            cors: true,
            watch: {
                usePolling: (process.env.CHOKIDAR_USEPOLLING || '').toLowerCase() === 'true',
                interval: Number(process.env.CHOKIDAR_INTERVAL || '300'),
                ignored: [
                    '**/node_modules/**',
                    '**/.git/**',
                    '**/vendor/**',
                    '**/storage/**',
                    '**/public/build/**',
                ],
            },
            hmr: disableHmr
                ? false
                : {
                      host: '127.0.0.1',
                      port: 5173,
                      protocol: 'ws',
                      clientPort: 5173,
                  },
        },
    };
});
