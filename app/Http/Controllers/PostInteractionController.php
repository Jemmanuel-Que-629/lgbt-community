<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
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

        $userId = $request->user()->id;

        $reaction = $post->reactions()
            ->where('user_id', $userId)
            ->first();

        if ($reaction && $reaction->type === $validated['type']) {
            $reaction->delete();
        } else {
            $post->reactions()->updateOrCreate(
                ['user_id' => $userId],
                ['type' => $validated['type']]
            );
        }

        return back();
    }

    public function indexComments(Post $post): JsonResponse
    {
        $comments = Comment::query()
            ->where('post_id', $post->id)
            ->with('user:id,username')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $commentsById = $comments->keyBy('id');

        foreach ($comments as $comment) {
            $comment->setRelation('replies', collect());
        }

        $roots = collect();

        foreach ($comments as $comment) {
            if ($comment->parent_id === null) {
                $roots->push($comment);

                continue;
            }

            $parent = $commentsById->get($comment->parent_id);

            if ($parent !== null) {
                $parent->getRelation('replies')->push($comment);
            }
        }

        return response()->json([
            'comments' => $roots->values(),
        ]);
    }

    public function storeComment(
        Request $request,
        Post $post
    ): RedirectResponse {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $body = trim($validated['body']);

        if ($body === '') {
            return back()->withErrors([
                'body' => 'A comment cannot be empty.',
            ]);
        }

        $parentId = $validated['parent_id'] ?? null;

        if ($parentId !== null) {
            Comment::query()
                ->where('post_id', $post->id)
                ->findOrFail($parentId);

            // Replies to replies are allowed.
            // The parent must belong to this post.
        }

        $post->comments()->create([
            'user_id' => $request->user()->id,
            'parent_id' => $parentId,
            'body' => $body,
        ]);

        return back();
    }

    public function share(
        Request $request,
        Post $post
    ): RedirectResponse {
        $post->shares()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);

        return back();
    }
}
