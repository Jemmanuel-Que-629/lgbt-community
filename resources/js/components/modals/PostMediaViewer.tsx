import { useEffect } from 'react';

import PostActions from '@/components/feed/PostActions';
import type { Post } from '@/types/feed';

type PostMediaViewerProps = {
    post: Post;
    imageIndexes: number[];
    viewerIndex: number | null;
    onClose: () => void;
    onNavigate: (index: number) => void;
};

export default function PostMediaViewer({
    post,
    imageIndexes,
    viewerIndex,
    onClose,
    onNavigate,
}: PostMediaViewerProps) {
    const media = post.media;

    useEffect(() => {
        if (viewerIndex === null) return;

        const currentViewerIndex = viewerIndex;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            const position =
                imageIndexes.indexOf(currentViewerIndex);

            if (event.key === 'ArrowLeft' && position > 0) {
                onNavigate(imageIndexes[position - 1]);
            }

            if (
                event.key === 'ArrowRight' &&
                position >= 0 &&
                position < imageIndexes.length - 1
            ) {
                onNavigate(imageIndexes[position + 1]);
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [viewerIndex, imageIndexes, onClose, onNavigate]);

    if (viewerIndex === null) return null;

    const viewerMedia = media[viewerIndex];

    if (!viewerMedia || viewerMedia.type === 'video') {
        return null;
    }

    const viewerPosition = imageIndexes.indexOf(viewerIndex);

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-2 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Post image viewer"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="relative flex h-[96dvh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-gray-950 shadow-2xl md:h-[90vh] md:flex-row">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-30 rounded-full bg-black/60 px-3 py-1 text-3xl leading-none text-white hover:bg-black/80"
                    aria-label="Close image viewer"
                >
                    ×
                </button>

                <section className="relative flex min-h-0 flex-1 items-center justify-center bg-black">
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                        {viewerPosition + 1} / {imageIndexes.length}
                    </div>

                    {viewerPosition > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                onNavigate(
                                    imageIndexes[viewerPosition - 1],
                                )
                            }
                            className="absolute left-2 z-10 rounded-full bg-white/10 px-4 py-3 text-3xl text-white hover:bg-white/20 sm:left-4"
                            aria-label="Previous image"
                        >
                            ‹
                        </button>
                    )}

                    <img
                        src={`/storage/${viewerMedia.path}`}
                        alt={`Image from ${post.title}`}
                        className="max-h-full max-w-full object-contain"
                    />

                    {viewerPosition >= 0 &&
                        viewerPosition < imageIndexes.length - 1 && (
                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate(
                                        imageIndexes[viewerPosition + 1],
                                    )
                                }
                                className="absolute right-2 z-10 rounded-full bg-white/10 px-4 py-3 text-3xl text-white hover:bg-white/20 sm:right-4"
                                aria-label="Next image"
                            >
                                ›
                            </button>
                        )}
                </section>

                <aside className="max-h-[48%] shrink-0 overflow-y-auto bg-white p-4 dark:bg-gray-900 md:max-h-full md:w-[380px] md:max-w-[40%]">
                    <div className="mb-4 border-b border-gray-200 pb-4 pr-10 dark:border-gray-800">
                        <p className="font-semibold text-gray-900 dark:text-white">
                            @{post.user.username}
                        </p>

                        <p className="mt-1 text-sm text-purple-700 dark:text-purple-400">
                            {post.community.name}
                        </p>

                        <time
                            dateTime={post.created_at}
                            className="mt-1 block text-xs text-gray-500 dark:text-gray-400"
                        >
                            {new Date(post.created_at).toLocaleString()}
                        </time>

                        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                            {post.title}
                        </h2>

                        {post.body && (
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                                {post.body}
                            </p>
                        )}
                    </div>

                    <PostActions post={post} />
                </aside>
            </div>
        </div>
    );
}