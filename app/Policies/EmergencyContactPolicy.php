<?php

namespace App\Policies;

use App\Models\EmergencyContact;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EmergencyContactPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // any authenticated user may view their list via controller scoping
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, EmergencyContact $contact): bool
    {
        return $contact->user_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     * Limit: max 3 contacts per user.
     */
    public function create(User $user): bool
    {
        return $user->emergencyContacts()->count() < 3;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, EmergencyContact $contact): bool
    {
        return $contact->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, EmergencyContact $contact): bool
    {
        return $contact->user_id === $user->id;
    }
}
