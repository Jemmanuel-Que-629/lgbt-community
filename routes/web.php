<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\PostController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('/feed', [FeedController::class, 'index'])
        ->name('feed'); 
    Route::post('/posts', [PostController::class, 'store'])
    ->name('posts.store');
});

require __DIR__.'/settings.php';
