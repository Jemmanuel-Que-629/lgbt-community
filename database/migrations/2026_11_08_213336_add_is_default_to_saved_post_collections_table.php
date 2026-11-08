<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saved_post_collections', function (Blueprint $table) {
            $table->boolean('is_default')
                ->default(false)
                ->after('name');

            $table->index(
                ['user_id', 'is_default'],
                'saved_post_collections_user_default_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('saved_post_collections', function (Blueprint $table) {
            $table->dropIndex('saved_post_collections_user_default_index');
            $table->dropColumn('is_default');
        });
    }
};
