<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\Post;
use App\Models\SavedPost;
use App\Models\SavedPostCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SavedPostController extends Controller
{
    /**
     * Display the authenticated user's saved posts.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user, 401);

        $collectionId = $request->query('collection');
        $selectedCollection = null;

        if ($collectionId !== null) {
            abort_unless(
                is_scalar($collectionId) &&
                ctype_digit((string) $collectionId),
                404
            );

            $selectedCollection = $user->savedPostCollections()
                ->whereKey((int) $collectionId)
                ->firstOrFail();
        }

        $postsQuery = Post::query()
            ->whereHas('savedPosts', function ($query) use ($user, $selectedCollection) {
                $query->where('user_id', $user->id);

                if ($selectedCollection) {
                    $query->whereHas('collections', function ($collectionQuery) use ($selectedCollection) {
                        $collectionQuery->where(
                            'saved_post_collections.id',
                            $selectedCollection->id
                        );
                    });
                }
            })
            ->whereHas('community', function ($query) use ($user) {
                $query->where('status', 'active')
                    ->where(function ($visibilityQuery) use ($user) {
                        $visibilityQuery
                            ->where('visibility', 'public')
                            ->orWhere(function ($privateQuery) use ($user) {
                                $privateQuery
                                    ->where('visibility', 'private')
                                    ->where(function ($accessQuery) use ($user) {
                                        $accessQuery
                                            ->where('user_id', $user->id)
                                            ->orWhereHas('members', function ($memberQuery) use ($user) {
                                                $memberQuery->where('users.id', $user->id);
                                            });
                                    });
                            });
                    });
            })
            ->with([
                'user:id,username',
                'community:id,name,slug',
                'media',
                'comments' => function ($query) {
                    $query->whereNull('parent_id')
                        ->with([
                            'user:id,username',
                            'replies' => function ($replyQuery) {
                                $replyQuery->with('user:id,username');
                            },
                        ])
                        ->latest();
                },
                'reactions' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                },
            ])
            ->withCount(['comments', 'reactions', 'shares'])
            ->withExists([
                'savedPosts as is_saved' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                },
            ]);

        $posts = $postsQuery
            ->orderByDesc(
                SavedPost::query()
                    ->select('created_at')
                    ->whereColumn('saved_posts.post_id', 'posts.id')
                    ->where('saved_posts.user_id', $user->id)
                    ->limit(1)
            )
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Post $post) => $post);

        $collections = $user->savedPostCollections()
            ->orderBy('name')
            ->get(['id', 'name', 'is_default']);

        return Inertia::render('saved-posts/index', [
            'posts' => $posts,
            'collections' => $collections,
            'active_collection' => $selectedCollection?->id,
        ]);
    }

    /**
     * Return the current user's collection information for one post.
     */
    public function collectionData(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();

        abort_unless($user, 401);

        $this->ensureCanAccessPost((int) $user->id, $post);

        $savedPost = $user->savedPosts()
            ->where('post_id', $post->id)
            ->first();

        $collections = $user->savedPostCollections()
            ->orderBy('name')
            ->get(['id', 'name', 'is_default']);

        return response()->json([
            'is_saved' => $savedPost !== null,
            'saved_post_id' => $savedPost?->id,
            'collections' => $collections,
            'assigned_collection_ids' => $savedPost
                ? $savedPost->collections()
                    ->pluck('saved_post_collections.id')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                : [],
        ]);
    }

    /**
     * Save a post and automatically assign it to all default collections.
     */
    public function store(Request $request, Post $post): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user, 401);

        $this->ensureCanAccessPost((int) $user->id, $post);

        DB::transaction(function () use ($user, $post) {
            $savedPost = $user->savedPosts()->firstOrCreate([
                'post_id' => $post->id,
            ]);

            $defaultCollectionIds = $user->savedPostCollections()
                ->where('is_default', true)
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();

            if (! empty($defaultCollectionIds)) {
                $savedPost->collections()->syncWithoutDetaching(
                    $defaultCollectionIds
                );
            }
        });

        return back()->with('success', 'Post saved successfully.');
    }

    /**
     * Remove a post from the authenticated user's saved posts.
     *
     * Its collection assignments are deleted automatically by the
     * saved_post_collection_items foreign key cascade.
     */
    public function destroy(Request $request, Post $post): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user, 401);

        // Allow users to remove stale saves even if they lost access
        // to the original private community.
        $user->savedPosts()
            ->where('post_id', $post->id)
            ->delete();

        return back()->with('success', 'Post removed from saved posts.');
    }

    /**
     * Create a collection.
     *
     * If saved_post_id is supplied, the current saved post is also
     * assigned to the newly created collection.
     */
    public function storeCollection(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user, 401);

        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:1',
                'max:60',
                Rule::unique('saved_post_collections', 'name')
                    ->where(fn ($query) => $query->where('user_id', $user->id)),
            ],
            'is_default' => [
                'sometimes',
                'boolean',
            ],
            'saved_post_id' => [
                'nullable',
                'integer',
            ],
        ]);

        $savedPost = null;

        if (! empty($validated['saved_post_id'])) {
            $savedPost = $user->savedPosts()
                ->whereKey($validated['saved_post_id'])
                ->firstOrFail();

            $this->ensureCanAccessPost(
                (int) $user->id,
                $savedPost->post
            );
        }

        DB::transaction(function () use ($user, $validated, $savedPost) {
            $collection = $user->savedPostCollections()->create([
                'name' => $validated['name'],
                'is_default' => (bool) ($validated['is_default'] ?? false),
            ]);

            // When a collection is created from the organize modal
            // for a specific saved post, include that post immediately.
            if ($savedPost) {
                $collection->savedPosts()->syncWithoutDetaching([
                    $savedPost->id,
                ]);
            }
        });

        return back()->with('success', 'Collection created successfully.');
    }

    /**
     * Rename a collection.
     */
    public function updateCollection(
        Request $request,
        SavedPostCollection $collection
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user, 401);
        $this->ensureOwnsCollection((int) $user->id, $collection);

        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:1',
                'max:60',
                Rule::unique('saved_post_collections', 'name')
                    ->where(fn ($query) => $query->where('user_id', $user->id))
                    ->ignore($collection->id),
            ],
        ]);

        $collection->update([
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Collection renamed successfully.');
    }

    /**
     * Set or unset a collection as a default collection.
     *
     * This affects future saves only. Existing assignments are preserved.
     */
    public function updateDefault(
        Request $request,
        SavedPostCollection $collection
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user, 401);
        $this->ensureOwnsCollection((int) $user->id, $collection);

        $validated = $request->validate([
            'is_default' => [
                'required',
                'boolean',
            ],
        ]);

        $collection->update([
            'is_default' => (bool) $validated['is_default'],
        ]);

        return back()->with(
            'success',
            $collection->is_default
                ? 'New saved posts will automatically be added to this collection.'
                : 'Automatic saving to this collection has been turned off.'
        );
    }

    /**
     * Delete a collection without deleting its saved posts.
     */
    public function destroyCollection(
        Request $request,
        SavedPostCollection $collection
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user, 401);
        $this->ensureOwnsCollection((int) $user->id, $collection);

        $collection->delete();

        return back()->with('success', 'Collection deleted successfully.');
    }

    /**
     * Add one of the user's saved posts to a collection.
     */
    public function addToCollection(
        Request $request,
        SavedPostCollection $collection,
        SavedPost $savedPost
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user, 401);

        $this->ensureOwnsCollection((int) $user->id, $collection);

        abort_unless(
            (int) $savedPost->user_id === (int) $user->id,
            404
        );

        $this->ensureCanAccessPost((int) $user->id, $savedPost->post);

        $collection->savedPosts()->syncWithoutDetaching([
            $savedPost->id,
        ]);

        return back()->with('success', 'Post added to collection.');
    }

    /**
     * Remove a post from a collection without unsaving it.
     */
    public function removeFromCollection(
        Request $request,
        SavedPostCollection $collection,
        SavedPost $savedPost
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user, 401);

        $this->ensureOwnsCollection((int) $user->id, $collection);

        abort_unless(
            (int) $savedPost->user_id === (int) $user->id,
            404
        );

        $collection->savedPosts()->detach($savedPost->id);

        return back()->with('success', 'Post removed from collection.');
    }

    /**
     * Verify that the collection belongs to the authenticated user.
     */
    private function ensureOwnsCollection(
        int $userId,
        SavedPostCollection $collection
    ): void {
        abort_unless(
            (int) $collection->user_id === $userId,
            404
        );
    }

    /**
     * Verify that the user currently has access to the post's community.
     */
    private function ensureCanAccessPost(int $userId, Post $post): void
    {
        $community = $post->community;

        abort_unless(
            $community instanceof Community &&
            $community->status === 'active',
            404
        );

        if ($community->visibility === 'public') {
            return;
        }

        abort_unless($community->visibility === 'private', 404);

        if ((int) $community->user_id === $userId) {
            return;
        }

        $isMember = $community->members()
            ->where('users.id', $userId)
            ->exists();

        abort_unless($isMember, 404);
    }
}