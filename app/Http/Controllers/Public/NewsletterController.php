<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class NewsletterController extends Controller
{
    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc,dns'],
            'name'  => ['nullable', 'string', 'max:100'],
        ]);

        $existing = NewsletterSubscription::query()->where('email', $data['email'])->first();
        if ($existing) {
            // Already subscribed — respond OK to keep UX smooth
            return response()->json([
                'message' => 'You are already subscribed. Thank you!',
            ], Response::HTTP_OK);
        }

        NewsletterSubscription::create($data);

        return response()->json([
            'message' => 'Subscription successful. Please check your inbox.',
        ], Response::HTTP_CREATED);
    }
}
