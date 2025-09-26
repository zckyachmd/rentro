<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Icons & Manifest -->
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="mask-icon" href="/favicon.svg" color="#0b0b0b">

    <!-- Theme & Color Scheme -->
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0b0b">
    <meta name="color-scheme" content="light dark">

    <!-- Basic SEO Defaults (can be overridden per-page) -->
    <meta name="application-name" content="{{ config('app.name', 'Laravel') }}">
    <meta property="og:site_name" content="{{ config('app.name', 'Laravel') }}">
    @if (env('VITE_TWITTER_HANDLE'))
        <meta name="twitter:site" content="{{ env('VITE_TWITTER_HANDLE') }}">
    @endif

    <!-- Scripts -->
    <script>
        (function () {
            try {
                var root = document.documentElement;
                var THEME = 'system';
                var PREF_KEY = 'rentro:preferences';
                try { localStorage.removeItem('rentro-theme'); } catch (e) {}
                try {
                    var raw = localStorage.getItem(PREF_KEY);
                    if (raw) {
                        if (raw === 'dark' || raw === 'light' || raw === 'system') {
                            THEME = raw;
                        } else {
                            var obj = JSON.parse(raw);
                            var t = obj && typeof obj === 'object' ? obj.theme : undefined;
                            if (t === 'dark' || t === 'light' || t === 'system') THEME = t;
                        }
                    }
                } catch (e) {}

                // 2) Cookie fallback
                if (!THEME || THEME === 'system') {
                    var m = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
                    var fromCookie = m && m[1];
                    if (fromCookie === 'dark' || fromCookie === 'light' || fromCookie === 'system') {
                        THEME = fromCookie;
                        try {
                            var base2 = localStorage.getItem(PREF_KEY);
                            var baseObj2 = base2 && base2 !== 'dark' && base2 !== 'light' && base2 !== 'system' ? JSON.parse(base2) : {};
                            localStorage.setItem(PREF_KEY, JSON.stringify({ ...(baseObj2 && typeof baseObj2 === 'object' ? baseObj2 : {}), theme: THEME }));
                        } catch (e) {}
                    }
                }

                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var isDark = THEME === 'dark' || (THEME === 'system' && prefersDark);

                root.dataset.theme = THEME;
                root.dataset.themeResolved = isDark ? 'dark' : 'light';
                root.classList.toggle('dark', isDark);
                root.style.colorScheme = isDark ? 'dark' : 'light';
            } catch (e) {
                // ignore
            }
        })();
    </script>

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="min-h-screen bg-background text-foreground font-sans antialiased">
    @inertia
</body>

</html>
