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
    Schema::create('order_items', function (Blueprint $table) {
        $table->id();

        $table->foreignId('sub_order_id')
            ->constrained('sub_orders')
            ->cascadeOnDelete();

        $table->foreignId('product_id')
            ->constrained('products')
            ->restrictOnDelete();

        $table->string('product_name', 150);
        $table->string('product_image');
        $table->string('unit', 20);

        $table->decimal('quantity', 10, 2)->default(1)->check('quantity > 0');
        $table->decimal('price', 10, 2)->default(0)->check('price >= 0');
        $table->decimal('subtotal', 10, 2)->default(0)->check('subtotal >= 0');

        $table->timestamps();
    });

}

public function down(): void
{
    Schema::dropIfExists('order_items');
}
};
