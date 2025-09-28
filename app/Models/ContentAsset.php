<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ContentAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_type', 'owner_id', 'disk', 'path', 'collection', 'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function url(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}
