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
    Schema::create('cart_items', function (Blueprint $table) {
        $table->id();

        $table->foreignId('cart_id')
            ->constrained('carts')
            ->cascadeOnDelete();

        $table->foreignId('product_id')
            ->constrained('products')
            ->cascadeOnDelete();

        $table->decimal('quantity', 10, 2)->default(1)->check('quantity > 0');

        $table->timestamps();

        $table->unique(['cart_id', 'product_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('cart_items');
}
};
