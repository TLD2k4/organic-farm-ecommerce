<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_orders', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->index();
        });

        // Giữ được số liệu lịch sử cho những đơn đã hoàn thành trước migration.
        DB::table('sub_orders')
            ->where('status', 3)
            ->whereNull('completed_at')
            ->update([
                'completed_at' => DB::raw('updated_at'),
            ]);
    }

    public function down(): void
    {
        Schema::table('sub_orders', function (Blueprint $table) {
            $table->dropIndex(['completed_at']);
            $table->dropColumn('completed_at');
        });
    }
};
