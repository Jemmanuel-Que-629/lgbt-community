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
        $posts = Post::with([
            'user:id,username',
            'community:id,name,slug',
            'media',
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
