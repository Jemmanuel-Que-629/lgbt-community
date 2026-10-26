import { useState } from 'react';
import type { FormEvent } from 'react';

import type { CommentItem } from '@/types/feed';

type CommentThreadProps = {
    comment: CommentItem;
    depth?: number;
    onReply: (parentId: number, body: string) => void;
};

export default function CommentThread({
    comment,
    depth = 0,
    onReply,
}: CommentThreadProps) {
    const [replying, setReplying] = useState(false);
    const [body, setBody] = useState('');

    function submitReply(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmed = body.trim();

        if (!trimmed) return;

        onReply(comment.id, trimmed);
        setBody('');
        setReplying(false);
    }

    return (
        <div className="space-y-3">
            <article
                className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800"
                style={{
                    marginLeft:
                        depth > 0 ? `${Math.min(depth, 5) * 12}px` : '0',
                }}
            >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    @{comment.user.username}
                </p>

                <p className="mt-1 text-sm break-words whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {comment.body}
                </p>

                <button
                    type="button"
                    onClick={() => setReplying((value) => !value)}
                    aria-expanded={replying}
                    className="mt-2 text-xs font-semibold text-purple-700 hover:underline dark:text-purple-400"
                >
                    {replying ? 'Cancel reply' : 'Reply'}
                </button>

                {replying && (
                    <form onSubmit={submitReply} className="mt-3 flex gap-2">
                        <input
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            maxLength={2000}
                            required
                            aria-label={`Reply to ${comment.user.username}`}
                            placeholder="Write a reply..."
                            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />

                        <button
                            type="submit"
                            disabled={!body.trim()}
                            className="rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Reply
                        </button>
                    </form>
                )}
            </article>

            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-3">
                    {comment.replies.map((reply) => (
                        <CommentThread
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            onReply={onReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
