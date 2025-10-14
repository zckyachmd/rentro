<?php

namespace App\Http\Requests\Management\Promotion;

use App\Models\Floor;
use App\Models\Promotion;
use App\Models\Room;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePromotionScopeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('promotion.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'scope_type'   => ['required', Rule::in(['global', 'building', 'floor', 'room_type', 'room'])],
            'building_id'  => ['nullable', 'integer', 'min:1'],
            'floor_id'     => ['nullable', 'integer', 'min:1'],
            'room_type_id' => ['nullable', 'integer', 'min:1'],
            'room_id'      => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Enforce scope hierarchy: if promotion already has a global scope, disallow other scopes;
     * if attempting to add a global scope, disallow when any scope already exists.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            /** @var Promotion|null $promotion */
            $promotion = $this->route('promotion');
            if (!$promotion) {
                return;
            }

            $type        = (string) $this->input('scope_type');
            $hasAny      = $promotion->scopes()->exists();
            $hasGlobal   = $promotion->scopes()->where('scope_type', 'global')->exists();
            $hasRoomType = $promotion->scopes()->where('scope_type', 'room_type')->exists();

            if ($type === 'global') {
                if ($hasAny) {
                    $v->errors()->add('scope_type', __('management/promotions.scope_global_conflict'));
                }
            } else {
                if ($hasGlobal) {
                    $v->errors()->add('scope_type', __('management/promotions.scope_global_exists'));
                }
            }

            // If broader room_type exists, disallow adding narrower building/floor/room
            if (in_array($type, ['building', 'floor', 'room'], true) && $hasRoomType) {
                $v->errors()->add('scope_type', __('management/promotions.scope_conflict_narrower'));
            }

            // Avoid duplicates and broader/narrower conflicts (building > floor > room)
            if ($type === 'building') {
                $bid = (int) $this->input('building_id');
                if ($bid > 0) {
                    // duplicate building scope
                    $dup = $promotion->scopes()->where('scope_type', 'building')->where('building_id', $bid)->exists();
                    if ($dup) {
                        $v->errors()->add('building_id', __('management/promotions.scope_duplicate'));
                    }
                    // narrower floor/room already exist under this building
                    Floor::query()->where('building_id', $bid)->pluck('id')->all();
                    // so we do not error here.
                    Room::query()->where('building_id', $bid)->pluck('id')->all();
                }
            } elseif ($type === 'floor') {
                $fid = (int) $this->input('floor_id');
                if ($fid > 0) {
                    // duplicate floor scope
                    $dup = $promotion->scopes()->where('scope_type', 'floor')->where('floor_id', $fid)->exists();
                    if ($dup) {
                        $v->errors()->add('floor_id', __('management/promotions.scope_duplicate'));
                    }
                    $floor = Floor::query()->find($fid);
                    if ($floor) {
                        $hasBuilding = $promotion->scopes()->where('scope_type', 'building')->where('building_id', (int) $floor->building_id)->exists();
                        if ($hasBuilding) {
                            $v->errors()->add('floor_id', __('management/promotions.scope_conflict_narrower'));
                        }
                    }
                }
            } elseif ($type === 'room_type') {
                $rtid = (int) $this->input('room_type_id');
                if ($rtid > 0) {
                    $dup = $promotion->scopes()->where('scope_type', 'room_type')->where('room_type_id', $rtid)->exists();
                    if ($dup) {
                        $v->errors()->add('room_type_id', __('management/promotions.scope_duplicate'));
                    }
                }
            } elseif ($type === 'room') {
                $rid = (int) $this->input('room_id');
                if ($rid > 0) {
                    // duplicate room scope
                    $dup = $promotion->scopes()->where('scope_type', 'room')->where('room_id', $rid)->exists();
                    if ($dup) {
                        $v->errors()->add('room_id', __('management/promotions.scope_duplicate'));
                    }
                    $room = Room::query()->find($rid);
                    if ($room) {
                        // broader building / floor exists covering this room
                        $hasBuilding = $promotion->scopes()->where('scope_type', 'building')->where('building_id', (int) $room->building_id)->exists();
                        $hasFloor    = $promotion->scopes()->where('scope_type', 'floor')->where('floor_id', (int) $room->floor_id)->exists();
                        if ($hasBuilding || $hasFloor) {
                            $v->errors()->add('room_id', __('management/promotions.scope_conflict_narrower'));
                        }
                    }
                }
            }
        });
    }
}
