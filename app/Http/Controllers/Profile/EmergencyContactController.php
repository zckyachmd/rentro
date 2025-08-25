<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\EmergencyContactRequest;
use App\Models\EmergencyContact;
use Illuminate\Http\RedirectResponse;

class EmergencyContactController extends Controller
{
    public function store(EmergencyContactRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->emergencyContacts()->create($request->validated());

        return back()->with('status', 'success');
    }

    public function update(EmergencyContactRequest $request, EmergencyContact $contact): RedirectResponse
    {
        $contact->update($request->validated());

        return back()->with('status', 'success');
    }

    public function destroy(EmergencyContact $contact): RedirectResponse
    {
        $contact->delete();

        return back()->with('status', 'success');
    }
}
