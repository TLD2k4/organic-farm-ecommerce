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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();

            $table->string('name', 50)->unique();
            $table->string('slug', 100)->unique();
            $table->string('description')->nullable();
            $table->string('image')->nullable();
            // 0 = Ẩn (Hidden) 1 = Hiển thị (Visible)
            $table->tinyInteger('status')->default(1)->check('status in (0,1)');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
