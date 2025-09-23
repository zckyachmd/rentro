<?php

namespace App\Enum;

enum PaymentStatus: string
{
    case REVIEW    = 'review';
    case PENDING   = 'pending';
    case COMPLETED = 'completed';
    case FAILED    = 'failed';
    case REJECTED  = 'rejected';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return __('enum.payment.status.' . strtolower($this->name));
    }
}
