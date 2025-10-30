<?php

namespace App\Services\Contracts;

interface NotificationServiceInterface
{
    /**
     * Send a personal notification to a user and broadcast it on their private channel.
     *
     * @param array<string, mixed>|string $title
     * @param array<string, mixed>|string $message
     */
    public function notifyUser(int $userId, $title, $message, ?string $actionUrl = null, ?array $meta = null): void;

    /**
     * Announce to a role, optionally persisting per user via queued fan-out.
     *
     * @param array<string, mixed>|string $title
     * @param array<string, mixed>|string $message
     */
    public function announceRole(int $roleId, $title, $message, ?string $actionUrl = null, bool $persistPerUser = false): void;

    /**
     * Announce to all users, optionally persisting per user via queued fan-out.
     *
     * @param array<string, mixed>|string $title
     * @param array<string, mixed>|string $message
     */
    public function announceGlobal($title, $message, ?string $actionUrl = null, bool $persistPerUser = false): void;

    /**
     * Broadcast a system-wide notification over the private 'system' channel.
     * Optionally persist per user via queued fan-out.
     *
     * @param array<string, mixed>|string $title
     * @param array<string, mixed>|string $message
     */
    public function system($title, $message, ?string $actionUrl = null, ?bool $persistPerUser = null, ?array $meta = null): void;
}
