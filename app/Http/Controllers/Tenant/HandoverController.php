<?php

namespace App\Http\Controllers\Tenant;

use App\Enum\ContractStatus;
use App\Enum\RoomStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\HandoverDisputeRequest;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\RoomHandover;
use App\Services\Contracts\ContractServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HandoverController extends Controller
{
    public function __construct(
        private readonly ContractServiceInterface $contractService,
    ) {
    }

    public function index(Request $request, Contract $contract)
    {
        abort_unless((string) $contract->user_id === (string) $request->user()->id, 404);

        $list = RoomHandover::query()
            ->where('contract_id', $contract->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'handovers' => $list->map(function (RoomHandover $h) {
                $status = strtolower((string) ($h->status ?? ''));
                $ack    = (bool) ($h->meta['acknowledged_by_tenant'] ?? false);
                $disp   = (bool) ($h->meta['disputed_by_tenant'] ?? false);

                return [
                    'id'              => (string) $h->id,
                    'type'            => $h->type,
                    'status'          => $h->status,
                    'recorded_at'     => $h->created_at?->toDateTimeString(),
                    'notes'           => $h->notes,
                    'acknowledged'    => $ack,
                    'acknowledged_at' => isset($h->meta['acknowledged_at']) ? (string) $h->meta['acknowledged_at'] : null,
                    'disputed'        => $disp,
                    'disputed_at'     => isset($h->meta['disputed_at']) ? (string) $h->meta['disputed_at'] : null,
                    'dispute_note'    => isset($h->meta['dispute_note']) ? (string) $h->meta['dispute_note'] : null,
                    'attachments'     => $h->getAttachments(),
                    'meta'            => [
                        // can_respond true persis sekali pada status pending sebelum tenant mengambil tindakan apa pun
                        'can_respond' => ($status === 'pending' && !$ack && !$disp),
                    ],
                ];
            }),
        ]);
    }

    public function acknowledge(Request $request, RoomHandover $handover)
    {
        $c = $handover->contract;
        abort_unless((string) ($c?->user_id) === (string) $request->user()->id, 404);

        $status = (string) ($handover->status ?? '');
        if (strtolower($status) !== 'pending') {
            $msg = $status === 'Confirmed'
                ? 'Serah terima ini sudah dikonfirmasi sebelumnya.'
                : ($status === 'Disputed'
                    ? 'Serah terima ini sudah disanggah. Tidak dapat dikonfirmasi.'
                    : 'Status serah terima tidak valid untuk dikonfirmasi.');

            return back()->with('error', $msg);
        }
        $meta                           = (array) ($handover->meta ?? []);
        $meta['acknowledged_by_tenant'] = true;
        $meta['acknowledged_at']        = now()->toDateTimeString();
        $meta['acknowledge_note']       = (string) $request->string('note');
        unset($meta['disputed_by_tenant'], $meta['disputed_at'], $meta['dispute_note']);

        $handover->update([
            'status' => 'Confirmed',
            'meta'   => $meta,
        ]);

        activity()
            ->performedOn($handover)
            ->causedBy($request->user())
            ->event('handover_confirmed_by_tenant')
            ->withProperties([
                'contract_id'   => (string) $handover->contract_id,
                'handover_type' => $handover->type,
            ])
            ->log('Tenant mengonfirmasi handover');

        try {
            $contract = $handover->contract;
            if ($contract && $handover->type === 'checkin') {
                $requireTenantAck = (bool) (AppSetting::config('handover.require_checkin_for_activate', AppSetting::config('handover.require_tenant_ack_for_activate', false)) ?? false);
                if ($requireTenantAck && $contract->status->value !== ContractStatus::ACTIVE->value) {
                    $contract->forceFill(['status' => ContractStatus::ACTIVE])->save();
                    $room = $contract->room;
                    if ($room && $room->status->value !== RoomStatus::OCCUPIED->value) {
                        $room->update(['status' => RoomStatus::OCCUPIED->value]);
                    }
                }
            }
        } catch (\Throwable $e) {
            // fail-safe
        }

        try {
            if ($handover->type === 'checkout') {
                $requireTenantAckForComplete = (bool) AppSetting::config('handover.require_tenant_ack_for_complete', false);
                if ($requireTenantAckForComplete) {
                    $contract = $handover->contract;
                    if ($contract && $contract->status->value !== ContractStatus::COMPLETED->value) {
                        $this->contractService->complete($contract);
                    }
                }
            }
        } catch (\Throwable $e) {
            // abaikan
        }

        return back()->with('success', 'Terima kasih, Anda telah mengonfirmasi handover ini.');
    }

    public function dispute(HandoverDisputeRequest $request, RoomHandover $handover)
    {
        $c = $handover->contract;
        abort_unless((string) ($c?->user_id) === (string) $request->user()->id, 404);

        $status = (string) ($handover->status ?? '');
        if (strtolower($status) !== 'pending') {
            $msg = $status === 'Confirmed'
                ? 'Serah terima ini sudah dikonfirmasi sebelumnya. Tidak dapat disanggah.'
                : ($status === 'Disputed'
                    ? 'Serah terima ini sudah disanggah sebelumnya.'
                    : 'Status serah terima tidak valid untuk disanggah.');

            return back()->with('error', $msg);
        }

        $validated                      = $request->validated();
        $meta                           = (array) ($handover->meta ?? []);
        $meta['disputed_by_tenant']     = true;
        $meta['disputed_at']            = now()->toDateTimeString();
        $meta['dispute_note']           = (string) ($validated['note'] ?? '');
        $meta['acknowledged_by_tenant'] = false;
        $meta['acknowledged_at']        = null;
        $meta['acknowledge_note']       = null;

        $handover->update([
            'status' => 'Disputed',
            'meta'   => $meta,
        ]);

        // Jika checkout disanggah dan sistem auto-complete saat admin checkout (tanpa butuh konfirmasi tenant),
        // maka kembalikan kontrak ke ACTIVE agar admin bisa melakukan checkout ulang.
        try {
            if ($handover->type === 'checkout') {
                $requireCheckoutComplete     = (bool) AppSetting::config('handover.require_checkout_for_complete', true);
                $requireTenantAckForComplete = (bool) AppSetting::config('handover.require_tenant_ack_for_complete', false);
                $contract                    = $handover->contract;
                if ($requireCheckoutComplete && !$requireTenantAckForComplete && $contract && $contract->status->value === ContractStatus::COMPLETED->value) {
                    $contract->forceFill(['status' => ContractStatus::ACTIVE])->save();
                    $room = $contract->room;
                    if ($room && $room->status->value !== RoomStatus::OCCUPIED->value) {
                        $room->update(['status' => RoomStatus::OCCUPIED->value]);
                    }
                }
            }
        } catch (\Throwable $e) {
            // abaikan;
        }

        activity()
            ->performedOn($handover)
            ->causedBy($request->user())
            ->event('handover_disputed_by_tenant')
            ->withProperties([
                'contract_id'   => (string) $handover->contract_id,
                'handover_type' => $handover->type,
            ])
            ->log('Tenant mengajukan sanggahan handover');

        return back()->with('success', 'Sanggahan Anda telah dicatat.');
    }

    public function attachmentGeneral(Request $request, RoomHandover $handover, string $path)
    {
        $c2 = $handover->contract;
        abort_unless((string) ($c2?->user_id) === (string) $request->user()->id, 404);

        $raw      = urldecode(trim($path));
        $bucket   = str_contains($raw, '/private/') ? 'private' : (str_contains($raw, '/public/') || str_contains($raw, '/general/') ? 'public' : null);
        $resolved = $handover->resolveAttachmentPath($raw, $bucket);
        $disk     = $handover->attachmentDiskName($bucket);

        abort_unless($resolved && Storage::disk($disk)->exists($resolved), 404);

        return response()->file(Storage::disk($disk)->path($resolved));
    }
}
