<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained('reviews')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('comment');
            $table->tinyInteger('status')->default(1)->check('status in (0,1)');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['review_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_replies');
    }
};
