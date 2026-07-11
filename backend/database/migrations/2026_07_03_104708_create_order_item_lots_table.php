<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_item_lots', function (Blueprint $table) {

            $table->id();

            $table->foreignId('order_item_id')
                ->constrained('order_items')
                ->cascadeOnDelete();

            $table->foreignId('harvest_lot_id')
                ->constrained('harvest_lots')
                ->restrictOnDelete();

            // số lượng lấy từ lô này
            $table->decimal('quantity', 10, 2);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_lots');
    }
};