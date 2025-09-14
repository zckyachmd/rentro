<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('contracts:mark-overdue')
    ->name('contracts.mark-overdue')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('contracts:cancel-overdue')
    ->name('contracts.cancel-overdue')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('payments:midtrans-sync')
    ->name('payments.midtrans-sync')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();
