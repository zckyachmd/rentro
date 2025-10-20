<?php

namespace Database\Seeders;

use Carbon\Carbon;
use App\Models\User;
use App\Enum\RoleName;
use App\Models\Testimony;
use App\Enum\TestimonyStatus;
use Illuminate\Database\Seeder;

class DemoTestimonySeeder extends Seeder
{
    public function run(): void
    {
        // Pick up to 5 users (prefer tenants); fallback to any users
        $users = User::role(RoleName::TENANT->value)->orderBy('id')->limit(5)->get();
        if ($users->isEmpty()) {
            $users = User::query()->orderBy('id')->limit(5)->get();
        }

        $samples = [
            ['text' => 'Tempatnya nyaman dan prosesnya cepat.', 'occupation' => 'Mahasiswa', 'anon' => true],
            ['text' => 'Admin responsif, pembayaran juga gampang.', 'occupation' => 'Karyawan', 'anon' => false],
            ['text' => 'Fasilitas sesuai deskripsi, recommended!', 'occupation' => 'Freelancer', 'anon' => false],
            ['text' => 'Lingkungan aman dan bersih.', 'occupation' => 'Perawat', 'anon' => false],
            ['text' => 'Harga transparan, tanpa biaya tersembunyi.', 'occupation' => 'Programmer', 'anon' => false],
        ];

        $base = Carbon::create(2025, 1, 1)->startOfDay();
        foreach ($users as $i => $u) {
            $s = $samples[$i] ?? $samples[0];
            Testimony::firstOrCreate(
                ['user_id' => $u->id, 'content_original' => $s['text']],
                [
                    'content_curated' => $s['text'],
                    'is_anonymous'    => (bool) $s['anon'],
                    'occupation'      => $s['occupation'],
                    'status'          => TestimonyStatus::PUBLISHED->value,
                    'published_at'    => $base->copy()->addDays($i * 3),
                ]
            );
        }
    }
}
