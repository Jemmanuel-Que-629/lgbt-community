<?php

use App\Http\Controllers\CommunityController;
use App\Http\Controllers\CommunityManagementController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\MyCommunityController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostInteractionController;
use App\Http\Controllers\SavedPostController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Feed
    Route::get('/feed', [FeedController::class, 'index'])
        ->name('feed');

    // Posts
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

    // Communities
    Route::get('/communities', [CommunityController::class, 'index'])
        ->name('communities.index');

    Route::get('/communities/create', [CommunityController::class, 'create'])
        ->name('communities.create');

    Route::post('/communities', [CommunityController::class, 'store'])
        ->name('communities.store');

    // Individual community page
    Route::get(
        '/communities/{community:slug}',
        [CommunityController::class, 'show']
    )->name('communities.show');

    // Community management
    Route::get(
        '/communities/{community:slug}/edit',
        [CommunityManagementController::class, 'edit']
    )->name('communities.edit');

    Route::patch(
        '/communities/{community:slug}',
        [CommunityManagementController::class, 'update']
    )->name('communities.update');

    Route::delete(
        '/communities/{community:slug}',
        [CommunityManagementController::class, 'destroy']
    )->name('communities.destroy');

    // Membership
    Route::post(
        '/communities/{community:slug}/join',
        [CommunityController::class, 'join']
    )->name('communities.join');

    Route::delete(
        '/communities/{community:slug}/leave',
        [CommunityController::class, 'leave']
    )->name('communities.leave');

    // Join request management
    Route::patch(
        '/communities/{community:slug}/join-requests/{joinRequest}/approve',
        [CommunityController::class, 'approveJoinRequest']
    )->name('communities.join-requests.approve');

    Route::patch(
        '/communities/{community:slug}/join-requests/{joinRequest}/reject',
        [CommunityController::class, 'rejectJoinRequest']
    )->name('communities.join-requests.reject');

    // My Communities
    Route::get(
        '/my-communities',
        [MyCommunityController::class, 'index']
    )->name('my-communities.index');

    // Saved Posts
    Route::get('/saved-posts', [SavedPostController::class, 'index'])
        ->name('saved-posts.index');

    Route::get('/posts/{post}/saved-post-data', [SavedPostController::class, 'collectionData'])
        ->name('posts.saved-data');

    Route::patch(
        '/saved-post-collections/{collection}/default',
        [SavedPostController::class, 'updateDefault']
    )->name('saved-post-collections.default');

    Route::post(
        '/posts/{post}/save',
        [SavedPostController::class, 'store']
    )->name('posts.save');

    Route::delete(
        '/posts/{post}/save',
        [SavedPostController::class, 'destroy']
    )->name('posts.unsave');

    // Saved Post Collections
    Route::post(
        '/saved-post-collections',
        [SavedPostController::class, 'storeCollection']
    )->name('saved-post-collections.store');

    Route::patch(
        '/saved-post-collections/{collection}',
        [SavedPostController::class, 'updateCollection']
    )->name('saved-post-collections.update');

    Route::delete(
        '/saved-post-collections/{collection}',
        [SavedPostController::class, 'destroyCollection']
    )->name('saved-post-collections.destroy');

    // Collection Assignments
    Route::post(
        '/saved-post-collections/{collection}/posts/{savedPost}',
        [SavedPostController::class, 'addToCollection']
    )->name('saved-post-collections.posts.store');

    Route::delete(
        '/saved-post-collections/{collection}/posts/{savedPost}',
        [SavedPostController::class, 'removeFromCollection']
    )->name('saved-post-collections.posts.destroy');
});

require __DIR__.'/settings.php';
