<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('contracts:mark-overdue')
    ->name('contracts.mark-overdue')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('contracts:cancel-overdue')
    ->name('contracts.cancel-overdue')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
