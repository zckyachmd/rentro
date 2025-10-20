<?php

use App\Http\Controllers\WifiDogController;
use App\Models\WifiSession;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// WifiDog
Route::prefix('wifi')->name('wifi.')->group(function () {
    Route::middleware('trusted.gateway')->group(function () {
        Route::get('/ping', [WifiDogController::class, 'ping']);
        Route::match(['get', 'post'], '/auth', [WifiDogController::class, 'auth'])
            ->withoutMiddleware([VerifyCsrfToken::class]);
    });

    Route::get('/login', [WifiDogController::class, 'login'])->name('login');
    Route::post('/login', [WifiDogController::class, 'login'])->name('login.submit');

    Route::get('/portal', [WifiDogController::class, 'portal'])
        ->middleware('portal.access')
        ->name('portal');
    Route::post('/logout', [WifiDogController::class, 'logout'])->name('logout');
});

// Captive portal well-known endpoint
Route::get('/.well-known/captive-portal/capport-venue.json', function (Request $r) {
    $active = WifiSession::where('ip', $r->ip())
        ->where('status', 'auth')
        ->exists();

    return response()->json([
        'captive'            => !$active,
        'user-portal-url'    => route('wifi.portal'),
        'can-extend-session' => true,
    ]);
})->name('capport.venue');
