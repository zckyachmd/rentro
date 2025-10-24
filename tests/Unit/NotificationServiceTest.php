<?php

use App\Jobs\SendUserNotification;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Bus;

uses(Tests\TestCase::class);

it('dispatches job for personal notify', function () {
    Bus::fake();

    $svc = app(NotificationService::class);
    $svc->notifyUser(123, 'Hello', 'World', 'https://example.com', ['k' => 'v']);

    Bus::assertDispatched(SendUserNotification::class, function ($job) {
        return $job->userId === 123 && ($job->payload['title'] ?? null) === 'Hello';
    });
});
