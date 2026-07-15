<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farm_policy_acceptances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            /*
             * Giữ lịch sử chấp thuận ngay cả khi admin xóa vĩnh viễn farm.
             */
            $table->foreignId('farm_id')
                ->nullable()
                ->constrained('farms')
                ->nullOnDelete();

            $table->string('policy_version', 50);
            $table->timestamp('accepted_at');
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent', 1000)->nullable();

            $table->timestamps();

            $table->unique(
                ['user_id', 'farm_id', 'policy_version'],
                'farm_policy_acceptances_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farm_policy_acceptances');
    }
};
