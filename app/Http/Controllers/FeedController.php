<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    /**
     * @return Builder<Post>
     */
    private function postsQuery(): Builder
    {
        return Post::query()
            ->with([
                'user:id,username',
                'community:id,name,slug',
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
            ->with([
                'reactions' => fn ($query) => $query
                    ->where('user_id', auth()->id()),
            ])
            ->latest();
    }

    public function index(): Response
    {
        $posts = $this->postsQuery()->paginate(10);

        $communities = Community::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('feed', [
            'posts' => $posts,
            'communities' => $communities,
        ]);
    }

    public function loadMore(): JsonResponse
    {
        $posts = $this->postsQuery()->paginate(10);

        return response()->json($posts);
    }
}
