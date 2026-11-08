<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    /**
     * @return Builder<Post>
     */
    private function postsQuery(Request $request): Builder
    {
        $user = $request->user();

        return Post::query()
            ->whereHas('community', function ($query) use ($user) {
                $query->where('status', 'active')
                    ->where(function ($query) use ($user) {
                        // Public communities are visible to everyone.
                        $query->where('visibility', 'public')

                            // Private communities require approved membership.
                            ->orWhere(function ($query) use ($user) {
                                $query->where('visibility', 'private')
                                    ->whereHas('members', function ($members) use ($user) {
                                        $members->where(
                                            'users.id',
                                            $user->id
                                        );
                                    });
                            });
                    });
            })
            ->with([
                'user:id,username',
                'community:id,name,slug,visibility,status',
                'media',
                'comments' => fn ($query) => $query
                    ->whereNull('parent_id')
                    ->with([
                        'user:id,username',
                        'replies.user:id,username',
                    ])
                    ->latest()
                    ->limit(3),
            ])
            ->withCount([
                'reactions',
                'comments',
                'shares',
            ])
            ->withExists([
                'savedPosts as is_saved' => fn ($query) => $query
                    ->where('user_id', $user->id),
            ])
            ->with([
                'reactions' => fn ($query) => $query
                    ->where('user_id', $user->id),
            ])
            ->latest();
    }

    /**
     * Get communities where the current user can create posts.
     */
    private function availableCommunities(Request $request)
    {
        return $request->user()
            ->joinedCommunities()
            ->where('communities.status', 'active')
            ->orderBy('communities.name')
            ->get([
                'communities.id',
                'communities.name',
            ]);
    }

    public function index(Request $request): Response
    {
        $posts = $this->postsQuery($request)
            ->paginate(10);

        return Inertia::render('feed', [
            'posts' => $posts,
            'communities' => $this->availableCommunities($request),
        ]);
    }

    public function loadMore(Request $request): JsonResponse
    {
        $posts = $this->postsQuery($request)
            ->paginate(10);

        return response()->json($posts);
    }
}