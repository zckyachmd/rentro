<?php

namespace App\Http\Requests\Management\Promotion;

use App\Models\Floor;
use App\Models\Promotion;
use App\Models\PromotionScope;
use App\Models\Room;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePromotionScopeRequest extends FormRequest
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

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            /** @var PromotionScope|null $scope */
            $scope = $this->route('scope');
            if (!$scope) {
                return;
            }
            $promotion = $scope->promotion;
            if (!$promotion) {
                return;
            }
            /** @var Promotion $promotion */

            $type        = (string) $this->input('scope_type');
            $hasGlobal   = $promotion->scopes()->where('scope_type', 'global')->where('id', '!=', $scope->id)->exists();
            $hasRoomType = $promotion->scopes()->where('scope_type', 'room_type')->where('id', '!=', $scope->id)->exists();
            $otherExists = $promotion->scopes()->where('id', '!=', $scope->id)->exists();

            if ($type === 'global') {
                if ($otherExists) {
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

            if ($type === 'building') {
                $bid = (int) $this->input('building_id');
                if ($bid > 0) {
                    $dup = $promotion->scopes()->where('id', '!=', $scope->id)->where('scope_type', 'building')->where('building_id', $bid)->exists();
                    if ($dup) {
                        $v->errors()->add('building_id', __('management/promotions.scope_duplicate'));
                    }
                    // Existing narrower floors will be reconciled in controller.
                    $roomIds = Room::query()->where('building_id', $bid)->pluck('id')->all();
                    // Existing narrower rooms will be reconciled in controller.
                }
            } elseif ($type === 'floor') {
                $fid = (int) $this->input('floor_id');
                if ($fid > 0) {
                    $dup = $promotion->scopes()->where('id', '!=', $scope->id)->where('scope_type', 'floor')->where('floor_id', $fid)->exists();
                    if ($dup) {
                        $v->errors()->add('floor_id', __('management/promotions.scope_duplicate'));
                    }
                    $floor = Floor::query()->find($fid);
                    if ($floor) {
                        $hasBuilding = $promotion->scopes()->where('id', '!=', $scope->id)->where('scope_type', 'building')->where('building_id', (int) $floor->building_id)->exists();
                        if ($hasBuilding) {
                            $v->errors()->add('floor_id', __('management/promotions.scope_conflict_narrower'));
                        }
                        // Existing narrower rooms will be reconciled in controller.
                    }
                }
            } elseif ($type === 'room_type') {
                $rtid = (int) $this->input('room_type_id');
                if ($rtid > 0) {
                    $dup = $promotion->scopes()->where('id', '!=', $scope->id)->where('scope_type', 'room_type')->where('room_type_id', $rtid)->exists();
                    if ($dup) {
                        $v->errors()->add('room_type_id', __('management/promotions.scope_duplicate'));
                    }
                }
            } elseif ($type === 'room') {
                $rid = (int) $this->input('room_id');
                if ($rid > 0) {
                    $dup = $promotion->scopes()->where('id', '!=', $scope->id)->where('scope_type', 'room')->where('room_id', $rid)->exists();
                    if ($dup) {
                        $v->errors()->add('room_id', __('management/promotions.scope_duplicate'));
                    }
                    $room = Room::query()->find($rid);
                    if ($room) {
                        $hasBuilding = $promotion->scopes()->where('id', '!=', $scope->id)->where('scope_type', 'building')->where('building_id', (int) $room->building_id)->exists();
                        $hasFloor    = $promotion->scopes()->where('id', '!=', $scope->id)->where('scope_type', 'floor')->where('floor_id', (int) $room->floor_id)->exists();
                        if ($hasBuilding || $hasFloor) {
                            $v->errors()->add('room_id', __('management/promotions.scope_conflict_narrower'));
                        }
                    }
                }
            }
        });
    }
}
