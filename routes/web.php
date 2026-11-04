<?php

use App\Http\Controllers\CommunityController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\MyCommunityController;
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

    Route::patch(
        '/comments/{comment}',
        [PostInteractionController::class, 'updateComment']
    )->name('comments.update');

    Route::post(
        '/posts/{post}/share',
        [PostInteractionController::class, 'share']
    )->name('posts.share');

    // Community routes

    Route::get('/communities', [CommunityController::class, 'index'])
        ->name('communities.index');

    Route::get('/communities/create', [CommunityController::class, 'create'])
        ->name('communities.create');

    Route::post('/communities', [CommunityController::class, 'store'])
        ->name('communities.store');

    Route::get(
        '/my-communities',
        [MyCommunityController::class, 'index']
    )->name('my-communities.index');

    Route::post(
        '/communities/{community:slug}/join',
        [CommunityController::class, 'join']
    )->name('communities.join');

    Route::delete(
        '/communities/{community:slug}/leave',
        [CommunityController::class, 'leave']
    )->name('communities.leave');

    Route::patch(
        '/communities/{community:slug}/join-requests/{joinRequest}/approve',
        [CommunityController::class, 'approveJoinRequest']
    )->name('communities.join-requests.approve');

    Route::patch(
        '/communities/{community:slug}/join-requests/{joinRequest}/reject',
        [CommunityController::class, 'rejectJoinRequest']
    )->name('communities.join-requests.reject');
});

require __DIR__.'/settings.php';