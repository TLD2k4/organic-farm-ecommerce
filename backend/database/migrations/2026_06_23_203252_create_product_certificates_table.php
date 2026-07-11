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
    Schema::create('product_certificates', function (Blueprint $table) {
        $table->id();

        $table->foreignId('product_id')
            ->constrained('products')
            ->cascadeOnDelete();

        $table->foreignId('certification_id')
            ->constrained('certifications')
            ->restrictOnDelete();

        $table->string('certificate_number', 100)->unique();
        $table->string('certificate_file');

        $table->date('issued_date');
        $table->date('expiry_date');

        // 0 = Chờ duyệt
        // 1 = Đã duyệt
        // 2 = Từ chối
        // 3 = Hết hạn
        // 4 = Thay thế
        $table->tinyInteger('status')->default(0)->check('status in (0,1,2,3,4)');

        $table->foreignId('approved_by')
            ->nullable()
            ->constrained('users')
            ->nullOnDelete();

        $table->timestamp('approved_at')->nullable();
        $table->text('rejection_reason')->nullable();

        $table->timestamps();
        $table->softDeletes();
    });
}

public function down(): void
{
    Schema::dropIfExists('product_certificates');
}
};
