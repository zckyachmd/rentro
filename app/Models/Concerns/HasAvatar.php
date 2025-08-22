<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin \App\Models\User
 */
trait HasAvatar
{
    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!empty($this->avatar_path)) {
                    return Storage::url($this->avatar_path);
                }
                $name = $this->first_name ?: ($this->name ?? 'User');

                return 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=EEE&color=111';
            },
        );
    }

    public function updateAvatar(UploadedFile $file): void
    {
        $ext      = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $dir      = 'avatars/' . $this->getKey();
        $filename = 'avatar_' . now()->format('Ymd_His') . '.' . $ext;
        $path     = $file->storeAs($dir, $filename, ['disk' => 'public']);

        if (!empty($this->avatar_path) && Storage::exists($this->avatar_path)) {
            Storage::delete($this->avatar_path);
        }

        $this->avatar_path = $path;
        $this->save();
    }
}
