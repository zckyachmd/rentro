<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        return Inertia::render('public/home');
    }

    public function catalog()
    {
        return Inertia::render('public/catalog');
    }

    // moved promos to Site\PromotionsController

    public function blogIndex()
    {
        return Inertia::render('public/blog/index');
    }

    public function blogShow(string $slug)
    {
        return Inertia::render('public/blog/show', [
            'slug' => $slug,
        ]);
    }

    public function help()
    {
        return Inertia::render('public/help');
    }

    public function about()
    {
        return Inertia::render('public/about');
    }

    public function privacy()
    {
        return Inertia::render('public/privacy');
    }

    public function terms()
    {
        return Inertia::render('public/terms');
    }

    public function contact()
    {
        return Inertia::render('public/contact');
    }

    // moved promoShow to Site\PromotionsController
}
