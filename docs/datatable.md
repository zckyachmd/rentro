Data Table Pattern (Server-Side)
================================

This project uses Laravel + Inertia (React) with TanStack Table and shadcn/ui to build powerful, accessible, and reusable data tables with server-side pagination, sorting, and filtering.

Overview
--------

- Backend: `App\Traits\DataTable` centralizes search, sort, filters, and pagination logic.
- Frontend: Reusable components in `resources/js/components/ui` implement shadcn/TanStack best practices:
  - `data-table.tsx` — base table with selection, empty/loading states.
  - `data-table-toolbar.tsx` — search, columns visibility (persisted), optional auto-refresh.
  - `data-table-pagination.tsx` — server/client pagination controls.
  - `data-table-server.tsx` — glue for server-mode (controlled search/sort/pagination).
  - `data-table-column-header.tsx` — accessible sortable header + helper `makeColumn`.

Backend Usage
-------------

Use the `DataTable` trait in controllers to apply common behaviors and return a paginator payload compatible with FE components.

Example:

```php
use App\Traits\DataTable;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    use DataTable;

    public function index(Request $request)
    {
        $query = User::query();

        $options = [
            'select'             => ['id', 'name', 'email'],
            'with'               => ['roles:id,name'],
            'search_param'       => 'search',
            'searchable'         => ['name', 'email', 'phone'],
            'sortable'           => [
                'name'  => 'name',
                'email' => 'email',
            ],
            'default_sort'       => ['name', 'asc'],
            'filters'            => [
                'role_id' => fn ($q, $roleId) => $q->whereHas('roles', fn ($r) => $r->where('id', $roleId)),
            ],
            // Optional (new): override global config per table
            'search_mode'        => 'any', // 'any' (OR across terms) | 'all' (AND across terms)
            'page_size_default'  => 25,
            'page_size_max'      => 200,
        ];

        $page = $this->applyTable($query, $request, $options);

        // Map items if needed
        $page->setCollection($page->getCollection()->map(fn(User $u) => [
            'id'    => $u->id,
            'name'  => $u->name,
            'email' => $u->email,
        ]));

        return Inertia::render('management/user/index', [
            'users' => $this->tablePaginate($page),
            'query' => [
                'page'    => $page->currentPage(),
                'perPage' => $page->perPage(),
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
            ],
        ]);
    }
}
```

Supported query params (server-side):

- `page` — current page (1-based)
- `per_page` — page size (clamped to `page_size_max`)
- `search` — global search text (split by spaces into terms)
- `sort` — allowed key from `sortable` map (e.g., `name`)
- `dir` — `asc` | `desc`
- Custom filters — declare in `filters` map (param => closure)

Frontend Usage
--------------

Define columns with `makeColumn` and use `DataTableServer` with `useServerTable`.

```tsx
// columns.tsx
import { makeColumn } from '@/components/ui/data-table-column-header'
import type { ColumnDef } from '@tanstack/react-table'

type Row = { id: number; name: string; email: string }

export const columns: ColumnDef<Row>[] = [
  makeColumn<Row>({ id: 'name', accessorKey: 'name', sortable: true }),
  makeColumn<Row>({ id: 'email', accessorKey: 'email', sortable: true }),
]
```

```tsx
// index.tsx
import { DataTableServer } from '@/components/ui/data-table-server'
import { useServerTable } from '@/hooks/use-datatable'

export default function Page() {
  const { props } = usePage<{ users: { data: Row[] } & PaginatorMeta; query: any }>()
  const { q, onQueryChange, handleSortChange } = useServerTable({
    paginator: props.users,
    initial: props.query,
  })

  return (
    <DataTableServer<Row, unknown>
      columns={columns}
      rows={props.users.data}
      paginator={props.users}
      search={q.search}
      onSearchChange={(v) => onQueryChange({ page: 1, search: v })}
      sort={q.sort}
      dir={q.dir}
      onSortChange={handleSortChange}
      onQueryChange={onQueryChange}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  )
}
```

Key Conventions
---------------

- Column IDs used for sorting must match allowed keys in backend `$options['sortable']`.
- `useServerTable` centralizes query handling via Inertia (`page`, `per_page`, `search`, `sort`, `dir`, plus any custom filters).
- Toolbar supports:
  - Debounced/submit search
  - Column visibility toggle with optional localStorage persistence
  - Optional auto-refresh control
- Pagination supports server meta (total, from/to, current/last page, page size) and propagates changes via `onQueryChange`.

New (Backend) Features
----------------------

- Multi-term search: split by spaces.
  - `search_mode: 'any'` (default): any term matches (OR across terms)
  - `search_mode: 'all'`: all terms must match (AND across terms)
- Configurable page size:
  - Global config in `config/datatable.php` or via env:
    - `DATATABLE_PAGE_SIZE_DEFAULT` (default 25)
    - `DATATABLE_PAGE_SIZE_MAX` (default 200)
  - Per-table overrides: `page_size_default`, `page_size_max` in `$options`

Frontend Note
-------------

If the server returns a page size not present in the table’s `pageSizeOptions`, the UI will automatically include it in the dropdown.

Best Practices Checklist
------------------------

- Keep heavy mapping/formatting in controllers before sending to Inertia.
- Limit selected columns (`select`) and eager load relationships (`with`) to avoid N+1.
- Use `sortable` map to strictly control sort keys (prevent injection).
- For computed sorts, use closures with subqueries (see `last_active_at` in Users).
- Prefer `DataTableServer` for uniform UX and server-state control.
