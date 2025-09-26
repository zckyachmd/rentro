<?php

namespace App\Http\Controllers\Profile;

use App\Enum\AddressLabel;
use App\Enum\DocumentStatus;
use App\Enum\DocumentType;
use App\Enum\EmergencyRelationship;
use App\Enum\Gender;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\DeleteAccountRequest;
use App\Http\Requests\Profile\ProfileUpdateRequest;
use App\Models\AppSetting;
use App\Models\UserAddress;
use App\Traits\LogActivity;
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
    public function index(Request $request): Response
    {
        $user = $request->user()->load([
            'addresses' => fn ($q) => $q->orderBy('id'),
            'document',
            'emergencyContacts' => fn ($q) => $q->orderBy('id'),
        ]);

        $doc           = $user->document;
        $hasAttachment = $doc && method_exists($doc, 'getAttachments') && !empty($doc->getAttachments('private'));
        $docDto        = $doc ? [
            'id'          => $doc->id,
            'type'        => $doc->type,
            'number'      => $doc->number,
            'issued_at'   => $doc->issued_at,
            'expires_at'  => $doc->expires_at,
            'status'      => $doc->status,
            'verified_at' => $doc->verified_at,
            'has_file'    => $hasAttachment,
        ] : null;

        return Inertia::render('profile/index', [
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
            'document' => $docDto,
            'contacts' => $user->emergencyContacts->map->only([
                'id',
                'name',
                'relationship',
                'phone',
                'email',
                'address_line',
                'is_primary',
            ]),
            'mustVerifyEmail' => is_null($user->email_verified_at),
            'options'         => [
                'documentTypes'              => DocumentType::values(),
                'documentStatuses'           => DocumentStatus::values(),
                'emergencyRelationshipLabel' => EmergencyRelationship::values(),
                'emergencyContactsMax'       => (int) AppSetting::config('profile.emergency_contacts_max', 3),
            ],
        ]);
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->load(['addresses' => fn ($q) => $q->orderBy('id')]);

        $address = $user->addresses->first();

        $doc           = $user->document;
        $hasAttachment = $doc && method_exists($doc, 'getAttachments') && !empty($doc->getAttachments('private'));
        $docDto        = $doc ? [
            'id'          => $doc->id,
            'type'        => $doc->type,
            'number'      => $doc->number,
            'issued_at'   => $doc->issued_at,
            'expires_at'  => $doc->expires_at,
            'status'      => $doc->status,
            'verified_at' => $doc->verified_at,
            'has_file'    => $hasAttachment,
        ] : null;

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
            'document'        => $docDto,
            'mustVerifyEmail' => is_null($user->email_verified_at),
            'options'         => [
                'genders'          => Gender::values(),
                'documentTypes'    => DocumentType::values(),
                'documentStatuses' => DocumentStatus::values(),
                'addressLabels'    => AddressLabel::values(),
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user      = $request->user();
        $validated = $request->validated();

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
        }

        $user->save();

        if ($request->hasFile('avatar')) {
            $user->updateAvatar($request->file('avatar'));
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

            $doc     = $user->document()->first();
            $created = false;
            if (!$doc) {
                $doc = new \App\Models\UserDocument();
                $doc->user()->associate($user);
                $doc->fill([
                    'type'       => $docInput['type'] ?? null,
                    'number'     => $docInput['number'] ?? null,
                    'issued_at'  => $docInput['issued_at'] ?? null,
                    'expires_at' => $docInput['expires_at'] ?? null,
                    'status'     => 'pending',
                ]);
                $doc->save();
                $created = true;
            } else {
                $doc->fill([
                    'type'       => $docInput['type'] ?? null,
                    'number'     => $docInput['number'] ?? null,
                    'issued_at'  => $docInput['issued_at'] ?? null,
                    'expires_at' => $docInput['expires_at'] ?? null,
                ]);
            }
            /** @var \App\Models\UserDocument $doc */

            $dirtyKeys = array_keys($doc->getDirty());

            $file = $docInput['file'] ?? null;
            if ($file && method_exists($doc, 'storeAttachmentFiles')) {
                $doc->forceFill(['attachments' => []])->save();
                $doc->storeAttachmentFiles([$file], 'private', 1);
                $dirtyKeys = array_unique(array_merge($dirtyKeys, ['attachments']));
            }

            if (!empty(array_intersect($dirtyKeys, ['type', 'number', 'issued_at', 'expires_at', 'attachments']))) {
                $doc->status      = 'pending';
                $doc->verified_at = null;
            }

            if ($doc->isDirty()) {
                $doc->save();
            }
        }

        return Redirect::route('profile.edit')->with('success', __('tenant/profile.updated'));
    }

    /**
     * Delete the user's account.
     */
    public function destroy(DeleteAccountRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
