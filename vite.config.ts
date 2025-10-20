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

    const publicUrl = (env.VITE_PUBLIC_URL || env.VITE_APP_URL || env.APP_URL || '').trim();
    const devHost = env.VITE_HOST || '127.0.0.1';
    let hmrHost = env.VITE_HMR_HOST || devHost;
    let hmrProtocol: 'ws' | 'wss' = 'ws';
    if (env.VITE_HMR_PROTOCOL) {
        const p = String(env.VITE_HMR_PROTOCOL).toLowerCase();
        hmrProtocol = p === 'wss' ? 'wss' : 'ws';
    }
    let hmrClientPort = Number(env.VITE_HMR_CLIENT_PORT || '') || 5173;
    try {
        if (publicUrl && /https?:\/\//i.test(publicUrl)) {
            const u = new URL(publicUrl);
            if (!env.VITE_HMR_HOST) {
                hmrHost = u.hostname;
            }
            if (!env.VITE_HMR_PROTOCOL) {
                const isHttps = u.protocol === 'https:';
                hmrProtocol = isHttps ? 'wss' : 'ws';
            }
        }
    } catch {
        // ignore invalid URL;
    }

    return {
        define: {
            'import.meta.env.VITE_APP_DEBUG': JSON.stringify(env.APP_DEBUG ?? ''),
        },
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.tsx',
                ssrOutputDirectory: 'bootstrap/ssr',
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
            minify: 'esbuild',
            reportCompressedSize: false,
            sourcemap: false,
            chunkSizeWarningLimit: 1600,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (!id.includes('node_modules')) return;

                        const segmentsAfterNm = id.split('node_modules/');
                        const last = segmentsAfterNm[segmentsAfterNm.length - 1] || '';
                        const segs = last.split('/');
                        const first = segs[0] || '';
                        const pkg = first.startsWith('@') && segs.length > 1 ? `${first}/${segs[1]}` : first;

                        if (pkg === 'react' || pkg === 'react-dom') return 'react';
                        if (pkg === '@inertiajs/react' || pkg === '@inertiajs/core' || pkg === 'ziggy-js') return 'inertia';
                        if (pkg === 'i18next' || pkg === 'react-i18next') return 'i18n';
                        if (pkg === 'lucide-react') {
                            const marker = `${path.sep}icons${path.sep}`;
                            const idx = id.lastIndexOf(marker);
                            if (idx !== -1) {
                                const after = id.slice(idx + marker.length);
                                const file = after.split(/[\\/]/)[0] || 'icon';
                                const base = file.replace(/\.[a-zA-Z0-9]+$/, '');
                                return `icon-${base}`;
                            }
                            return undefined;
                        }
                        if (pkg === 'lodash' || pkg === 'lodash-es') return 'lodash';
                        if (pkg === 'date-fns') return 'date-fns';

                        return `vendor-${pkg.replace('@', '').replace('/', '-')}`;
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'resources/js'),
            },
            dedupe: ['react', 'react-dom'],
        },
        server: {
            host: devHost,
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
                : { host: hmrHost, port: 5173, protocol: hmrProtocol, clientPort: hmrClientPort },
        },
    };
});
