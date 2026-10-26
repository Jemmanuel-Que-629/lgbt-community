<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Rename users.name to users.username
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('name', 'username');
        });

        // Make username unique
        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });

        // Create roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Insert default roles
        DB::table('roles')->insert([
            [
                'name' => 'user',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'moderator',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Add role_id to users and link it to roles.id
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')
                ->default(1)
                ->after('username')
                ->constrained('roles')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove role_id and foreign key
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });

        // Remove roles table
        Schema::dropIfExists('roles');

        // Remove unique constraint from username
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
        });

        // Rename username back to name
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('username', 'name');
        });
    }
};
