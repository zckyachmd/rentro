<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

trait DataTable
{
    /**
     * Apply common table behaviors: filtering (search), sorting, and pagination.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     * @param \Illuminate\Database\Eloquent\Builder<TModel> $query
     * @param \Illuminate\Http\Request $request
     * @param array<string,mixed> $options
     * @return \Illuminate\Pagination\LengthAwarePaginator<TModel>
     */
    protected function applyTable(
        Builder $query,
        Request $request,
        array $options,
    ): LengthAwarePaginator {
        $searchParam = $options['search_param'] ?? 'search';
        $searchable  = (array) ($options['searchable'] ?? []);
        $sortable    = (array) ($options['sortable'] ?? []);
        $defaultSort = $options['default_sort'] ?? null; // [col, dir]
        $filters     = (array) ($options['filters'] ?? []);

        // Optional select & with
        if (!empty($options['select'])) {
            $query->select($options['select']);
        }
        if (!empty($options['with'])) {
            $query->with($options['with']);
        }

        // External filters based on request params
        foreach ($filters as $param => $callback) {
            $value = $request->query($param);
            if ($value !== null && $value !== '' && is_callable($callback)) {
                $callback($query, $value);
            }
        }

        // Search (LIKE vs ILIKE for pgsql)
        $search = trim((string) $request->query($searchParam, ''));
        if ($search !== '' && !empty($searchable)) {
            $like = $this->tableLikeOperator();
            $query->where(function (Builder $q) use ($search, $like, $searchable) {
                foreach ($searchable as $i => $col) {
                    $method = $i === 0 ? 'where' : 'orWhere';
                    $q->{$method}($col, $like, "%{$search}%");
                }
            });
        }

        // Sorting (allow mapping or callback per key)
        $sort = (string) $request->query('sort', '');
        $dir  = strtolower((string) $request->query('dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        if ($sort !== '' && array_key_exists($sort, $sortable)) {
            $map = $sortable[$sort];
            if (is_callable($map)) {
                $map($query, $dir);
            } else {
                $query->orderBy($map, $dir);
            }
        } elseif (is_array($defaultSort) && count($defaultSort) === 2) {
            [$col, $d] = $defaultSort;
            $query->orderBy($col, strtolower($d) === 'desc' ? 'desc' : 'asc');
        }

        // Pagination
        $page    = max(1, (int) $request->integer('page', 1));
        $perPage = max(1, min(100, (int) $request->integer('per_page', 20)));

        return $query->paginate($perPage, ['*'], 'page', $page)->withQueryString();
    }

    /** Detect proper LIKE operator for database driver (LIKE vs ILIKE for pgsql). */
    protected function tableLikeOperator(): string
    {
        $driver = config('database.default');
        $conn   = config("database.connections.{$driver}.driver");
        $isPg   = ($driver === 'pgsql') || ($conn === 'pgsql') || str_contains((string) $driver, 'pgsql');

        return $isPg ? 'ilike' : 'like';
    }

    /**
     * Standardize paginator payload into a flat shape compatible with FE types:
     * [ 'data' => [...], 'total' => ..., 'from' => ..., 'to' => ..., 'current_page' => ..., 'last_page' => ..., 'per_page' => ... ]
     *
     * @template TItem
     * @param \Illuminate\Pagination\LengthAwarePaginator<TItem> $paginator
     * @return array{data: array<int, TItem>, total: int, from: int|null, to: int|null, current_page: int, last_page: int, per_page: int}
     */
    protected function tablePaginate(LengthAwarePaginator $paginator): array
    {
        $meta = [
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
        ];

        $data = $paginator->items();

        return array_merge($meta, [
            'data' => $data,
        ]);
    }
}
