<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{{ $title ?? 'Wi‑Fi Portal' }}</title>
    @vite('resources/css/app.css')
  </head>
  <body class="bg-background text-foreground antialiased">
    <main class="container mx-auto p-4 md:p-6">
      @yield('content')
    </main>
  </body>
</html>

