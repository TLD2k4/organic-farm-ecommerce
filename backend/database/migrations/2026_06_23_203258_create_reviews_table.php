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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('order_item_id')->nullable()->unique()->constrained('order_items')->cascadeOnDelete();
            // Mọi đánh giá hoặc bình luận đều phải thuộc về một sản phẩm.
            // Sản phẩm có lịch sử đánh giá chỉ được xóa mềm, không được xóa cứng.
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->tinyInteger('rating')->nullable()->check('rating between 1 and 5');
            $table->text('comment')->nullable();

            // 0 = Ẩn (Hidden) 
            // 1 = Hiển thị (Visible)
            $table->tinyInteger('status')->default(1)->check('status in (0,1)');
            $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->string('moderation_reason', 500)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
            $table->index(['rating', 'created_at']);
            $table->index(['product_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
