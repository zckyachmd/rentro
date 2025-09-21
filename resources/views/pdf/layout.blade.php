<!doctype html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>@yield('title', config('app.name') . ' • PDF')</title>
    <style>
        /* Base font */
        body {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            color: #111;
            font-size: 12px;
        }

        .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 0 4px;
            position: relative;
        }

        /* Bootstrap-like helpers */
        .text-start {
            text-align: left;
        }

        .text-center {
            text-align: center;
        }

        .text-end {
            text-align: right;
        }

        .fw-bold {
            font-weight: 700;
        }

        .small {
            font-size: 11px;
            color: #666;
        }

        .muted {
            color: #666;
        }

        .mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .brand {
            font-weight: 700;
            font-size: 16px;
        }

        .divider {
            border-top: 1px dashed #bbb;
            margin: 8px 0;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table td,
        .table th {
            vertical-align: top;
            border: 0;
        }

        .table-sm td,
        .table-sm th {
            padding: 4px 0;
        }

        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 11px;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
        }
    </style>
    @stack('pdf-styles')
    @stack('pdf-scripts')
</head>

<body>
    <div class="container">
        @yield('content')
    </div>
</body>

</html>
