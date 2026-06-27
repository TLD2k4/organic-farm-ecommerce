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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->unique()
                ->constrained('orders')
                ->restrictOnDelete();

            $table->string('transaction_code', 100)->unique();
            $table->string('payment_method', 50);
            $table->decimal('amount', 10, 2)->default(0)->check('amount >= 0');

            // 0 = Chờ thanh toán(Pending) 
            // 1 = Đã thanh toán (Paid)
            // 2 = Thất bại (Failed) 
            // 3 = Hoàn tiền (Refunded)
            $table->tinyInteger('status')->default(0)->check('status in (0,1,2,3)');
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
