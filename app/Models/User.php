<?php

namespace App\Models;

use App\Enum\Gender;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasAvatar;
use App\Models\Concerns\HasDocument;
use App\Models\Concerns\HasRoles;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

/**
 * @property array<int, string>|null $two_factor_recovery_codes
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Session> $sessions
 * @property-read Session|null $latestSession
 * @property-read \Illuminate\Database\Eloquent\Collection<int, UserAddress> $addresses
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EmergencyContact> $emergencyContacts
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Contract> $contracts
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Invoice> $invoices
 * @property-read UserDocument|null $document
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Spatie\Permission\Models\Role> $roles
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    use Notifiable;
    use HasAudit;
    use HasRoles;
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
        'force_password_change',
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

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function latestSession(): HasOne
    {
        return $this->hasOne(Session::class)
            ->latestOfMany('last_activity')
            ->select(['sessions.id', 'sessions.user_id', 'sessions.last_activity']);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(UserAddress::class);
    }

    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmergencyContact::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'user_id');
    }

    public function invoices(): HasManyThrough
    {
        return $this->hasManyThrough(
            Invoice::class,
            Contract::class,
            'user_id',      // Foreign key on contracts...
            'contract_id',  // Foreign key on invoices...
            'id',           // Local key on users...
            'id',            // Local key on contracts...
        );
    }

    // Payments: traverse via invoices() -> payments() when needed.

    public static function generateUniqueUsername(string $name = ''): string
    {
        $base = Str::slug($name, '');
        $base = substr($base, 0, 20);
        if ($base === '') {
            $base = strtolower(Str::random(6));
        }

        for ($i = 0; $i < 10; $i++) {
            $suffix    = strtolower(Str::random(4));
            $candidate = substr($base . $suffix, 0, 30);
            if (!User::where('username', $candidate)->exists()) {
                return $candidate;
            }
        }

        do {
            $username = strtolower(Str::random(8));
        } while (User::where('username', $username)->exists());

        return $username;
    }
}
