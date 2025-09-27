<?php

namespace App\Enum;

enum TestimonyStatus: string
{
    case PENDING   = 'pending';
    case APPROVED  = 'approved';
    case REJECTED  = 'rejected';
    case PUBLISHED = 'published';
}
