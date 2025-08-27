<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Traits\DataTable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    use DataTable;

    /**
     * List audit logs using reusable DataTable trait (filter, search, sort, paginate).
     */
    public function index(Request $request)
    {
        $query = Activity::query();

        $options = [
            'with'         => ['causer', 'subject'],
            'search_param' => 'search',
            'searchable'   => ['description', 'log_name', 'event'],
            'sortable'     => [
                'created_at' => 'created_at',
                'event'      => 'event',
                'user'       => function ($q, string $dir) {
                    $q->orderBy('causer_id', $dir);
                },
            ],
            'default_sort' => ['created_at', 'desc'],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\Spatie\Activitylog\Models\Activity> $page */
        $page = $this->applyTable($query, $request, $options);

        /** @var \Illuminate\Database\Eloquent\Collection<int, \Spatie\Activitylog\Models\Activity> $collection */
        $collection = $page->getCollection();

        $mapped = $collection->map(function (Activity $a): array {
            return [
                'id'           => (int) $a->id,
                'log_name'     => (string) ($a->log_name ?? ''),
                'event'        => (string) ($a->event ?? ''),
                'description'  => (string) ($a->description ?? ''),
                'subject_type' => (string) ($a->subject_type ?? ''),
                'subject_id'   => $a->subject_id ? (int) $a->subject_id : null,
                'causer'       => [
                    'id'    => optional($a->causer)->getAttribute('id'),
                    'name'  => optional($a->causer)->getAttribute('name'),
                    'email' => optional($a->causer)->getAttribute('email'),
                ],
                'properties' => $a->properties ?? [],
                'created_at' => optional($a->created_at)->toISOString(),
            ];
        });

        $page->setCollection($mapped);

        $logsPayload = $this->tablePaginate($page);

        return Inertia::render('management/audit/index', [
            'logs'  => $logsPayload,
            'query' => [
                'page'         => $logsPayload['current_page'],
                'per_page'     => $logsPayload['per_page'],
                'sort'         => $request->query('sort'),
                'dir'          => $request->query('dir'),
                'search'       => $request->query('q'),
                'user_id'      => $request->query('user_id'),
                'subject_type' => $request->query('subject_type'),
                'event'        => $request->query('event'),
            ],
        ]);
    }
}
