Config Documentation Standards
==============================

Goal
----

Provide clear, consistent, and discoverable comments for every config file and key so maintainers can quickly understand:

- What each key controls ("mempengaruhi apa")
- Which environment variable maps to it (if any)
- Defaults and units
- Any gotchas or usage notes

Header Block (Required)
-----------------------

Each `config/*.php` file should begin with a header block:

```php
/*
|--------------------------------------------------------------------------
| Config: <filename without .php>
|--------------------------------------------------------------------------
| Purpose: <one sentence about the purpose of this config>
| Keys/Sections: <optional high-level sections overview>
*/
```

Key Comments
------------

For each key or section, add a short comment that includes:

- Plain language description of what it affects
- Env var mapping (if any), e.g., `(env FOO_BAR)`
- Units/constraints (e.g., seconds, minutes, regex, 0..31)

Examples
--------

Small/simple config:

```php
/*
|--------------------------------------------------------------------------
| Config: vite
|--------------------------------------------------------------------------
| Purpose: Vite asset pipeline integration.
| Keys:
| - concurrency (env VITE_CONCURRENCY): Max concurrent prefetch requests.
*/
return [
    'concurrency' => (int) env('VITE_CONCURRENCY', 4),
];
```

Complex config with sections:

```php
/*
|--------------------------------------------------------------------------
| Config: datatable
|--------------------------------------------------------------------------
| Purpose: Defaults for server-side data table behavior used across pages.
| Keys:
| - search_mode (env DATATABLE_SEARCH_MODE): 'any' (OR) | 'all' (AND).
| - page_size_default (env DATATABLE_PAGE_SIZE_DEFAULT): Default page size.
| - page_size_max (env DATATABLE_PAGE_SIZE_MAX): Maximum page size.
*/
return [
    'search_mode'      => env('DATATABLE_SEARCH_MODE', 'any'),
    'page_size_default'=> (int) env('DATATABLE_PAGE_SIZE_DEFAULT', 25),
    'page_size_max'    => (int) env('DATATABLE_PAGE_SIZE_MAX', 200),
];
```

When Not to Over-Comment
------------------------

- Laravel’s default files already include extensive section comments; prefer adding the header block and only add key comments when defaults are ambiguous or project-specific.
- Avoid duplicating the same explanation across many keys if a section comment covers them.

Checklist
---------

- Header block present at top of file.
- Each custom key has a one-line comment describing effect and env var mapping.
- Units/limits stated where meaningful.
- Links to upstream docs added if they unblock future maintainers.

