<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme-storage-key="rentro-theme">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark light">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    <script>
        (function () {
            try {
                var root = document.documentElement;
                var KEY = root && root.dataset ? (root.dataset.themeStorageKey || 'rentro-theme') : 'rentro-theme';
                var theme = localStorage.getItem(KEY) || 'system';

                if (!localStorage.getItem(KEY)) {
                    var m = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
                    if (m && (m[1] === 'dark' || m[1] === 'light' || m[1] === 'system')) {
                        theme = m[1];
                        try { localStorage.setItem(KEY, theme); } catch (e) {}
                    }
                }

                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var isDark = theme === 'dark' || (theme === 'system' && prefersDark);

                root.dataset.theme = theme;
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
