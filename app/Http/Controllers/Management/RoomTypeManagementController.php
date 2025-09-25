<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\RoomType\CreateRoomTypeRequest;
use App\Http\Requests\Management\RoomType\UpdateRoomTypeRequest;
use App\Models\RoomType;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RoomTypeManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = RoomType::query();

        $options = [
            'select'       => ['id', 'name', 'slug', 'capacity', 'prices', 'deposits', 'description', 'is_active'],
            'search_param' => 'search',
            'searchable'   => ['name', 'slug'],
            'sortable'     => [
                'name'     => 'name',
                'capacity' => 'capacity',
                'price'    => function ($q, string $dir) {
                    $direction = strtolower($dir) === 'desc' ? 'DESC' : 'ASC';
                    $driver    = DB::connection()->getDriverName();
                    if ($driver === 'pgsql') {
                        $q->orderByRaw("COALESCE((prices->>'monthly')::bigint, 0) {$direction}");
                    } else {
                        $q->orderByRaw(
                            'COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(prices, \'$."monthly"\')) AS UNSIGNED), 0) ' . $direction,
                        );
                    }
                },
            ],
            'default_sort' => ['name', 'asc'],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<RoomType> $page */
        $page = $this->applyTable($query, $request, $options);

        $collection = $page->getCollection();
        $mapped     = $collection->map(function (RoomType $t): array {
            $priceM = is_array($t->prices) ? ($t->prices['monthly'] ?? null) : null;
            $priceW = is_array($t->prices) ? ($t->prices['weekly'] ?? null) : null;
            $priceD = is_array($t->prices) ? ($t->prices['daily'] ?? null) : null;
            $depM   = is_array($t->deposits) ? ($t->deposits['monthly'] ?? null) : null;
            $depW   = is_array($t->deposits) ? ($t->deposits['weekly'] ?? null) : null;
            $depD   = is_array($t->deposits) ? ($t->deposits['daily'] ?? null) : null;

            $fmt = function ($amount): ?string {
                if ($amount === null) {
                    return null;
                }
                $idr = (int) round((int) $amount);

                return 'Rp ' . number_format($idr, 0, ',', '.');
            };

            return [
                'id'                     => (string) $t->id,
                'name'                   => $t->name,
                'slug'                   => $t->slug,
                'capacity'               => (int) $t->capacity,
                'price_daily_rupiah'     => $fmt($priceD),
                'price_weekly_rupiah'    => $fmt($priceW),
                'price_monthly_rupiah'   => $fmt($priceM),
                'deposit_daily_rupiah'   => $fmt($depD),
                'deposit_weekly_rupiah'  => $fmt($depW),
                'deposit_monthly_rupiah' => $fmt($depM),
                'is_active'              => (bool) $t->is_active,
                'description'            => $t->description,
            ];
        });

        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        return Inertia::render('management/room-types/index', [
            'room_types' => $payload,
            'query'      => [
                'page'    => $payload['current_page'],
                'perPage' => $payload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateRoomTypeRequest $request): RedirectResponse
    {
        $v = $request->validated();

        $prices = [
            'monthly' => array_key_exists('price_rupiah', $v) && $v['price_rupiah'] !== null ? (int) round(((float) $v['price_rupiah'])) : null,
            'weekly'  => array_key_exists('price_weekly_rupiah', $v) && $v['price_weekly_rupiah'] !== null ? (int) round(((float) $v['price_weekly_rupiah'])) : null,
            'daily'   => array_key_exists('price_daily_rupiah', $v) && $v['price_daily_rupiah'] !== null ? (int) round(((float) $v['price_daily_rupiah'])) : null,
        ];
        $deposits = [
            'monthly' => array_key_exists('deposit_rupiah', $v) && $v['deposit_rupiah'] !== null ? (int) round(((float) $v['deposit_rupiah'])) : null,
            'weekly'  => array_key_exists('deposit_weekly_rupiah', $v) && $v['deposit_weekly_rupiah'] !== null ? (int) round(((float) $v['deposit_weekly_rupiah'])) : null,
            'daily'   => array_key_exists('deposit_daily_rupiah', $v) && $v['deposit_daily_rupiah'] !== null ? (int) round(((float) $v['deposit_daily_rupiah'])) : null,
        ];

        RoomType::create([
            'name'        => $v['name'],
            'slug'        => $v['slug'] ?? null,
            'capacity'    => $v['capacity'],
            'prices'      => $prices,
            'deposits'    => $deposits,
            'description' => $v['description'] ?? null,
            'is_active'   => (bool) ($v['is_active'] ?? true),
        ]);

        return back()->with('success', __('management/room_types.created'));
    }

    // create/show/edit are not used for Inertia pages.

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRoomTypeRequest $request, RoomType $room_type): RedirectResponse
    {
        $v = $request->validated();

        $prices = [
            'monthly' => array_key_exists('price_rupiah', $v) && $v['price_rupiah'] !== null ? (int) round(((float) $v['price_rupiah'])) : null,
            'weekly'  => array_key_exists('price_weekly_rupiah', $v) && $v['price_weekly_rupiah'] !== null ? (int) round(((float) $v['price_weekly_rupiah'])) : null,
            'daily'   => array_key_exists('price_daily_rupiah', $v) && $v['price_daily_rupiah'] !== null ? (int) round(((float) $v['price_daily_rupiah'])) : null,
        ];
        $deposits = [
            'monthly' => array_key_exists('deposit_rupiah', $v) && $v['deposit_rupiah'] !== null ? (int) round(((float) $v['deposit_rupiah'])) : null,
            'weekly'  => array_key_exists('deposit_weekly_rupiah', $v) && $v['deposit_weekly_rupiah'] !== null ? (int) round(((float) $v['deposit_weekly_rupiah'])) : null,
            'daily'   => array_key_exists('deposit_daily_rupiah', $v) && $v['deposit_daily_rupiah'] !== null ? (int) round(((float) $v['deposit_daily_rupiah'])) : null,
        ];

        $room_type->update([
            'name'        => $v['name'],
            'slug'        => $v['slug'] ?? null,
            'capacity'    => $v['capacity'],
            'prices'      => $prices,
            'deposits'    => $deposits,
            'description' => $v['description'] ?? null,
            'is_active'   => (bool) ($v['is_active'] ?? true),
        ]);

        return back()->with('success', __('management/room_types.updated'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RoomType $room_type): RedirectResponse
    {
        $room_type->delete();

        return back()->with('success', __('management/room_types.deleted'));
    }
}
