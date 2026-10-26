
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { CommentItem } from '@/types/feed';

type CommentThreadProps = {
    comment: CommentItem;
    depth?: number;
    onReply: (parentId: number, body: string) => void;
    onEdit: (commentId: number, body: string) => void;
};

export default function CommentThread({
    comment,
    depth = 0,
    onReply,
    onEdit,
}: CommentThreadProps) {
    const [replying, setReplying] = useState(false);
    const [editing, setEditing] = useState(false);
    const [body, setBody] = useState('');
    const [editedBody, setEditedBody] = useState(comment.body);

    function submitReply(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmed = body.trim();

        if (!trimmed) return;

        onReply(comment.id, trimmed);
        setBody('');
        setReplying(false);
    }

    function submitEdit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmed = editedBody.trim();

        if (!trimmed || trimmed === comment.body) {
            setEditing(false);
            setEditedBody(comment.body);
            return;
        }

        onEdit(comment.id, trimmed);
        setEditing(false);
    }

    function cancelEdit() {
        setEditing(false);
        setEditedBody(comment.body);
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        @{comment.user.username}
                    </p>

                    {comment.can_edit && !editing && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditedBody(comment.body);
                                setEditing(true);
                                setReplying(false);
                            }}
                            className="text-xs font-semibold text-purple-700 hover:underline dark:text-purple-400"
                        >
                            Edit
                        </button>
                    )}
                </div>

                {editing ? (
                    <form onSubmit={submitEdit} className="mt-2 space-y-2">
                        <textarea
                            value={editedBody}
                            onChange={(event) =>
                                setEditedBody(event.target.value)
                            }
                            maxLength={2000}
                            required
                            autoFocus
                            aria-label="Edit comment"
                            className="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            rows={3}
                        />

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={
                                    !editedBody.trim() ||
                                    editedBody.trim() === comment.body
                                }
                                className="rounded-lg bg-purple-700 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save
                            </button>

                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <p className="mt-1 break-words whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                        {comment.body}
                    </p>
                )}

                {!editing && (
                    <button
                        type="button"
                        onClick={() => setReplying((value) => !value)}
                        aria-expanded={replying}
                        className="mt-2 text-xs font-semibold text-purple-700 hover:underline dark:text-purple-400"
                    >
                        {replying ? 'Cancel reply' : 'Reply'}
                    </button>
                )}

                {replying && !editing && (
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
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
