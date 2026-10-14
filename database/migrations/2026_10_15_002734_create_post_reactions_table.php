
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_reactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('post_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('type', 20)->default('like');

            $table->timestamps();

            // One reaction per user for each post.
            $table->unique(
                ['user_id', 'post_id'],
                'post_reactions_user_post_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_reactions');
    }
};
