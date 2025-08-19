<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    <script>
        (function() {
            try {
            var k='vite-ui-theme';
            var saved=localStorage.getItem(k);
            var sys=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            var mode = saved || (sys ? 'dark' : 'light');
            var dark = (mode==='dark') || (mode==='system' && sys);
            if (dark) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            } catch(e){}
        })();
    </script>

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
