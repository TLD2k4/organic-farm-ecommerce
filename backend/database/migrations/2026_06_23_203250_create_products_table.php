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
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('farm_id')
                ->constrained('farms')
                ->restrictOnDelete();

            $table->foreignId('category_id')
                ->constrained('categories')
                ->restrictOnDelete();

            $table->string('name', 150);
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            $table->decimal('price', 10, 2)->check('price >= 0');
            $table->decimal('sale_price', 10, 2)->nullable()->check('sale_price >= 0');

            $table->decimal('stock_quantity', 10, 2)->default(0)->check('stock_quantity >= 0');
            $table->string('unit', 20);
            $table->string('thumbnail');
            $table->boolean('is_hot')->default(false);

            // 0 = Chờ duyệt (Pending) 1 = Đang bán (Active)
            // 2 = Bị từ chối (Rejected) 3 = Tạm ẩn (Hidden)
            $table->tinyInteger('status')->default(0)->check('status in (0,1,2,3)');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
