<?php

namespace App\Models\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait HasAttachments
{
    protected function attachmentAttribute(): string
    {
        return 'attachments';
    }

    protected function defaultAttachmentBucket(): string
    {
        return 'public';
    }

    protected function normalizeBucketName(?string $bucket): string
    {
        $bucket = $bucket ? strtolower(trim($bucket)) : $this->defaultAttachmentBucket();
        if ($bucket === 'general') {
            $bucket = 'public';
        }
        if (!in_array($bucket, ['public', 'private'], true)) {
            $bucket = 'public';
        }

        return $bucket;
    }

    protected function attachmentDisk(string $bucket = 'public'): string
    {
        $bucket = $this->normalizeBucketName($bucket);
        $disks  = config('filesystems.disks', []);

        // Map bucket 'private' ke disk 'local' (atau 'private' jika tersedia), agar hanya ada 2 disk: local & public
        if ($bucket === 'private') {
            if (array_key_exists('local', $disks)) {
                return 'local';
            }
            if (array_key_exists('private', $disks)) {
                return 'private';
            }
        }

        if (array_key_exists('public', $disks)) {
            return 'public';
        }

        return config('filesystems.default', 'public');
    }

    protected function attachmentVisibility(string $bucket = 'public'): ?string
    {
        $bucket = $this->normalizeBucketName($bucket);

        return $bucket === 'public' ? 'public' : 'private';
    }

    protected function attachmentBaseFolder(): string
    {
        $table = trim($this->getTable(), '/');
        $key   = $this->getKey();

        return trim($table . '/' . ($key ?: 'pending'), '/');
    }

    protected function attachmentBasePath(string $bucket = 'public'): string
    {
        $bucket = $this->normalizeBucketName($bucket);
        $folder = trim($this->attachmentBaseFolder(), '/');

        return trim(($folder !== '' ? $folder . '/' : '') . $bucket, '/');
    }

    protected function normalizeAttachmentPath(string $value, string $base): string
    {
        $clean = trim($value);
        if ($clean === '') {
            return $clean;
        }

        $clean = str_replace(['..', '\\'], '', $clean);
        $clean = ltrim($clean, '/');
        $base  = trim($base, '/');

        foreach ($this->legacyBasePaths($base) as $legacy) {
            $legacy = trim($legacy, '/');
            if ($legacy !== '' && (Str::startsWith($clean, $legacy . '/') || $clean === $legacy)) {
                $clean = $base . '/' . ltrim(Str::after($clean, $legacy . '/'), '/');
                break;
            }
        }

        if ($base !== '' && !Str::startsWith($clean, $base . '/')) {
            $clean = $base . '/' . $clean;
        }

        return $clean;
    }

    protected function legacyBasePaths(string $base): array
    {
        $paths = [];

        if (Str::endsWith($base, '/public')) {
            $paths[] = Str::replaceLast('/public', '/general', $base);
        }

        return $paths;
    }

    protected function normalizeAttachmentList(?array $attachments, string $base): array
    {
        $base = trim($base, '/');

        return collect($attachments ?? [])
            ->filter(fn ($att) => is_string($att) && trim($att) !== '')
            ->map(fn ($att) => $this->normalizeAttachmentPath($att, $base))
            ->unique()
            ->values()
            ->all();
    }

    protected function appendNormalizedAttachment(array $current, string $path, string $base): array
    {
        $relative = $this->normalizeAttachmentPath($path, $base);

        if (!in_array($relative, $current, true)) {
            $current[] = $relative;
        }

        return $current;
    }

    protected function isAssociativeArray(array $value): bool
    {
        return array_keys($value) !== range(0, count($value) - 1);
    }

    protected function prepareAttachmentMap(): array
    {
        $raw = $this->getAttribute($this->attachmentAttribute());

        if (!is_array($raw) || empty($raw)) {
            return [];
        }

        if ($this->isAssociativeArray($raw)) {
            $map = [];
            foreach ($raw as $bucket => $items) {
                $normalizedBucket       = $this->normalizeBucketName($bucket);
                $map[$normalizedBucket] = $this->normalizeAttachmentList((array) $items, $this->attachmentBasePath($normalizedBucket));
            }

            return $map;
        }

        $bucket = $this->defaultAttachmentBucket();

        return [
            $bucket => $this->normalizeAttachmentList($raw, $this->attachmentBasePath($bucket)),
        ];
    }

    protected function collapseAttachmentMap(array $map): array
    {
        $normalized = [];
        foreach ($map as $bucket => $items) {
            $list = $this->normalizeAttachmentList((array) $items, $this->attachmentBasePath($bucket));
            if (!empty($list)) {
                $normalized[$bucket] = $list;
            }
        }

        $defaultBucket = $this->defaultAttachmentBucket();
        if (count($normalized) === 1 && array_key_exists($defaultBucket, $normalized)) {
            return array_values($normalized[$defaultBucket]);
        }

        return $normalized;
    }

    protected function persistAttachmentMap(array $map): void
    {
        $this->forceFill([
            $this->attachmentAttribute() => $this->collapseAttachmentMap($map),
        ])->save();
    }

    public function getAttachments(string $bucket = null): array
    {
        $bucket = $this->normalizeBucketName($bucket);
        $map    = $this->prepareAttachmentMap();

        return $map[$bucket] ?? [];
    }

    public function resolveAttachmentPath(string $path, string $bucket = null): string
    {
        $bucket = $this->normalizeBucketName($bucket);
        $path   = trim($path);
        if ($path === '') {
            return '';
        }

        return $this->normalizeAttachmentPath($path, $this->attachmentBasePath($bucket));
    }

    public function attachmentDiskName(string $bucket = null): string
    {
        $bucket = $this->normalizeBucketName($bucket);

        return $this->attachmentDisk($bucket);
    }

    public function storeAttachmentFiles(iterable $files, string $bucket = null, ?int $limit = null): void
    {
        $bucket  = $this->normalizeBucketName($bucket);
        $map     = $this->prepareAttachmentMap();
        $current = $map[$bucket] ?? [];

        if ($limit !== null) {
            $limit = max(0, $limit);
        }

        $disk       = $this->attachmentDisk($bucket);
        $visibility = $this->attachmentVisibility($bucket);
        $basePath   = $this->attachmentBasePath($bucket);

        try {
            Storage::disk($disk)->makeDirectory($basePath);
        } catch (\Throwable) {
            // Abaikan jika driver sudah membuat otomatis
        }

        foreach ($files as $file) {
            if (!($file instanceof UploadedFile) || !$file->isValid()) {
                continue;
            }
            if ($limit !== null && count($current) >= $limit) {
                break;
            }

            $storedPath = $visibility
                ? Storage::disk($disk)->putFile($basePath, $file, $visibility)
                : Storage::disk($disk)->putFile($basePath, $file);
            if (!$storedPath) {
                continue;
            }

            $current = $this->appendNormalizedAttachment($current, $storedPath, $basePath);
        }

        $map[$bucket] = $current;
        $this->persistAttachmentMap($map);
    }
}
