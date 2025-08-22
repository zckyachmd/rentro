<?php

namespace App\Models;

use App\Enum\Gender;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasAvatar;
use App\Models\Concerns\HasDocument;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    use Notifiable;
    use HasAudit;
    use HasAvatar;
    use HasDocument;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'password_changed_at',
        'phone',
        'dob',
        'gender',
        'avatar_path',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'         => 'datetime',
            'password'                  => 'hashed',
            'two_factor_secret'         => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at'   => 'datetime',
            'dob'                       => 'date',
            'gender'                    => Gender::class,
            'preferences'               => 'array',
        ];
    }

    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(UserAddress::class);
    }

    public function document(): HasOne
    {
        return $this->hasOne(UserDocument::class);
    }

    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmergencyContact::class);
    }
}
