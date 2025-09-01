<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function (): void {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule contract status refresh (Laravel 12 route-based scheduler)
Schedule::command('contracts:refresh-status')->dailyAt('00:30');
