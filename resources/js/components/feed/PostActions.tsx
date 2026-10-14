import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { Post } from '@/types/feed';

type PostActionsProps = {
    post: Post;
};

export default function PostActions({ post }: PostActionsProps) {
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [feedback, setFeedback] = useState('');

    const currentReaction = post.reactions?.[0] ?? null;
    const isLiked = currentReaction !== null;

    function toggleLike() {
        setFeedback('');
        router.post(
            `/posts/${post.id}/reaction`,
            { type: 'like' },
            {
                preserveScroll: true,
                onError: () => setFeedback('Could not update your reaction.'),
            },
        );
    }

    function submitComment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const body = commentText.trim();
        if (!body) return;

        router.post(
            `/posts/${post.id}/comments`,
            { body },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCommentText('');
                    setFeedback('');
                    setCommentsOpen(true);
                },
                onError: () => setFeedback('Could not publish your comment. Please try again.'),
            },
        );
    }

    async function copyPostLink() {
        const url = `${window.location.origin}/feed#post-${post.id}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            window.prompt('Copy this post link:', url);
            setFeedback('If you copied the link, you can paste it wherever you want to share it.');
            return;
        }

        router.post(
            `/posts/${post.id}/share`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setFeedback('Link copied!'),
                onError: () => setFeedback('Link copied, but the share could not be recorded.'),
            },
        );
    }

    const actionClass =
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800';

    return (
        <div className="mt-4 border-t border-gray-200 pt-2 dark:border-gray-800">
            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={toggleLike}
                    aria-pressed={isLiked}
                    className={`${actionClass} ${isLiked ? 'text-purple-700 dark:text-purple-400' : 'text-gray-600'}`}
                >
                    <span aria-hidden="true">{isLiked ? '♥' : '♡'}</span>
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                    <span>{post.reactions_count ?? 0}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setCommentsOpen((open) => !open)}
                    aria-expanded={commentsOpen}
                    className={`${actionClass} text-gray-600`}
                >
                    <span aria-hidden="true">▢</span>
                    <span>Comment</span>
                    <span>{post.comments_count ?? 0}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setShareOpen((open) => !open)}
                    aria-expanded={shareOpen}
                    className={`${actionClass} text-gray-600`}
                >
                    <span aria-hidden="true">↗</span>
                    <span>Share</span>
                    <span>{post.shares_count ?? 0}</span>
                </button>
            </div>

            {shareOpen && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-white">Share this post</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Copy a link to share with someone. This link currently points to your signed-in feed.
                    </p>
                    <button
                        type="button"
                        onClick={copyPostLink}
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
                            onChange={(event) => setCommentText(event.target.value)}
                            maxLength={2000}
                            placeholder="Write a comment..."
                            aria-label="Write a comment"
                            className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="rounded-full bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                        >
                            Post
                        </button>
                    </form>

                    {post.comments?.length ? (
                        <div className="space-y-4">
                            {post.comments.map((comment) => (
                                <div key={comment.id} className="space-y-3">
                                    <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            @{comment.user.username}
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                                            {comment.body}
                                        </p>
                                    </div>
                                    {comment.replies?.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className="ml-6 rounded-xl border-l-2 border-purple-300 bg-gray-50 p-3 dark:bg-gray-900"
                                        >
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                @{reply.user.username}
                                            </p>
                                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                                                {reply.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No comments yet. Start the conversation!
                        </p>
                    )}

                    {(post.comments_count ?? 0) > (post.comments?.length ?? 0) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Showing the latest comments. Loading older comments will be added later.
                        </p>
                    )}
                </section>
            )}

            {feedback && (
                <p role="status" className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {feedback}
                </p>
            )}
        </div>
    );
}
