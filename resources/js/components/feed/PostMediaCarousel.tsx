import { useEffect, useState } from 'react';

import PostMediaViewer from '@/components/modals/PostMediaViewer';
import type { Post } from '@/types/feed';

type PostMediaCarouselProps = {
    post: Post;
};

export default function PostMediaCarousel({
    post,
}: PostMediaCarouselProps) {
    const media = post.media;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);

    useEffect(() => {
        setCurrentIndex((current) =>
            Math.min(current, Math.max(0, media.length - 1)),
        );

        setViewerIndex((current) => {
            if (current === null) return null;

            return media[current] &&
                media[current].type !== 'video'
                ? current
                : null;
        });
    }, [media]);

    const imageIndexes = media
        .map((item, index) =>
            item.type === 'video' ? -1 : index,
        )
        .filter((index) => index >= 0);

    if (media.length === 0) return null;

    const currentMedia = media[currentIndex];

    if (!currentMedia) return null;

    const url = `/storage/${currentMedia.path}`;

    return (
        <>
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                <div className="flex items-center justify-between px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                        Media
                    </p>

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {currentIndex + 1} / {media.length}
                    </span>
                </div>

                <div className="flex items-stretch gap-2 bg-black p-2 sm:gap-3 sm:p-3">
                    <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={() =>
                            setCurrentIndex((current) => current - 1)
                        }
                        className="flex w-9 shrink-0 items-center justify-center self-stretch rounded-lg text-2xl text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25 sm:w-11"
                        aria-label="Previous media"
                    >
                        <span aria-hidden="true">‹</span>
                    </button>

                    <div className="flex min-h-52 min-w-0 flex-1 items-center justify-center">
                        {currentMedia.type === 'video' ? (
                            <video
                                key={currentMedia.id}
                                src={url}
                                controls
                                preload="metadata"
                                className="max-h-[450px] w-full object-contain"
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    setViewerIndex(currentIndex)
                                }
                                className="flex max-h-[450px] w-full cursor-zoom-in items-center justify-center"
                                aria-label="Open image in full screen"
                            >
                                <img
                                    key={currentMedia.id}
                                    src={url}
                                    alt={`Post media ${currentIndex + 1}`}
                                    loading="lazy"
                                    className="max-h-[450px] w-full object-contain"
                                />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        disabled={currentIndex === media.length - 1}
                        onClick={() =>
                            setCurrentIndex((current) => current + 1)
                        }
                        className="flex w-9 shrink-0 items-center justify-center self-stretch rounded-lg text-2xl text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25 sm:w-11"
                        aria-label="Next media"
                    >
                        <span aria-hidden="true">›</span>
                    </button>
                </div>
            </div>

            <PostMediaViewer
                post={post}
                imageIndexes={imageIndexes}
                viewerIndex={viewerIndex}
                onClose={() => setViewerIndex(null)}
                onNavigate={setViewerIndex}
            />
        </>
    );
}