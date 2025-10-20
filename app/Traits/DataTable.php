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
        $searchParam    = $options['search_param'] ?? 'search';
        $searchable     = (array) ($options['searchable'] ?? []);
        $sortable       = (array) ($options['sortable'] ?? []);
        $defaultSort    = $options['default_sort'] ?? null; // [col, dir]
        $filters        = (array) ($options['filters'] ?? []);
        $searchModeOpt  = $options['search_mode'] ?? config('datatable.search_mode', 'any');
        $searchMode     = in_array($searchModeOpt, ['any', 'all'], true) ? $searchModeOpt : 'any';
        $defaultPerPage = max(1, (int) ($options['page_size_default'] ?? config('datatable.page_size_default', 20)));
        $maxPerPage     = max($defaultPerPage, (int) ($options['page_size_max'] ?? config('datatable.page_size_max', 100)));

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

        // Search (LIKE vs ILIKE for pgsql) — supports:
        // - plain columns: 'number'
        // - relation columns: 'contract.tenant.name' or ['relation' => 'contract.tenant', 'column' => 'name']
        // - custom callbacks: function (Builder $q, string $term, string $like) { ... }
        // - multi-term queries: separate terms by whitespace, use search_mode 'any' (default, OR across terms) or 'all' (AND across terms)
        $search = trim((string) $request->query($searchParam, ''));
        if ($search !== '' && !empty($searchable)) {
            $like  = $this->tableLikeOperator();
            $terms = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY) ?: [];

            $applyTermGroup = function (Builder $q, string $term) use ($searchable, $like): void {
                $first = true;

                $applyPlain = function (Builder $q, string $col, string $term, string $like, bool &$first): void {
                    if ($first) {
                        $q->where($col, $like, "%{$term}%");
                        $first = false;
                    } else {
                        $q->orWhere($col, $like, "%{$term}%");
                    }
                };

                $applyRelation = function (Builder $q, string $relation, string $col, string $term, string $like, bool &$first): void {
                    if ($first) {
                        $q->whereHas($relation, function ($qq) use ($col, $term, $like) {
                            $qq->where($col, $like, "%{$term}%");
                        });
                        $first = false;
                    } else {
                        $q->orWhereHas($relation, function ($qq) use ($col, $term, $like) {
                            $qq->where($col, $like, "%{$term}%");
                        });
                    }
                };

                foreach ($searchable as $col) {
                    // Callback: receives (Builder $q, string $term, string $like)
                    if (is_callable($col)) {
                        if ($first) {
                            $q->where(function (Builder $nq) use ($col, $term, $like) {
                                $col($nq, $term, $like);
                            });
                            $first = false;
                        } else {
                            $q->orWhere(function (Builder $nq) use ($col, $term, $like) {
                                $col($nq, $term, $like);
                            });
                        }
                        continue;
                    }

                    // Array form: ['relation' => 'contract.tenant', 'column' => 'name']
                    if (is_array($col) && isset($col['relation'], $col['column'])) {
                        $relation = (string) $col['relation'];
                        $field    = (string) $col['column'];
                        $applyRelation($q, $relation, $field, $term, $like, $first);
                        continue;
                    }

                    // String: relation path or plain column
                    if (is_string($col) && str_contains($col, '.')) {
                        // treat last segment as column, others as relation path
                        $parts    = explode('.', $col);
                        $field    = array_pop($parts);
                        $relation = implode('.', $parts);
                        if ($relation !== '' && $field !== '') {
                            $applyRelation($q, $relation, $field, $term, $like, $first);
                            continue;
                        }
                    }

                    // Fallback: plain column string
                    if (is_string($col) && $col !== '') {
                        $applyPlain($q, $col, $term, $like, $first);
                    }
                }
            };

            // If multiple terms present, either match ANY (OR) or ALL (AND)
            if (count($terms) > 1 && $searchMode === 'all') {
                $query->where(function (Builder $q) use ($terms, $applyTermGroup) {
                    foreach ($terms as $term) {
                        $q->where(function (Builder $nq) use ($term, $applyTermGroup) {
                            $applyTermGroup($nq, $term);
                        });
                    }
                });
            } else {
                // Default: ANY term matches
                $query->where(function (Builder $q) use ($terms, $applyTermGroup) {
                    $firstGroup = true;
                    foreach ($terms as $term) {
                        if ($firstGroup) {
                            $q->where(function (Builder $nq) use ($term, $applyTermGroup) {
                                $applyTermGroup($nq, $term);
                            });
                            $firstGroup = false;
                        } else {
                            $q->orWhere(function (Builder $nq) use ($term, $applyTermGroup) {
                                $applyTermGroup($nq, $term);
                            });
                        }
                    }
                });
            }
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
        $perPage = max(1, min($maxPerPage, (int) $request->integer('per_page', $defaultPerPage)));

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
