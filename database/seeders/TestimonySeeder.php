<?php

namespace Database\Seeders;

use App\Enum\RoleName;
use App\Enum\TestimonyStatus;
use App\Models\Testimony;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class TestimonySeeder extends Seeder
{
    public function run(): void
    {
        $count   = random_int(4, 7);
        $tenants = User::role(RoleName::TENANT->value)->inRandomOrder()->limit($count)->get();
        if ($tenants->count() < $count) {
            $alt = User::query()->inRandomOrder()->limit($count - $tenants->count())->get();
            $tenants = $tenants->merge($alt);
        }

        $occupations = [
            'Mahasiswa',
            'Karyawan',
            'Freelancer',
            'Perawat',
            'Desainer',
            'Programmer',
            'Akuntan',
            'Content Creator',
        ];

        foreach ($tenants->take($count)->values() as $i => $u) {
            $isAnon     = $i === 0 ? true : (bool) random_int(0, 4) === 0;
            $occupation = (bool) random_int(0, 9) ? Arr::random($occupations) : null;

            /** @var Testimony $t */
            $t = Testimony::factory()->make([
                'user_id'       => $u->id,
                'status'        => TestimonyStatus::PUBLISHED,
                'is_anonymous'  => $isAnon,
                'occupation'    => $occupation,
            ]);

            $t->published_at = $t->published_at ?: now()->subDays(random_int(0, 730));
            $t->save();
        }
    }
}
