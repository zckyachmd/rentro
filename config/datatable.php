<?php

/*
|--------------------------------------------------------------------------
| Config: datatable
|--------------------------------------------------------------------------
| Purpose: Defaults for server-side data table behavior used across pages.
| Keys:
| - search_mode (env DATATABLE_SEARCH_MODE): Multi-term search behavior.
|   Use 'any' to match any term (OR) or 'all' to require all terms (AND).
| - page_size_default (env DATATABLE_PAGE_SIZE_DEFAULT): Default page size.
| - page_size_max (env DATATABLE_PAGE_SIZE_MAX): Maximum allowed page size.
| Notes: Controllers may override these per-table via the $options array.
*/

return [
    // Controls multi-term search behavior in server-side tables.
    // any: matches if ANY term matches any searchable field (OR across terms)
    // all: requires ALL terms to match (AND across terms)
    // Impacts: backend applyTable() search combining logic.
    'search_mode' => env('DATATABLE_SEARCH_MODE', 'any'),

    // Default number of rows per page returned by controllers using DataTable.
    // Impacts: backend pagination size (also reflected in FE dropdown via server meta).
    'page_size_default' => (int) env('DATATABLE_PAGE_SIZE_DEFAULT', 25),

    // Upper bound for per_page accepted from request. Prevents abuse by very
    // large page sizes that could degrade DB performance.
    // Impacts: backend clamps incoming per_page to this value.
    'page_size_max' => (int) env('DATATABLE_PAGE_SIZE_MAX', 200),
];
