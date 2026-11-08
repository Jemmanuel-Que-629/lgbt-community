<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class PostInteractionController extends Controller
{
    /**
     * Toggle a reaction on a post.
     */
    public function toggleReaction(
        Request $request,
        Post $post
    ): RedirectResponse {
        $this->ensureCanAccessPost($request, $post);

        $validated = $request->validate([
            'type' => [
                'required',
                'string',
                'in:like,love,care,laugh,wow,sad,angry',
            ],
        ]);

        $reaction = $post->reactions()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($reaction && $reaction->type === $validated['type']) {
            $reaction->delete();
        } else {
            $post->reactions()->updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                ],
                [
                    'type' => $validated['type'],
                ]
            );
        }

        return back();
    }

    /**
     * Retrieve paginated comments and their nested replies.
     */
    public function indexComments(
        Request $request,
        Post $post
    ): JsonResponse {
        $this->ensureCanAccessPost($request, $post);

        $comments = $post->comments()
            ->whereNull('parent_id')
            ->with('user:id,username')
            ->withCount('replies')
            ->latest()
            ->paginate(20);

        $commentIds = $comments->getCollection()
            ->pluck('id')
            ->all();

        $replies = collect();

        if (! empty($commentIds)) {
            $replies = $this->getAllReplies($commentIds);
        }

        $repliesByParent = $replies->groupBy('parent_id');

        $buildReplies = function ($parentId) use (
            &$buildReplies,
            $repliesByParent,
            $request
        ) {
            return ($repliesByParent->get($parentId) ?? collect())
                ->map(function ($reply) use (
                    &$buildReplies,
                    $request
                ) {
                    return [
                        'id' => $reply->id,
                        'post_id' => $reply->post_id,
                        'parent_id' => $reply->parent_id,
                        'body' => $reply->body,
                        'created_at' => $reply->created_at,
                        'updated_at' => $reply->updated_at,
                        'user' => $reply->user,
                        'can_edit' => $reply->user_id === $request->user()->id,
                        'replies' => $buildReplies($reply->id),
                    ];
                })
                ->values();
        };

        $formattedComments = $comments->getCollection()
            ->map(function ($comment) use (
                $request,
                $buildReplies
            ) {
                return [
                    'id' => $comment->id,
                    'post_id' => $comment->post_id,
                    'parent_id' => $comment->parent_id,
                    'body' => $comment->body,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'user' => $comment->user,
                    'replies_count' => $comment->replies_count,
                    'can_edit' => $comment->user_id === $request->user()->id,
                    'replies' => $buildReplies($comment->id),
                ];
            })
            ->values();

        return response()->json([
            'comments' => $formattedComments,
            'current_page' => $comments->currentPage(),
            'last_page' => $comments->lastPage(),
            'total' => $comments->total(),
        ]);
    }

    /**
     * Create a comment or reply.
     */
    public function storeComment(
        Request $request,
        Post $post
    ): RedirectResponse {
        $this->ensureCanAccessPost($request, $post);

        $validated = $request->validate([
            'body' => [
                'required',
                'string',
                'max:2000',
            ],
            'parent_id' => [
                'nullable',
                'integer',
                'exists:comments,id',
            ],
        ]);

        $body = trim($validated['body']);

        if ($body === '') {
            return back()->withErrors([
                'body' => 'Comment cannot be empty.',
            ]);
        }

        if (! empty($validated['parent_id'])) {
            $parentComment = $post->comments()
                ->whereKey($validated['parent_id'])
                ->exists();

            if (! $parentComment) {
                return back()->withErrors([
                    'parent_id' => 'The selected parent comment does not belong to this post.',
                ]);
            }
        }

        $post->comments()->create([
            'user_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'body' => $body,
        ]);

        return back()->with('success', 'Comment added successfully.');
    }

    /**
     * Update an existing comment.
     */
    public function updateComment(
        Request $request,
        Comment $comment
    ): RedirectResponse {
        abort_unless(
            $comment->user_id === $request->user()->id,
            403
        );

        $this->ensureCanAccessPost($request, $comment->post);

        $validated = $request->validate([
            'body' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        $body = trim($validated['body']);

        if ($body === '') {
            return back()->withErrors([
                'body' => 'Comment cannot be empty.',
            ]);
        }

        $comment->update([
            'body' => $body,
        ]);

        return back()->with('success', 'Comment updated successfully.');
    }

    /**
     * Share a post.
     */
    public function share(
        Request $request,
        Post $post
    ): RedirectResponse {
        $this->ensureCanAccessPost($request, $post);

        $post->shares()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Post shared successfully.');
    }

    /**
     * Retrieve all nested replies for the supplied parent comment IDs.
     *
     * @param  array<int, int>  $parentIds
     * @return Collection<int, Comment>
     */
    private function getAllReplies(array $parentIds): Collection
    {
        /** @var Collection<int, Comment> $allReplies */
        $allReplies = collect();

        $currentParentIds = $parentIds;

        while (! empty($currentParentIds)) {
            $replies = Comment::query()
                ->whereIn('parent_id', $currentParentIds)
                ->with('user:id,username')
                ->orderBy('created_at')
                ->get();

            if ($replies->isEmpty()) {
                break;
            }

            $allReplies = $allReplies->concat($replies);

            $currentParentIds = $replies
                ->pluck('id')
                ->all();
        }

        return $allReplies;
    }

    /**
     * Ensure the authenticated user can access the post's community.
     *
     * Public communities are accessible to all authenticated users.
     * Private communities require approved membership.
     * Suspended communities are inaccessible.
     */
    private function ensureCanAccessPost(
        Request $request,
        Post $post
    ): void {
        $userId = $request->user()->id;

        $allowed = $post->community()
            ->where('status', 'active')
            ->where(function (Builder $query) use ($userId) {
                $query->where('visibility', 'public')
                    ->orWhere(function (Builder $query) use ($userId) {
                        $query->where('visibility', 'private')
                            ->whereHas('members', function (Builder $members) use ($userId) {
                                $members->where('users.id', $userId);
                            });
                    });
            })
            ->exists();

        abort_unless($allowed, 404);
    }
}
