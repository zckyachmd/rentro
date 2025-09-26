<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Room\BatchRoomPhotoRequest;
use App\Http\Requests\Management\Room\StoreRoomPhotoRequest;
use App\Models\Room;
use App\Models\RoomPhoto;
use App\Traits\LogActivity;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RoomPhotoManagementController extends Controller
{
    use LogActivity;

    public function index(Room $room)
    {
        return response()->json([
            'photos' => $room->photos()->get(['id', 'path', 'is_cover', 'ordering']),
        ]);
    }

    public function store(StoreRoomPhotoRequest $request, Room $room)
    {
        $validated = $request->validated();

        /** @var array<int, UploadedFile>|UploadedFile|null $filesRaw */
        $filesRaw = $validated['photos'] ?? null;
        $files    = is_array($filesRaw) ? $filesRaw : (isset($filesRaw) ? [$filesRaw] : []);

        $stored = [];
        foreach ($files as $file) {
            $path     = $file->store("rooms/{$room->id}", 'public');
            $stored[] = $room->photos()->create(['path' => $path]);
        }

        if (!empty($stored)) {
            $this->logEvent(
                event: 'room_photo_added',
                causer: $request->user(),
                subject: $room,
                properties: [
                    'room_id'   => (string) $room->id,
                    'count'     => count($stored),
                    'photo_ids' => collect($stored)->pluck('id')->map(fn ($v) => (string) $v)->values()->all(),
                ],
                logName: 'room',
            );
        }

        return back()->with('success', __('management/rooms.photos.added'));
    }

    public function destroy(Room $room, RoomPhoto $photo)
    {
        if ((int) $photo->room_id !== (int) $room->id) {
            abort(404);
        }
        $photoId  = (string) $photo->id;
        $wasCover = (bool) $photo->is_cover;
        DB::transaction(function () use ($room, $photo): void {
            $path     = $photo->path;
            $wasCover = (bool) $photo->is_cover;
            $photo->delete();

            if ($path && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }

            if ($wasCover) {
                /** @var RoomPhoto|null $first */
                $first = RoomPhoto::query()
                    ->where('room_id', $room->id)
                    ->orderBy('ordering')
                    ->first();
                if ($first) {
                    RoomPhoto::query()->where('room_id', $room->id)->update(['is_cover' => false]);
                    $first->is_cover = true;
                    $first->save();
                }
            }
        });

        $this->logEvent(
            event: 'room_photo_deleted',
            causer: request()->user(),
            subject: $room,
            properties: [
                'room_id'   => (string) $room->id,
                'photo_id'  => $photoId,
                'was_cover' => $wasCover,
            ],
            logName: 'room',
        );

        return back()->with('success', __('management/rooms.photos.deleted'));
    }

    public function batch(BatchRoomPhotoRequest $request, Room $room)
    {
        $data = $request->validated();

        try {
            DB::transaction(function () use ($data, $room): void {
                $toDelete = collect($data['deleted_ids'] ?? [])->map(fn ($v) => (int) $v)->values();
                if ($toDelete->isNotEmpty()) {
                    $photos = RoomPhoto::query()->where('room_id', $room->id)->whereIn('id', $toDelete)->get();
                    foreach ($photos as $p) {
                        $path = $p->path;
                        $p->delete();
                        if ($path && Storage::disk('public')->exists($path)) {
                            Storage::disk('public')->delete($path);
                        }
                    }
                }

                $ordered = collect($data['ordered_ids'] ?? [])->map(fn ($v) => (int) $v)->values();
                if ($ordered->isNotEmpty()) {
                    $exists  = RoomPhoto::query()->where('room_id', $room->id)->whereIn('id', $ordered)->pluck('id')->values();
                    $ordered = $ordered->filter(fn ($id) => $exists->contains($id))->values();
                    foreach ($ordered as $i => $pid) {
                        RoomPhoto::query()->where('id', $pid)->update(['ordering' => $i]);
                    }
                }

                if (!empty($data['cover_id'])) {
                    $coverId = (int) $data['cover_id'];
                    $exists  = RoomPhoto::query()->where('room_id', $room->id)->where('id', $coverId)->exists();
                    if ($exists) {
                        RoomPhoto::query()->where('room_id', $room->id)->update(['is_cover' => false]);
                        RoomPhoto::query()->where('id', $coverId)->update(['is_cover' => true]);
                    }
                }
            });

            $this->logEvent(
                event: 'room_photo_batch_updated',
                causer: request()->user(),
                subject: $room,
                properties: [
                    'room_id'     => (string) $room->id,
                    'deleted_ids' => collect($data['deleted_ids'] ?? [])->map(fn ($v) => (int) $v)->values()->all(),
                    'ordered_ids' => collect($data['ordered_ids'] ?? [])->map(fn ($v) => (int) $v)->values()->all(),
                    'cover_id'    => isset($data['cover_id']) ? (int) $data['cover_id'] : null,
                ],
                logName: 'room',
            );

            return back()->with('success', __('management/rooms.photos.batch.saved'));
        } catch (\Throwable $e) {
            return back()->with('error', __('management/rooms.photos.batch.failed'));
        }
    }
}
