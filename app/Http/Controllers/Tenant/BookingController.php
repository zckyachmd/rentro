<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        // Placeholder: list bookings for current user (to be implemented)
        return Inertia::render('tenant/booking/index', [
            'bookings' => [
                'data' => [],
            ],
        ]);
    }
}
