<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_policies', function (Blueprint $table) {
            $table->id();
            $table->string('version', 50)->unique();
            $table->string('title', 200);
            $table->text('summary')->nullable();
            $table->longText('content');
            $table->tinyInteger('status')->default(0)->check('status in (0,1,2)');
            $table->boolean('requires_reacceptance')->default(true);
            $table->timestamp('effective_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->text('change_note')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'effective_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_policies');
    }
};
