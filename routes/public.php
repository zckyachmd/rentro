<?php

use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\NewsletterController;
use App\Http\Controllers\Public\PromotionsController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

// Public pages
Route::prefix('')->name('public.')->group(function (): void {
    Route::get('/catalog', [HomeController::class, 'catalog'])->name('catalog');
    Route::get('/promos', [PromotionsController::class, 'index'])->name('promos');
    Route::get('/promos/{slug}', [PromotionsController::class, 'show'])->name('promos.show');
    Route::get('/blog', [HomeController::class, 'blogIndex'])->name('blog.index');
    Route::get('/blog/{slug}', [HomeController::class, 'blogShow'])->name('blog.show');
    Route::get('/help', [HomeController::class, 'help'])->name('help');
    Route::get('/about', \App\Http\Controllers\Public\AboutController::class)->name('about');
    Route::get('/privacy', \App\Http\Controllers\Public\PrivacyController::class)->name('privacy');
    Route::get('/terms', [HomeController::class, 'terms'])->name('terms');
    Route::get('/contact', [HomeController::class, 'contact'])->name('contact');

    // Newsletter
    Route::post('/newsletter', [NewsletterController::class, 'subscribe'])
        ->middleware('throttle:ui-preferences')
        ->name('newsletter.subscribe');
});
