<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PostInteractionController extends Controller
{
    public function toggleReaction(
        Request $request,
        Post $post
    ): RedirectResponse {
        $validated = $request->validate([
            'type' => [
                'required',
                Rule::in([
                    'like',
                    'love',
                    'care',
                    'laugh',
                    'wow',
                    'sad',
                    'angry',
                ]),
            ],
        ]);

        $reaction = $post->reactions()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($reaction && $reaction->type === $validated['type']) {
            $reaction->delete();
        } else {
            $post->reactions()->updateOrCreate(
                ['user_id' => $request->user()->id],
                ['type' => $validated['type']]
            );
        }

        return back();
    }

    public function storeComment(
        Request $request,
        Post $post
    ): RedirectResponse {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'integer'],
        ]);

        $parentId = $validated['parent_id'] ?? null;

        if ($parentId !== null) {
            $parent = Comment::query()
                ->where('post_id', $post->id)
                ->findOrFail($parentId);

            // Limit replies to one level for now.
            if ($parent->parent_id !== null) {
                return back()->withErrors([
                    'body' => 'Replies to replies are not supported yet.',
                ]);
            }
        }

        $post->comments()->create([
            'user_id' => $request->user()->id,
            'parent_id' => $parentId,
            'body' => trim($validated['body']),
        ]);

        return back();
    }

    public function share(
        Request $request,
        Post $post
    ): RedirectResponse {
        // Record one share per user per post.
        $post->shares()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);

        return back();
    }
}
