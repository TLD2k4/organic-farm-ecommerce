<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Database\Seeder;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        User::query()
            ->where('status', 1)
            ->orderBy('id')
            ->take(16)
            ->get()
            ->each(function (User $user) {
                Cart::firstOrCreate(['user_id' => $user->id]);
            });
    }
}
