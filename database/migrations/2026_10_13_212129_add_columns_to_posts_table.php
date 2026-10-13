
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('community_id')
                ->constrained('communities')
                ->cascadeOnDelete();

            $table->string('title', 255);
            $table->longText('body')->nullable();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['community_id']);
            $table->dropIndex(['created_at']);

            $table->dropColumn([
                'user_id',
                'community_id',
                'title',
                'body',
            ]);
        });
    }
};
