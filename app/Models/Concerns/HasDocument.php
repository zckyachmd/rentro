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
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<\App\Models\UserDocument>
     */
    public function document(): HasOne
    {
        return $this->hasOne(UserDocument::class);
    }

    /**
     * Create or update the user's document with given attributes.
     *
     * @return \App\Models\UserDocument
     */
    /**
     * Create or update the user's document with given attributes.
     *
     * @param array $attributes
     * @return \App\Models\UserDocument
     */
    public function upsertDocument(array $attributes): UserDocument
    {
        /** @var \App\Models\UserDocument $document */
        $document = $this->document()->updateOrCreate([], $attributes);

        return $document;
    }

    /**
     * Sync user's document metadata and optional file replacement.
     *
     * @param array<string,mixed> $attributes
     * @param UploadedFile|null $file
     * @param string $disk
     * @param string $dir
     * @return array{document: \App\Models\UserDocument, changed: list<string>, created: bool}
     */
    public function syncDocument(array $attributes, ?UploadedFile $file = null, string $disk = 'public', string $dir = 'documents'): array
    {
        /** @var \App\Models\UserDocument|null $doc */
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
    public function getDocument(): ?array
    {
        /** @var \App\Models\UserDocument|null $doc */
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
            'has_file'    => !empty($doc->file_path),
        ];
    }
}
