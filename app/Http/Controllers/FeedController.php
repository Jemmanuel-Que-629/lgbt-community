<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function index(): Response
    {
        $posts = Post::query()
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
        ->latest()
        ->paginate(10);

        $communities = Community::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('feed', [
            'posts' => $posts,
            'communities' => $communities,
        ]);
    }
}
