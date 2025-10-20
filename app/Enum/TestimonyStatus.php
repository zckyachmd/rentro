<?php

namespace App\Enum;

enum TestimonyStatus: string
{
    case PENDING   = 'pending';
    case APPROVED  = 'approved';
    case REJECTED  = 'rejected';
    case PUBLISHED = 'published';

    public function label(): string
    {
        return __('enum.testimony.status.' . strtolower($this->name));
    }
}
