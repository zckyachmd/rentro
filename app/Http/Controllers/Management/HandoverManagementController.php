<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Handover\CheckinRequest;
use App\Http\Requests\Management\Handover\CheckoutRequest;
use App\Models\Contract;
use App\Models\RoomHandover;
use App\Services\HandoverService;
use Illuminate\Support\Facades\Storage;

class HandoverManagementController extends Controller
{
    public function __construct(private readonly HandoverService $handover)
    {
    }

    public function index(Contract $contract)
    {
        $list = RoomHandover::query()
            ->where('contract_id', $contract->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $redoByType = [
            'checkin'  => $list->where('type', \App\Enum\RoomHandoverType::CHECKIN)->count() > 1,
            'checkout' => $list->where('type', \App\Enum\RoomHandoverType::CHECKOUT)->count() > 1,
        ];

        return response()->json([
            'handovers' => $list->map(function (RoomHandover $h) use ($redoByType) {
                return [
                    'id'               => (string) $h->id,
                    'type'             => $h->type->value,
                    'status'           => $h->status->value,
                    'recorded_at'      => $h->created_at?->toDateTimeString(),
                    'notes'            => $h->notes,
                    'acknowledged'     => (bool) ($h->meta['acknowledged_by_tenant'] ?? false),
                    'acknowledged_at'  => isset($h->meta['acknowledged_at']) ? (string) $h->meta['acknowledged_at'] : null,
                    'acknowledge_note' => isset($h->meta['acknowledge_note']) ? (string) $h->meta['acknowledge_note'] : null,
                    'disputed'         => (bool) ($h->meta['disputed_by_tenant'] ?? false),
                    'disputed_at'      => isset($h->meta['disputed_at']) ? (string) $h->meta['disputed_at'] : null,
                    'dispute_note'     => isset($h->meta['dispute_note']) ? (string) $h->meta['dispute_note'] : null,
                    'attachments'      => $h->getAttachments(),
                    'meta'             => [
                        'redo'   => $redoByType,
                        'redone' => (bool) ($redoByType[$h->type->value] ?? false),
                    ],
                ];
            }),
        ]);
    }

    public function checkin(CheckinRequest $request, Contract $contract)
    {
        $payload = ['notes' => $request->validatedNotes()];

        try {
            $handover = $this->handover->checkin($contract, $payload);
        } catch (\Throwable $e) {
            return back()->withErrors(['notes' => $e->getMessage()]);
        }

        $__uploads = $request->uploadedFiles();
        if (!empty($__uploads)) {
            $handover->storeAttachmentFiles($__uploads, 'private', 5);
        }

        activity()
            ->performedOn($handover)
            ->causedBy($request->user())
            ->event('handover_checkin_created')
            ->withProperties([
                'contract_id' => (string) $contract->id,
                'room_id'     => $contract->room_id,
            ])
            ->log('Handover check-in dibuat oleh admin');

        return back()->with('success', __('management/handover.checkin_created'));
    }

    public function checkout(CheckoutRequest $request, Contract $contract)
    {
        $payload = ['notes' => $request->validatedNotes()];

        try {
            $handover = $this->handover->checkout($contract, $payload);
        } catch (\Throwable $e) {
            return back()->withErrors(['notes' => $e->getMessage()]);
        }

        $__uploads = $request->uploadedFiles();
        if (!empty($__uploads)) {
            $handover->storeAttachmentFiles($__uploads, 'private', 5);
        }

        activity()
            ->performedOn($handover)
            ->causedBy($request->user())
            ->event('handover_checkout_created')
            ->withProperties([
                'contract_id' => (string) $contract->id,
                'room_id'     => $contract->room_id,
            ])
            ->log('Handover check-out dibuat oleh admin');

        return back()->with('success', __('management/handover.checkout_created'));
    }

    public function attachmentGeneral(RoomHandover $handover, string $path)
    {
        $raw      = urldecode(trim($path));
        $bucket   = str_contains($raw, '/private/') ? 'private' : (str_contains($raw, '/public/') || str_contains($raw, '/general/') ? 'public' : null);
        $resolved = $handover->resolveAttachmentPath($raw, $bucket);
        $disk     = $handover->attachmentDiskName($bucket);

        abort_unless($resolved && Storage::disk($disk)->exists($resolved), 404);

        return response()->file(Storage::disk($disk)->path($resolved));
    }
}
