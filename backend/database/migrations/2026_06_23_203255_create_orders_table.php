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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('address_id')
                ->constrained('addresses')
                ->restrictOnDelete();

            $table->string('order_code', 15)->unique();

            $table->string('shipping_name', 100);
            $table->string('shipping_phone', 11);
            $table->text('shipping_address');

            $table->decimal('shipping_fee', 10, 2)->default(0)->check('shipping_fee >= 0');
            $table->decimal('items_total', 10, 2)->default(0)->check('items_total >= 0');
            $table->decimal('grand_total', 10, 2)->default(0)->check('grand_total >= 0');

            // 0 = Chờ xử lý (Pending) 
            // 1 = Đang xử lý (Processing) 
            // 2 = Đang giao (Shipping)
            // 3 = Đã giao (Delivered) 
            // 4 = Đã hủy (Cancelled)
            $table->tinyInteger('status')->default(0)->check('status in (0,1,2,3,4)');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
