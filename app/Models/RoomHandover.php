<?php

namespace App\Models;

use App\Models\Concerns\HasAttachments;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read Contract|null $contract
 */
class RoomHandover extends Model
{
    use HasFactory;
    use HasAudit;
    use HasSnowflakeId;
    use HasAttachments;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'contract_id',
        'type',
        'status',
        'notes',
        'meta',
        'attachments',
    ];

    protected $casts = [
        'type'        => \App\Enum\RoomHandoverType::class,
        'status'      => \App\Enum\RoomHandoverStatus::class,
        'meta'        => 'array',
        'attachments' => 'array',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    protected function attachmentBaseFolder(): string
    {
        return 'handovers/' . ($this->getKey() ?: 'pending');
    }

    public function getAttachments(string $bucket = null): array
    {
        $map = $this->prepareAttachmentMap();

        if ($bucket !== null) {
            $bucket = $this->normalizeBucketName($bucket);

            return $map[$bucket] ?? [];
        }

        $public  = $map['public'] ?? [];
        $private = $map['private'] ?? [];

        return collect($public)->merge($private)->unique()->values()->all();
    }
}
