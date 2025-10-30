<?php

namespace App\Services\Contracts;

use App\Models\Contract;
use App\Models\RoomHandover;

interface HandoverServiceInterface
{
    /**
     * Buat handover check-in.
     *
     * @param array{notes?:string,items?:array<string,mixed>} $payload
     */
    public function checkin(Contract $contract, array $payload = []): RoomHandover;

    /**
     * Buat handover check-out.
     *
     * @param array{notes?:string,items?:array<string,mixed>} $payload
     */
    public function checkout(Contract $contract, array $payload = []): RoomHandover;
}
