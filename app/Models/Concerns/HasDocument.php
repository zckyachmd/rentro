<?php

namespace App\Models\Concerns;

use App\Models\UserDocument;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait HasDocument
{
    /**
     * Relationship: get the user's document.
     */
    public function document(): HasOne
    {
        return $this->hasOne(UserDocument::class);
    }

    /**
     * Create or update the user's document with given attributes.
     */
    public function upsertDocument(array $attributes): UserDocument
    {
        return $this->document()->updateOrCreate([], $attributes);
    }

    /**
     * Sync user's document metadata and optional file replacement.
     *
     * @param array<string,mixed> $attributes
     * @param UploadedFile|null $file
     * @param string $disk
     * @param string $dir
     * @return array{document: UserDocument, changed: array<int,string>, created: bool}
     */
    public function syncDocument(array $attributes, ?UploadedFile $file = null, string $disk = 'public', string $dir = 'documents'): array
    {
        $doc     = $this->document;
        $created = false;

        if ($file) {
            if ($doc && $doc->file_path) {
                Storage::disk($disk)->delete($doc->file_path);
            }
            $attributes['file_path'] = $file->store($dir, $disk);
        }

        if ($doc) {
            $doc->fill($attributes);

            $changed = [];
            if ($doc->isDirty(['type', 'number', 'issued_at', 'expires_at', 'file_path'])) {
                $doc->status      = 'pending';
                $doc->verified_by = null;
                $doc->verified_at = null;
            }

            if ($doc->isDirty()) {
                $changed = array_keys($doc->getDirty());
                $doc->save();
            }

            return ['document' => $doc, 'changed' => $changed, 'created' => false];
        }

        $doc     = $this->upsertDocument($attributes + ['status' => 'pending']);
        $created = true;
        $changed = array_keys($attributes + ['status' => 'pending']);

        return ['document' => $doc, 'changed' => $changed, 'created' => $created];
    }

    /**
     * Get the user's document data formatted for frontend consumption, including file URL.
     *
     * @return array|null
     */
    public function getDocumentForFrontend(): ?array
    {
        $doc = $this->document;

        if (!$doc) {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return [
            'id'          => $doc->id,
            'type'        => $doc->type,
            'number'      => $doc->number,
            'issued_at'   => $doc->issued_at,
            'expires_at'  => $doc->expires_at,
            'status'      => $doc->status,
            'verified_by' => $doc->verified_by,
            'verified_at' => $doc->verified_at,
            'file_url'    => $doc->file_path ? $disk->url($doc->file_path) : null,
        ];
    }
}
