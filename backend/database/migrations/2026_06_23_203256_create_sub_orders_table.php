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
        Schema::create('sub_orders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->foreignId('farm_id')
                ->constrained('farms')
                ->restrictOnDelete();

            $table->string('sub_order_code', 15)->unique();

            $table->decimal('items_total', 10, 2)->default(0)->check('items_total >= 0');
            $table->decimal('shipping_fee', 10, 2)->default(0)->check('shipping_fee >= 0');
            $table->decimal('total', 10, 2)->default(0)->check('total >= 0');

            // 0 = Chờ xử lý (Pending) 
            // 1 = Chuẩn bị hàng (Preparing) 
            // 2 = Đang giao (Shipping)
            // 3 = Completed (Hoàn tất) 
            // 4 = Đã hủy (Cancelled)
            $table->tinyInteger('status')->default(0)->check('status in (0,1,2,3,4)');

            // 0 = Chờ thanh toán (Pending) 
            // 1 = Đã thanh toán (Paid)
            // 2 = Thất bại (Failed)
            // 3 = Hoàn tiền (Refunded)
            $table->tinyInteger('payment_status')->default(0)->check('payment_status in (0,1,2,3)');
            $table->text('seller_note')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_orders');
    }
};
