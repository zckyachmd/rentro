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

Schedule::command('contracts:activate-due')
    ->name('contracts.activate-due')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('invoices:generate-monthly')
    ->name('invoices.generate-monthly')
    ->dailyAt('00:30')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('payments:midtrans-sync')
    ->name('payments.midtrans-sync')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('contracts:complete-ended')
    ->name('contracts.complete-ended')
    ->dailyAt('01:00')
    ->withoutOverlapping()
    ->runInBackground();
