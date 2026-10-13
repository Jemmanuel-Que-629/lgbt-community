
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('communities', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('communities', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique(['slug']);
            $table->dropColumn([
                'user_id',
                'name',
                'slug',
                'description',
            ]);
        });
    }
};
