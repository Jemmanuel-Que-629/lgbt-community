
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, UIEvent } from 'react';

import CommentThread from '@/components/feed/CommentThread';
import type { CommentItem, Post } from '@/types/feed';

type CommentsResponse = {
    comments: CommentItem[];
    current_page: number;
    last_page: number;
    total: number;
};

type PostActionsProps = {
    post: Post;
};

export default function PostActions({ post }: PostActionsProps) {
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<CommentItem[]>(
        post.comments ?? [],
    );
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [commentsPage, setCommentsPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [totalComments, setTotalComments] = useState(
        post.comments_count ?? 0,
    );
    const [feedback, setFeedback] = useState('');

    const loadingMoreRef = useRef(false);

    const currentReaction = post.reactions?.[0] ?? null;
    const isLiked = currentReaction !== null;

    const loadComments = useCallback(
        async (page = 1, append = false) => {
            if (append && loadingMoreRef.current) return;

            if (append) {
                loadingMoreRef.current = true;
                setLoadingMore(true);
            } else {
                setCommentsLoading(true);
            }

            try {
                const response = await fetch(
                    `/posts/${post.id}/comments?page=${page}`,
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                        },
                        credentials: 'same-origin',
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to load comments.');
                }

                const result: CommentsResponse = await response.json();

                setComments((current) => {
                    if (!append) return result.comments;

                    const existingIds = new Set(
                        current.map((comment) => comment.id),
                    );

                    return [
                        ...current,
                        ...result.comments.filter(
                            (comment) => !existingIds.has(comment.id),
                        ),
                    ];
                });

                setCommentsPage(result.current_page);
                setHasMoreComments(
                    result.current_page < result.last_page,
                );
                setTotalComments(result.total);
                setFeedback('');
            } catch {
                setFeedback('Could not load comments. Please try again.');
            } finally {
                if (append) {
                    loadingMoreRef.current = false;
                    setLoadingMore(false);
                } else {
                    setCommentsLoading(false);
                }
            }
        },
        [post.id],
    );

    useEffect(() => {
        if (commentsOpen) {
            void loadComments(1, false);
        }
    }, [commentsOpen, loadComments]);

    function toggleLike() {
        setFeedback('');

        router.post(
            `/posts/${post.id}/reaction`,
            { type: 'like' },
            {
                preserveScroll: true,
                onError: () => {
                    setFeedback(
                        'Could not update your reaction. Please try again.',
                    );
                },
            },
        );
    }

    function publishComment(body: string, parentId: number | null = null) {
        setFeedback('');

        router.post(
            `/posts/${post.id}/comments`,
            {
                body,
                ...(parentId !== null ? { parent_id: parentId } : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCommentText('');

                    if (commentsOpen) {
                        void loadComments(1, false);
                    } else {
                        setCommentsOpen(true);
                    }
                },
                onError: () => {
                    setFeedback(
                        'Could not publish your comment. Please try again.',
                    );
                },
            },
        );
    }

    function editComment(commentId: number, body: string) {
        setFeedback('');

        router.patch(
            `/comments/${commentId}`,
            { body },
            {
                preserveScroll: true,
                onSuccess: () => {
                    void loadComments(1, false);
                    setFeedback('Comment updated.');
                },
                onError: () => {
                    setFeedback(
                        'Could not edit your comment. Please try again.',
                    );
                },
            },
        );
    }

    function submitComment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const body = commentText.trim();

        if (!body) return;

        publishComment(body);
    }

    function handleCommentsScroll(event: UIEvent<HTMLDivElement>) {
        const element = event.currentTarget;
        const nearBottom =
            element.scrollTop + element.clientHeight >=
            element.scrollHeight - 80;

        if (
            nearBottom &&
            hasMoreComments &&
            !commentsLoading &&
            !loadingMore
        ) {
            void loadComments(commentsPage + 1, true);
        }
    }

    async function copyPostLink() {
        const url = `${window.location.origin}/feed#post-${post.id}`;

        try {
            await navigator.clipboard.writeText(url);
        } catch {
            window.prompt('Copy this post link:', url);
            setFeedback('Copy the link above to share this post.');
            return;
        }

        router.post(
            `/posts/${post.id}/share`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setFeedback('Link copied!');
                },
                onError: () => {
                    setFeedback(
                        'Link copied, but the share could not be recorded.',
                    );
                },
            },
        );
    }

    const actionClass =
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold transition hover:bg-gray-100 dark:hover:bg-gray-800';

    return (
        <div className="mt-4 border-t border-gray-200 pt-2 dark:border-gray-800">
            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={toggleLike}
                    aria-pressed={isLiked}
                    className={`${actionClass} ${
                        isLiked
                            ? 'text-purple-700 dark:text-purple-400'
                            : 'text-gray-600 dark:text-gray-300'
                    }`}
                >
                    <span aria-hidden="true">{isLiked ? '♥' : '♡'}</span>
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                    <span>{post.reactions_count ?? 0}</span>
                </button>

                <button
                    type="button"
                    onClick={() => setCommentsOpen((open) => !open)}
                    aria-expanded={commentsOpen}
                    className={`${actionClass} text-gray-600 dark:text-gray-300`}
                >
                    <span aria-hidden="true">▢</span>
                    <span>Comment</span>
                    <span>{totalComments}</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShareOpen((open) => !open)}
                    aria-expanded={shareOpen}
                    className={`${actionClass} text-gray-600 dark:text-gray-300`}
                >
                    <span aria-hidden="true">↗</span>
                    <span>Share</span>
                    <span>{post.shares_count ?? 0}</span>
                </button>
            </div>

            {shareOpen && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-white">
                        Share this post
                    </p>

                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Copy a link to share this post. The link currently
                        points to your signed-in feed.
                    </p>

                    <button
                        type="button"
                        onClick={() => void copyPostLink()}
                        className="mt-3 w-full rounded-lg bg-purple-700 px-4 py-3 font-semibold text-white hover:bg-purple-800"
                    >
                        Copy Link
                    </button>
                </div>
            )}

            {commentsOpen && (
                <section className="mt-3 space-y-4">
                    <form onSubmit={submitComment} className="flex gap-2">
                        <input
                            value={commentText}
                            onChange={(event) =>
                                setCommentText(event.target.value)
                            }
                            maxLength={2000}
                            required
                            placeholder="Write a comment..."
                            aria-label="Write a comment"
                            className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />

                        <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="rounded-full bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Post
                        </button>
                    </form>

                    {commentsLoading ? (
                        <p
                            role="status"
                            className="text-sm text-gray-500 dark:text-gray-400"
                        >
                            Loading comments...
                        </p>
                    ) : comments.length > 0 ? (
                        <>
                            <div
                                onScroll={handleCommentsScroll}
                                className="max-h-[420px] space-y-4 overflow-y-auto overscroll-contain pr-1"
                                aria-label="Comments"
                            >
                                {comments.map((comment) => (
                                    <CommentThread
                                        key={comment.id}
                                        comment={comment}
                                        onReply={(parentId, body) => {
                                            publishComment(body, parentId);
                                        }}
                                        onEdit={editComment}
                                    />
                                ))}

                                {loadingMore && (
                                    <p
                                        role="status"
                                        className="py-2 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        Loading older comments...
                                    </p>
                                )}
                            </div>

                            {hasMoreComments && (
                                <button
                                    type="button"
                                    disabled={loadingMore}
                                    onClick={() =>
                                        void loadComments(
                                            commentsPage + 1,
                                            true,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    {loadingMore
                                        ? 'Loading...'
                                        : 'Load older comments'}
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No comments yet. Start the conversation!
                        </p>
                    )}
                </section>
            )}

            {feedback && (
                <p
                    role="status"
                    className="mt-2 text-sm text-gray-600 dark:text-gray-400"
                >
                    {feedback}
                </p>
            )}
        </div>
    );
}
