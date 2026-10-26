
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_user', function (Blueprint $table) {
            $table->id();

            $table->foreignId('community_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['community_id', 'user_id']);
            $table->index(['user_id', 'community_id']);
        });

        // Make existing community creators members of their own communities.
        DB::table('communities')
            ->select(['id', 'user_id'])
            ->whereNotNull('user_id')
            ->orderBy('id')
            ->chunkById(500, function ($communities): void {
                $timestamp = now();

                $memberships = $communities->map(fn ($community) => [
                    'community_id' => $community->id,
                    'user_id' => $community->user_id,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ])->all();

                if ($memberships !== []) {
                    DB::table('community_user')->insertOrIgnore($memberships);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_user');
    }
};
