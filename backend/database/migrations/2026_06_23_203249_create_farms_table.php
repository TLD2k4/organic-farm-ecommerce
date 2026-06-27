<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('farms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->unique()->constrained('users')->restrictOnDelete();

            $table->string('name', 100)->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('phone', 11)->nullable();
            $table->text('address')->nullable();
            // 0 = Chờ duyệt (Pending) 1 = Đã duyệt / hoạt động (Approved / Active) 
            // 2 = Bị từ chối (Rejected) 3 = Bị khóa / tạm ngưng (Suspended / Inactive)
            $table->tinyInteger('status')->default(0)->check('status in (0,1,2,3)');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farms');
    }
};
