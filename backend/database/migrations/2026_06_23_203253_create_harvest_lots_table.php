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
        Schema::create('harvest_lots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_certificate_id')
                ->constrained('product_certificates')
                ->restrictOnDelete();

            $table->string('lot_code', 10)->unique();

            $table->date('harvest_date');
            $table->date('expiry_date');

            $table->decimal('quantity_imported', 10, 2)->default(1)->check('quantity_imported > 0');
            $table->decimal('quantity_sold', 10, 2)->default(0)->check('quantity_sold >= 0');
            $table->decimal('quantity_remaining', 10, 2)->default(0)->check('quantity_remaining >= 0');

            // 1 = Active (Đang bán) 
            // 2 = Hidden (Tạm ẩn bởi seller/admin)
            // 3 = Sold Out (Hết hàng) 
            // 4 = Expired (Hết hạn sử dụng)
            $table->tinyInteger('status')->default(1)->check('status in (1,2,3,4)');
            $table->text('note')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('harvest_lots');
    }
};
