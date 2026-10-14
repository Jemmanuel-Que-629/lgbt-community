<?php

use App\Http\Controllers\FeedController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostInteractionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('/feed', [FeedController::class, 'index'])
        ->name('feed');

    Route::post('/posts', [PostController::class, 'store'])
        ->name('posts.store');

    Route::post(
        '/posts/{post}/reaction',
        [PostInteractionController::class, 'toggleReaction']
    )->name('posts.reaction.toggle');

    Route::get(
        '/posts/{post}/comments',
        [PostInteractionController::class, 'indexComments']
    )->name('posts.comments.index');

    Route::post(
        '/posts/{post}/comments',
        [PostInteractionController::class, 'storeComment']
    )->name('posts.comments.store');

    Route::post(
        '/posts/{post}/share',
        [PostInteractionController::class, 'share']
    )->name('posts.share');
});

require __DIR__ . '/settings.php';