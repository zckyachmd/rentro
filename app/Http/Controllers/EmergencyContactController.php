<?php

namespace App\Http\Controllers;

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
        $this->authorize('update', $contact);

        $contact->update($request->validated());

        return back()->with('status', 'success');
    }

    public function destroy(EmergencyContact $contact): RedirectResponse
    {
        $this->authorize('delete', $contact);

        $contact->delete();

        return back()->with('status', 'success');
    }
}
