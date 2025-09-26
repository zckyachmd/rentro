<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Promotion\StorePromotionActionRequest;
use App\Http\Requests\Management\Promotion\StorePromotionRequest;
use App\Http\Requests\Management\Promotion\StorePromotionRuleRequest;
use App\Http\Requests\Management\Promotion\StorePromotionScopeRequest;
use App\Http\Requests\Management\Promotion\UpdatePromotionActionRequest;
use App\Http\Requests\Management\Promotion\UpdatePromotionRequest;
use App\Http\Requests\Management\Promotion\UpdatePromotionRuleRequest;
use App\Http\Requests\Management\Promotion\UpdatePromotionScopeRequest;
use App\Models\Promotion;
use App\Models\PromotionAction;
use App\Models\PromotionCoupon;
use App\Models\PromotionRule;
use App\Models\PromotionScope;
use App\Traits\DataTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PromotionManagementController extends Controller
{
    use DataTable;

    public function index(Request $request)
    {
        $query   = Promotion::query();
        $options = [
            'select' => [
                'id', 'name', 'slug', 'description', 'valid_from', 'valid_until', 'stack_mode', 'priority', 'total_quota',
                'per_user_limit', 'per_contract_limit', 'per_invoice_limit', 'per_day_limit', 'per_month_limit',
                'default_channel', 'require_coupon', 'is_active', 'tags',
            ],
            'search_param' => 'search',
            'searchable'   => ['name', 'slug', 'description'],
            'sortable'     => [
                'name'        => 'name',
                'priority'    => 'priority',
                'valid_from'  => 'valid_from',
                'valid_until' => 'valid_until',
            ],
            'default_sort' => ['priority', 'asc'],
        ];

        $page       = $this->applyTable($query, $request, $options);
        $collection = $page->getCollection();
        $mapped     = $collection->map(function (Promotion $p): array {
            return [
                'id'              => (string) $p->id,
                'name'            => $p->name,
                'slug'            => $p->slug,
                'description'     => $p->description,
                'valid_from'      => optional($p->valid_from)->toDateString(),
                'valid_until'     => optional($p->valid_until)->toDateString(),
                'stack_mode'      => (string) $p->stack_mode->value,
                'priority'        => (int) $p->priority,
                'default_channel' => $p->default_channel?->value,
                'require_coupon'  => (bool) $p->require_coupon,
                'is_active'       => (bool) $p->is_active,
                'tags'            => is_array($p->tags) ? $p->tags : [],
            ];
        });
        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        return Inertia::render('management/promotion/index', [
            'promotions' => $payload,
            'query'      => [
                'page'    => $payload['current_page'],
                'perPage' => $payload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
            ],
        ]);
    }

    public function store(StorePromotionRequest $request): RedirectResponse
    {
        $v    = $request->validated();
        $slug = $v['slug'] ?? null;
        if (!$slug && !empty($v['name'])) {
            $slug = Str::slug((string) $v['name']);
        }
        Promotion::create([
            'name'               => $v['name'],
            'slug'               => $slug,
            'description'        => $v['description'] ?? null,
            'valid_from'         => $v['valid_from'] ?? null,
            'valid_until'        => $v['valid_until'] ?? null,
            'stack_mode'         => $v['stack_mode'],
            'priority'           => (int) ($v['priority'] ?? 100),
            'total_quota'        => $v['total_quota'] ?? null,
            'per_user_limit'     => $v['per_user_limit'] ?? null,
            'per_contract_limit' => $v['per_contract_limit'] ?? null,
            'per_invoice_limit'  => $v['per_invoice_limit'] ?? null,
            'per_day_limit'      => $v['per_day_limit'] ?? null,
            'per_month_limit'    => $v['per_month_limit'] ?? null,
            'default_channel'    => $v['default_channel'] ?? null,
            'require_coupon'     => (bool) ($v['require_coupon'] ?? false),
            'is_active'          => (bool) ($v['is_active'] ?? true),
            'tags'               => $v['tags'] ?? null,
        ]);

        return back()->with('success', __('management/promotions.created'));
    }

    public function update(UpdatePromotionRequest $request, Promotion $promotion): RedirectResponse
    {
        $v    = $request->validated();
        $slug = $v['slug'] ?? null;
        if (!$slug && !empty($v['name'])) {
            $slug = Str::slug((string) $v['name']);
        }
        $promotion->update([
            'name'               => $v['name'],
            'slug'               => $slug,
            'description'        => $v['description'] ?? null,
            'valid_from'         => $v['valid_from'] ?? null,
            'valid_until'        => $v['valid_until'] ?? null,
            'stack_mode'         => $v['stack_mode'],
            'priority'           => (int) ($v['priority'] ?? 100),
            'total_quota'        => $v['total_quota'] ?? null,
            'per_user_limit'     => $v['per_user_limit'] ?? null,
            'per_contract_limit' => $v['per_contract_limit'] ?? null,
            'per_invoice_limit'  => $v['per_invoice_limit'] ?? null,
            'per_day_limit'      => $v['per_day_limit'] ?? null,
            'per_month_limit'    => $v['per_month_limit'] ?? null,
            'default_channel'    => $v['default_channel'] ?? null,
            'require_coupon'     => (bool) ($v['require_coupon'] ?? false),
            'is_active'          => (bool) ($v['is_active'] ?? true),
            'tags'               => $v['tags'] ?? null,
        ]);

        return back()->with('success', __('management/promotions.updated'));
    }

    public function destroy(Promotion $promotion): RedirectResponse
    {
        $promotion->delete();

        return back()->with('success', __('management/promotions.deleted'));
    }

    public function show(Promotion $promotion)
    {
        $promotion->load(['scopes', 'rules', 'actions' => fn ($q) => $q->orderBy('priority')]);

        $dto = [
            'id'              => (string) $promotion->id,
            'name'            => $promotion->name,
            'slug'            => $promotion->slug,
            'description'     => $promotion->description,
            'valid_from'      => optional($promotion->valid_from)->toDateString(),
            'valid_until'     => optional($promotion->valid_until)->toDateString(),
            'stack_mode'      => (string) $promotion->stack_mode->value,
            'priority'        => (int) $promotion->priority,
            'default_channel' => $promotion->default_channel?->value,
            'require_coupon'  => (bool) $promotion->require_coupon,
            'is_active'       => (bool) $promotion->is_active,
            'tags'            => is_array($promotion->tags) ? $promotion->tags : [],
        ];

        $scopes = $promotion->scopes->map(function ($s) {
            /* @var PromotionScope $s */
            return [
                'id'           => (int) $s->id,
                'scope_type'   => (string) $s->scope_type->value,
                'building_id'  => $s->building_id ? (int) $s->building_id : null,
                'floor_id'     => $s->floor_id ? (int) $s->floor_id : null,
                'room_type_id' => $s->room_type_id ? (int) $s->room_type_id : null,
                'room_id'      => $s->room_id ? (int) $s->room_id : null,
            ];
        });

        $rules = $promotion->rules->map(function ($r) {
            /* @var PromotionRule $r */
            return [
                'id'                 => (int) $r->id,
                'min_spend_idr'      => $r->min_spend_idr ? (int) $r->min_spend_idr : null,
                'max_discount_idr'   => $r->max_discount_idr ? (int) $r->max_discount_idr : null,
                'applies_to_rent'    => (bool) $r->applies_to_rent,
                'applies_to_deposit' => (bool) $r->applies_to_deposit,
                'billing_periods'    => is_array($r->billing_periods) ? $r->billing_periods : [],
                'date_from'          => optional($r->date_from)->toDateString(),
                'date_until'         => optional($r->date_until)->toDateString(),
                'days_of_week'       => is_array($r->days_of_week) ? $r->days_of_week : [],
                'time_start'         => $r->time_start,
                'time_end'           => $r->time_end,
                'channel'            => $r->channel?->value,
                'first_n_periods'    => $r->first_n_periods ? (int) $r->first_n_periods : null,
                'allowed_role_names' => is_array($r->allowed_role_names) ? $r->allowed_role_names : [],
                'allowed_user_ids'   => is_array($r->allowed_user_ids) ? array_map('intval', $r->allowed_user_ids) : [],
            ];
        });

        $actions = $promotion->actions->map(function ($a) {
            /* @var PromotionAction $a */
            return [
                'id'                 => (int) $a->id,
                'action_type'        => (string) $a->action_type->value,
                'applies_to_rent'    => (bool) $a->applies_to_rent,
                'applies_to_deposit' => (bool) $a->applies_to_deposit,
                'percent_bps'        => $a->percent_bps ? (int) $a->percent_bps : null,
                'amount_idr'         => $a->amount_idr ? (int) $a->amount_idr : null,
                'fixed_price_idr'    => $a->fixed_price_idr ? (int) $a->fixed_price_idr : null,
                'n_days'             => $a->n_days ? (int) $a->n_days : null,
                'n_periods'          => $a->n_periods ? (int) $a->n_periods : null,
                'max_discount_idr'   => $a->max_discount_idr ? (int) $a->max_discount_idr : null,
                'priority'           => (int) $a->priority,
            ];
        });

        // Option lists (simple, non-cascading)
        $buildings = \App\Models\Building::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn ($b) => [
                'value'       => (string) $b->id,
                'label'       => trim($b->name . (isset($b->code) && $b->code ? " ({$b->code})" : '')),
                'description' => null,
            ]);
        $floors = \App\Models\Floor::query()
            ->with('building:id,name')
            ->orderBy('building_id')->orderBy('level')
            ->get(['id', 'building_id', 'level', 'name'])
            ->map(fn ($f) => [
                'value'       => (string) $f->id,
                'label'       => ($f->name ?: ('Lantai ' . $f->level)),
                'description' => optional($f->building)->name,
                'payload'     => ['building_id' => (int) $f->building_id],
            ]);
        $roomTypes = \App\Models\RoomType::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($t) => [
                'value'       => (string) $t->id,
                'label'       => (string) $t->name,
                'description' => null,
            ]);
        $rooms = \App\Models\Room::query()
            ->with(['building:id,name', 'floor:id,level'])
            ->orderBy('building_id')->orderBy('floor_id')->orderBy('number')
            ->get(['id', 'building_id', 'floor_id', 'number', 'name', 'room_type_id'])
            ->map(fn ($r) => [
                'value'       => (string) $r->id,
                'label'       => trim(($r->number ?: (string) $r->id) . ($r->name ? ' - ' . $r->name : '')),
                'description' => trim((optional($r->building)->name ?? '') . ' • Lantai ' . (optional($r->floor)->level ?? '?')),
                'payload'     => [
                    'building_id'  => (int) $r->building_id,
                    'floor_id'     => (int) $r->floor_id,
                    'room_type_id' => $r->room_type_id ? (int) $r->room_type_id : null,
                ],
            ]);

        $coupons = $promotion->coupons()->orderByDesc('created_at')->get(['id', 'code', 'is_active', 'max_redemptions', 'redeemed_count', 'expires_at'])->map(function (PromotionCoupon $c) {
            return [
                'id'              => (int) $c->id,
                'code'            => (string) $c->code,
                'is_active'       => (bool) $c->is_active,
                'max_redemptions' => $c->max_redemptions ? (int) $c->max_redemptions : null,
                'redeemed_count'  => (int) ($c->redeemed_count ?? 0),
                'expires_at'      => optional($c->expires_at)->toDateString(),
            ];
        });

        return Inertia::render('management/promotion/detail', [
            'promotion' => $dto,
            'scopes'    => $scopes,
            'rules'     => $rules,
            'actions'   => $actions,
            'coupons'   => $coupons,
            'options'   => [
                'buildings'  => $buildings,
                'floors'     => $floors,
                'room_types' => $roomTypes,
                'rooms'      => $rooms,
            ],
        ]);
    }

    // Scopes
    public function storeScope(StorePromotionScopeRequest $request, Promotion $promotion): RedirectResponse
    {
        $v = $request->validated();
        $promotion->scopes()->create($v);

        return back()->with('success', __('management/promotions.scope_created'));
    }

    public function storeScopesBulk(\Illuminate\Http\Request $request, Promotion $promotion): RedirectResponse
    {
        $data = $request->validate([
            'scope_type' => ['required', \Illuminate\Validation\Rule::in(['building', 'floor', 'room_type', 'room'])],
            'ids'        => ['required', 'array', 'min:1'],
            'ids.*'      => ['integer', 'min:1'],
        ]);
        $type = $data['scope_type'];
        $ids  = array_values(array_unique(array_map('intval', $data['ids'])));
        $rows = [];
        foreach ($ids as $id) {
            $row = ['scope_type' => $type];
            switch ($type) {
                case 'building':
                    $row['building_id'] = $id;
                    break;
                case 'floor':
                    $row['floor_id'] = $id;
                    break;
                case 'room_type':
                    $row['room_type_id'] = $id;
                    break;
                case 'room':
                    $row['room_id'] = $id;
                    break;
            }
            $rows[] = $row;
        }
        foreach ($rows as $r) {
            $promotion->scopes()->create($r);
        }

        return back()->with('success', __('management/promotions.scopes_created'));
    }

    public function updateScope(UpdatePromotionScopeRequest $request, PromotionScope $scope): RedirectResponse
    {
        $scope->update($request->validated());

        return back()->with('success', __('management/promotions.scope_updated'));
    }

    public function destroyScope(PromotionScope $scope): RedirectResponse
    {
        $scope->delete();

        return back()->with('success', __('management/promotions.scope_deleted'));
    }

    // Rules
    public function storeRule(StorePromotionRuleRequest $request, Promotion $promotion): RedirectResponse
    {
        $v = $request->validated();
        $promotion->rules()->create($v);

        return back()->with('success', __('management/promotions.rule_created'));
    }

    public function updateRule(UpdatePromotionRuleRequest $request, PromotionRule $rule): RedirectResponse
    {
        $rule->update($request->validated());

        return back()->with('success', __('management/promotions.rule_updated'));
    }

    public function destroyRule(PromotionRule $rule): RedirectResponse
    {
        $rule->delete();

        return back()->with('success', __('management/promotions.rule_deleted'));
    }

    // Actions
    public function storeAction(StorePromotionActionRequest $request, Promotion $promotion): RedirectResponse
    {
        $v = $request->validated();
        $promotion->actions()->create($v);

        return back()->with('success', __('management/promotions.action_created'));
    }

    public function updateAction(UpdatePromotionActionRequest $request, PromotionAction $action): RedirectResponse
    {
        $action->update($request->validated());

        return back()->with('success', __('management/promotions.action_updated'));
    }

    public function destroyAction(PromotionAction $action): RedirectResponse
    {
        $action->delete();

        return back()->with('success', __('management/promotions.action_deleted'));
    }

    // Coupons
    public function storeCoupon(\Illuminate\Http\Request $request, Promotion $promotion): RedirectResponse
    {
        $v = $request->validate([
            'code'            => ['required', 'string', 'max:64'],
            'is_active'       => ['boolean'],
            'max_redemptions' => ['nullable', 'integer', 'min:0'],
            'expires_at'      => ['nullable', 'date'],
        ]);
        $promotion->coupons()->create([
            'code'            => $v['code'],
            'is_active'       => (bool) ($v['is_active'] ?? true),
            'max_redemptions' => $v['max_redemptions'] ?? null,
            'expires_at'      => $v['expires_at'] ?? null,
        ]);

        return back()->with('success', __('management/promotions.coupon_created'));
    }

    public function updateCoupon(\Illuminate\Http\Request $request, PromotionCoupon $coupon): RedirectResponse
    {
        $v = $request->validate([
            'code'            => ['required', 'string', 'max:64'],
            'is_active'       => ['boolean'],
            'max_redemptions' => ['nullable', 'integer', 'min:0'],
            'expires_at'      => ['nullable', 'date'],
        ]);
        $coupon->update([
            'code'            => $v['code'],
            'is_active'       => (bool) ($v['is_active'] ?? true),
            'max_redemptions' => $v['max_redemptions'] ?? null,
            'expires_at'      => $v['expires_at'] ?? null,
        ]);

        return back()->with('success', __('management/promotions.coupon_updated'));
    }

    public function destroyCoupon(PromotionCoupon $coupon): RedirectResponse
    {
        $coupon->delete();

        return back()->with('success', __('management/promotions.coupon_deleted'));
    }

    public function storeCouponsBulk(\Illuminate\Http\Request $request, Promotion $promotion): RedirectResponse
    {
        $v = $request->validate([
            'count'           => ['required', 'integer', 'min:1', 'max:2000'],
            'prefix'          => ['nullable', 'string', 'max:10'],
            'length'          => ['nullable', 'integer', 'min:4', 'max:32'],
            'is_active'       => ['boolean'],
            'max_redemptions' => ['nullable', 'integer', 'min:0'],
            'expires_at'      => ['nullable', 'date'],
        ]);
        $count  = (int) $v['count'];
        $prefix = (string) ($v['prefix'] ?? '');
        $len    = (int) ($v['length'] ?? 10);
        $active = (bool) ($v['is_active'] ?? true);
        $maxR   = $v['max_redemptions'] ?? null;
        $exp    = $v['expires_at'] ?? null;

        $codes    = [];
        $attempts = 0;
        while (count($codes) < $count && $attempts < ($count * 10)) {
            $attempts++;
            $rand = strtoupper(bin2hex(random_bytes((int) ceil($len / 2))));
            $code = $prefix . substr($rand, 0, $len);
            if (!\App\Models\PromotionCoupon::query()->where('promotion_id', $promotion->id)->where('code', $code)->exists()) {
                $codes[] = $code;
            }
        }

        foreach ($codes as $code) {
            $promotion->coupons()->create([
                'code'            => $code,
                'is_active'       => $active,
                'max_redemptions' => $maxR,
                'expires_at'      => $exp,
            ]);
        }

        return back()->with('success', __('management/promotions.coupons_created'));
    }

    public function exportCoupons(Promotion $promotion)
    {
        $rows    = $promotion->coupons()->orderBy('id')->get(['code', 'is_active', 'max_redemptions', 'redeemed_count', 'expires_at']);
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="coupons-' . $promotion->slug . '.csv"',
        ];

        $callback = function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['code', 'is_active', 'max_redemptions', 'redeemed_count', 'expires_at']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r->code,
                    $r->is_active ? 1 : 0,
                    $r->max_redemptions ?? '',
                    (int) ($r->redeemed_count ?? 0),
                    optional($r->expires_at)->toDateString(),
                ]);
            }
            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }
}
