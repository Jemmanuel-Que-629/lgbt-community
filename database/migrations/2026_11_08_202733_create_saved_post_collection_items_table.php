<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_post_collection_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('saved_post_id')
                ->constrained('saved_posts')
                ->cascadeOnDelete();

            $table->foreignId('collection_id')
                ->constrained('saved_post_collections')
                ->cascadeOnDelete();

            $table->timestamps();

            // Prevent assigning the same saved post to a collection twice.
            $table->unique(
                ['collection_id', 'saved_post_id'],
                'saved_post_collection_items_unique'
            );

            $table->index('saved_post_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_post_collection_items');
    }
};
