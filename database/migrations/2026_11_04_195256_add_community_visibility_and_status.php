
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Update communities table
        |--------------------------------------------------------------------------
        */

        Schema::table('communities', function (Blueprint $table) {
            $table->string('visibility', 20)
                ->default('public')
                ->after('category');

            $table->string('status', 20)
                ->default('active')
                ->after('visibility');

            $table->string('normalized_name', 100)
                ->nullable()
                ->after('name');
        });

        // Normalize existing community names before adding uniqueness.
        DB::statement("
            UPDATE communities
            SET normalized_name = LOWER(TRIM(name))
        ");

        Schema::table('communities', function (Blueprint $table) {
            $table->unique(
                'normalized_name',
                'communities_normalized_name_unique'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Community join requests
        |--------------------------------------------------------------------------
        */

        Schema::create('community_join_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('community_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('status', 20)->default('pending');

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            // A user can only have one request per community.
            $table->unique(
                ['community_id', 'user_id'],
                'community_join_requests_unique'
            );

            $table->index(['community_id', 'status']);
        });

        /*
        |--------------------------------------------------------------------------
        | Reports
        |--------------------------------------------------------------------------
        */

        Schema::create('reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Allows reports against posts and communities.
            $table->morphs('reportable');

            $table->string('reason', 50);
            $table->text('description')->nullable();

            $table->string('status', 20)->default('pending');

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
        Schema::dropIfExists('community_join_requests');

        Schema::table('communities', function (Blueprint $table) {
            $table->dropUnique('communities_normalized_name_unique');

            $table->dropColumn([
                'visibility',
                'status',
                'normalized_name',
            ]);
        });
    }
};
