import { useEffect } from 'react';

import type { PostMedia } from '@/types/feed';

type PostMediaViewerProps = {
    media: PostMedia[];
    imageIndexes: number[];
    viewerIndex: number | null;
    onClose: () => void;
    onNavigate: (index: number) => void;
};

export default function PostMediaViewer({
    media,
    imageIndexes,
    viewerIndex,
    onClose,
    onNavigate,
}: PostMediaViewerProps) {
    useEffect(() => {
        if (viewerIndex === null) return;

        // Capture the narrowed value for use inside the event handler.
        const currentViewerIndex = viewerIndex;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            if (event.key === 'ArrowLeft') {
                const position = imageIndexes.indexOf(currentViewerIndex);
                const previousIndex =
                    imageIndexes[Math.max(0, position - 1)];

                if (previousIndex !== undefined) {
                    onNavigate(previousIndex);
                }
            }

            if (event.key === 'ArrowRight') {
                const position = imageIndexes.indexOf(currentViewerIndex);
                const nextIndex =
                    imageIndexes[
                        Math.min(imageIndexes.length - 1, position + 1)
                    ];

                if (nextIndex !== undefined) {
                    onNavigate(nextIndex);
                }
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
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-4 py-2 text-3xl text-white hover:bg-white/20"
                aria-label="Close image viewer"
            >
                ×
            </button>

            <p className="absolute left-4 top-5 text-sm text-white/80">
                {viewerPosition + 1} / {imageIndexes.length}
            </p>

            {viewerPosition > 0 && (
                <button
                    type="button"
                    onClick={() =>
                        onNavigate(imageIndexes[viewerPosition - 1])
                    }
                    className="absolute left-3 rounded-full bg-white/10 px-4 py-3 text-3xl text-white hover:bg-white/20 sm:left-8"
                    aria-label="Previous image"
                >
                    ‹
                </button>
            )}

            <img
                src={`/storage/${viewerMedia.path}`}
                alt={`Post image ${viewerPosition + 1}`}
                className="max-h-[88vh] max-w-[90vw] object-contain"
            />

            {viewerPosition < imageIndexes.length - 1 && (
                <button
                    type="button"
                    onClick={() =>
                        onNavigate(imageIndexes[viewerPosition + 1])
                    }
                    className="absolute right-3 rounded-full bg-white/10 px-4 py-3 text-3xl text-white hover:bg-white/20 sm:right-8"
                    aria-label="Next image"
                >
                    ›
                </button>
            )}
        </div>
    );
}