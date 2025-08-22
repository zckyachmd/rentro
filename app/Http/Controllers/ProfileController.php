<?php

namespace App\Http\Controllers;

use App\Http\Requests\Profile\ProfileUpdateRequest;
use App\Models\UserAddress;
use App\Traits\LogActivity;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    use LogActivity;

    /**
     * Display the user's profile (read-only view).
     */
    public function show(Request $request): Response
    {
        $user = $request->user()->load([
            'addresses' => fn ($q) => $q->orderBy('id'),
            'document',
            'emergencyContacts' => fn ($q) => $q->orderBy('id'),
        ]);

        return Inertia::render('profile/show', [
            'user' => $user->append('avatar_url')->only([
                'id',
                'name',
                'username',
                'email',
                'phone',
                'gender',
                'dob',
                'avatar_url',
                'created_at',
                'email_verified_at',
            ]),
            'addresses' => $user->addresses->map->only([
                'id',
                'label',
                'address_line',
                'village',
                'district',
                'city',
                'province',
                'postal_code',
                'country',
                'is_primary',
            ]),
            'document' => $user->getDocumentForFrontend(),
            'contacts' => $user->emergencyContacts->map->only([
                'id',
                'name',
                'relationship',
                'phone',
                'email',
                'address_line',
                'is_primary',
            ]),
            'mustVerifyEmail' => $user instanceof MustVerifyEmail && is_null($user->email_verified_at),
            'status'          => session('status'),
        ]);
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user    = $request->user()->load(['addresses' => fn ($q) => $q->orderBy('id')]);
        $address = $user->addresses->first();

        return Inertia::render('profile/edit', [
            'user' => [
                'id'         => $user->id,
                'name'       => $user->name,
                'username'   => $user->username,
                'email'      => $user->email,
                'phone'      => $user->phone,
                'dob'        => optional($user->dob)?->toDateString(),
                'gender'     => $user->gender,
                'avatar_url' => $user->avatar_url,
            ],
            'address' => $address ? [
                'id'           => $address->id,
                'label'        => $address->label,
                'address_line' => $address->address_line,
                'village'      => $address->village,
                'district'     => $address->district,
                'city'         => $address->city,
                'province'     => $address->province,
                'postal_code'  => $address->postal_code,
            ] : null,
            'document'        => $user->getDocumentForFrontend(),
            'mustVerifyEmail' => is_null($user->email_verified_at),
            'status'          => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user      = $request->user();
        $validated = $request->validated();

        $originalEmail = $user->getOriginal('email');

        $user->fill(array_intersect_key($validated, array_flip([
            'name',
            'username',
            'email',
            'phone',
            'dob',
            'gender',
        ])));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;

            $this->logEvent(
                event: 'profile.email_changed',
                subject: $user,
                properties: [
                    'old' => $originalEmail,
                    'new' => $user->email,
                ],
                logName: 'profile',
            );
        }

        $user->save();

        if ($request->hasFile('avatar')) {
            $user->updateAvatar($request->file('avatar'));

            $this->logEvent(
                event: 'profile.avatar_updated',
                subject: $user,
                logName: 'profile',
            );
        }

        if (isset($validated['address']) && is_array($validated['address'])) {
            $addr = array_map(
                fn ($v) => is_string($v) ? trim($v) : $v,
                $validated['address'],
            );

            UserAddress::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'label'        => $addr['label'] ?? '',
                    'address_line' => $addr['address_line'] ?? '',
                    'village'      => $addr['village'] ?? '',
                    'district'     => $addr['district'] ?? '',
                    'city'         => $addr['city'] ?? '',
                    'province'     => $addr['province'] ?? '',
                    'postal_code'  => $addr['postal_code'] ?? '',
                ],
            );
        }

        if (isset($validated['document']) && is_array($validated['document'])) {
            $docInput = array_map(
                static fn ($v) => is_string($v) ? (trim($v) === '' ? null : trim($v)) : $v,
                $validated['document'],
            );

            $attributes = [
                'type'       => $docInput['type'] ?? null,
                'number'     => $docInput['number'] ?? null,
                'issued_at'  => $docInput['issued_at'] ?? null,
                'expires_at' => $docInput['expires_at'] ?? null,
            ];

            ['document' => $doc, 'changed' => $changed, 'created' => $created] = $user->syncDocument($attributes, $docInput['file'], 'public', 'documents');

            if ($created) {
                $this->logEvent(
                    event: 'profile.document_created',
                    subject: $doc,
                    logName: 'profile',
                );
            } elseif (!empty($changed)) {
                $this->logEvent(
                    event: 'profile.document_updated',
                    subject: $doc,
                    properties: compact('changed'),
                    logName: 'profile',
                );
            }
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $this->logEvent(
            event: 'account.deleted',
            causer: $user,
            subject: $user,
            logName: 'account',
        );

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
