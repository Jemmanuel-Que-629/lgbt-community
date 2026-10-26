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
    private const COMMENTS_PER_PAGE = 20;

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

    public function indexComments(
        Request $request,
        Post $post
    ): JsonResponse {
        // Paginate top-level comments, newest first.
        $paginator = Comment::query()
            ->where('post_id', $post->id)
            ->whereNull('parent_id')
            ->with('user:id,username')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(self::COMMENTS_PER_PAGE)
            ->withQueryString();

        $roots = collect($paginator->items());
        $allComments = collect();
        $parentIds = $roots->pluck('id')->all();

        // Collect descendants for the displayed top-level comments.
        // This preserves nested replies at every depth.
        while ($parentIds !== []) {
            $children = Comment::query()
                ->where('post_id', $post->id)
                ->whereIn('parent_id', $parentIds)
                ->with('user:id,username')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->get();

            if ($children->isEmpty()) {
                break;
            }

            $allComments = $allComments->concat($children);
            $parentIds = $children->pluck('id')->all();
        }

        $allDisplayedComments = $roots->concat($allComments);

        foreach ($allDisplayedComments as $comment) {
            $comment->setRelation('replies', collect());
            $comment->setAttribute(
                'can_edit',
                (int) $comment->user_id === (int) $request->user()->id
            );
        }

        $commentsById = $allDisplayedComments->keyBy('id');

        // Rebuild the tree using the parent IDs.
        foreach ($allDisplayedComments as $comment) {
            if ($comment->parent_id === null) {
                continue;
            }

            $parent = $commentsById->get($comment->parent_id);

            if ($parent !== null) {
                $parent->getRelation('replies')->push($comment);
            }
        }

        return response()->json([
            'comments' => $roots->values(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'total' => Comment::query()
            ->where('post_id', $post->id)
            ->count(),
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
        }

        $post->comments()->create([
            'user_id' => $request->user()->id,
            'parent_id' => $parentId,
            'body' => $body,
        ]);

        return back();
    }

    public function updateComment(
        Request $request,
        Comment $comment
    ): RedirectResponse {
        // Never trust the frontend's can_edit flag.
        abort_unless(
            (int) $comment->user_id === (int) $request->user()->id,
            403
        );

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $body = trim($validated['body']);

        if ($body === '') {
            return back()->withErrors([
                'body' => 'A comment cannot be empty.',
            ]);
        }

        $comment->update([
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
