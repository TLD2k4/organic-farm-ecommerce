<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Database\Seeder;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        for ($userId = 1; $userId <= 16; $userId++) {
            $user = User::find($userId);

            if (!$user) {
                continue;
            }

            // Cart được tạo sau khi user đăng ký vài phút
            $cartDate = $user->created_at->copy()->addMinutes(10);

            Cart::create([
                'user_id' => $userId,
                'created_at' => $cartDate,
                'updated_at' => $cartDate,
            ]);
        }
    }
}