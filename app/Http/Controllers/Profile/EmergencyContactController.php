<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\EmergencyContactRequest;
use App\Models\EmergencyContact;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;

class EmergencyContactController extends Controller
{
    use LogActivity;

    public function store(EmergencyContactRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->emergencyContacts()->create($request->validated());

        return back()->with('success', __('tenant/contacts.added'));
    }

    public function update(EmergencyContactRequest $request, EmergencyContact $contact): RedirectResponse
    {
        $contact->update($request->validated());

        return back()->with('success', __('tenant/contacts.updated'));
    }

    public function destroy(EmergencyContact $contact): RedirectResponse
    {
        $contact->delete();

        return back()->with('success', __('tenant/contacts.deleted'));
    }
}
