<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        $contracts = Contract::query()
            ->where('user_id', $request->user()->id)
            ->with(['room:id,number'])
            ->orderByDesc('start_date')
            ->get()
            ->map(function ($c) {
                /** @var \App\Models\Contract $c */
                /** @var \App\Models\Room|null $room */
                $room = $c->room;

                return [
                    'id'         => (string) $c->id,
                    'room'       => $room ? ['id' => (string) $room->id, 'number' => $room->number] : null,
                    'start_date' => $c->start_date->format('Y-m-d'),
                    'end_date'   => $c->end_date?->format('Y-m-d'),
                    'status'     => $c->status->value,
                    'auto_renew' => (bool) $c->auto_renew,
                ];
            });

        return Inertia::render('tenant/contract/index', [
            'contracts' => [
                'data' => $contracts,
            ],
        ]);
    }
}
