
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('post_media', function (Blueprint $table) {
            $table->foreignId('post_id')
                ->constrained('posts')
                ->cascadeOnDelete();

            $table->enum('type', ['image', 'video', 'gif']);
            $table->string('path');
            $table->string('original_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('post_media', function (Blueprint $table) {
            $table->dropForeign(['post_id']);

            $table->dropColumn([
                'post_id',
                'type',
                'path',
                'original_name',
                'mime_type',
                'size',
            ]);
        });
    }
};
