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
    Schema::create('certifications', function (Blueprint $table) {
        $table->id();

        $table->string('name', 25)->unique();
        $table->text('description')->nullable();

        // 0 = Ẩn
        // 1 = Hiển thị
        $table->tinyInteger('status')->default(1)->check('status in (0,1)');

        $table->timestamps();
        $table->softDeletes();
    });
}

public function down(): void
{
    Schema::dropIfExists('certifications');
}
};
