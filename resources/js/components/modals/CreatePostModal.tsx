import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import type { CommunityOption } from '@/types/feed';

type CreatePostModalProps = {
    isOpen: boolean;
    communities: CommunityOption[];
    onClose: () => void;
};

type CreatePostFormData = {
    community_id: string;
    title: string;
    body: string;
    media: File[];
};

type MediaPreview = {
    file: File;
    url: string;
};

export default function CreatePostModal({
    isOpen,
    communities,
    onClose,
}: CreatePostModalProps) {
    const {
        data,
        setData,
        post: submitPost,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm<CreatePostFormData>({
        community_id: communities[0]?.id.toString() ?? '',
        title: '',
        body: '',
        media: [],
    });

    const [currentPreview, setCurrentPreview] = useState(0);
    const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);

    useEffect(() => {
        if (isOpen) clearErrors();
    }, [isOpen, clearErrors]);

    useEffect(() => {
        const previews = data.media.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));

        setMediaPreviews(previews);
        setCurrentPreview((current) =>
            Math.min(current, Math.max(0, previews.length - 1)),
        );

        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [data.media]);

    function handleCreatePost(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        submitPost('/posts', {
            onSuccess: () => {
                reset();
                clearErrors();
                setCurrentPreview(0);
                onClose();
            },
        });
    }

    function handleMediaSelection(event: ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(event.target.files ?? []);
        const remaining = 5 - data.media.length;

        if (remaining > 0) {
            setData('media', [...data.media, ...selected.slice(0, remaining)]);
        }

        // Clear the input so selecting the same file again triggers onChange.
        event.target.value = '';
    }

    function removeCurrentMedia() {
        const updatedMedia = data.media.filter(
            (_, index) => index !== currentPreview,
        );
        setData('media', updatedMedia);
        setCurrentPreview((current) =>
            Math.min(current, Math.max(0, updatedMedia.length - 1)),
        );
    }

    function handleClose() {
        if (processing) return;
        onClose();
        setCurrentPreview(0);
    }

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) handleClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-post-title"
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
            >
                <div className="mb-6 flex items-center justify-between">
                    <h2
                        id="create-post-title"
                        className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        Create a Post
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={processing}
                        aria-label="Close create post modal"
                        className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-5">
                    <div>
                        <label
                            htmlFor="community_id"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Community
                        </label>
                        <select
                            id="community_id"
                            value={data.community_id}
                            onChange={(event) =>
                                setData('community_id', event.target.value)
                            }
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="" disabled>
                                Choose a community
                            </option>
                            {communities.map((community) => (
                                <option key={community.id} value={community.id}>
                                    {community.name}
                                </option>
                            ))}
                        </select>
                        {errors.community_id && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.community_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="post-title"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Title
                        </label>
                        <input
                            id="post-title"
                            type="text"
                            value={data.title}
                            onChange={(event) =>
                                setData('title', event.target.value)
                            }
                            maxLength={255}
                            required
                            placeholder="Give your post a title..."
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="post-body"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Body (optional)
                        </label>
                        <textarea
                            id="post-body"
                            value={data.body}
                            onChange={(event) =>
                                setData('body', event.target.value)
                            }
                            rows={5}
                            maxLength={10000}
                            placeholder="What's on your mind?"
                            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        {errors.body && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.body}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="post-media"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Photos and videos (up to 5)
                        </label>
                        <input
                            id="post-media"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                            multiple
                            disabled={processing || data.media.length >= 5}
                            onChange={handleMediaSelection}
                            className="block w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-2 file:font-medium file:text-purple-800 dark:border-gray-700 dark:text-gray-300"
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            JPG, PNG, WEBP, GIF, MP4, WEBM or MOV. Maximum 20 MB
                            per file.
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {data.media.length} / 5 files selected
                        </p>
                        {errors.media && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.media}
                            </p>
                        )}
                        {Object.entries(errors)
                            .filter(([key]) => key.startsWith('media.'))
                            .map(([key, message]) => (
                                <p
                                    key={key}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {message}
                                </p>
                            ))}

                        {mediaPreviews.length > 0 && (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                                <div className="flex items-center justify-between px-4 py-3">
                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                        Media preview
                                    </p>
                                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                        {currentPreview + 1} /{' '}
                                        {mediaPreviews.length}
                                    </span>
                                </div>

                                <div className="flex min-h-52 items-center justify-center bg-black">
                                    {mediaPreviews[currentPreview] &&
                                        (mediaPreviews[
                                            currentPreview
                                        ].file.type.startsWith('video/') ? (
                                            <video
                                                key={
                                                    mediaPreviews[
                                                        currentPreview
                                                    ].url
                                                }
                                                src={
                                                    mediaPreviews[
                                                        currentPreview
                                                    ].url
                                                }
                                                controls
                                                className="max-h-80 w-full object-contain"
                                            />
                                        ) : (
                                            <img
                                                key={
                                                    mediaPreviews[
                                                        currentPreview
                                                    ].url
                                                }
                                                src={
                                                    mediaPreviews[
                                                        currentPreview
                                                    ].url
                                                }
                                                alt={`Preview ${currentPreview + 1}`}
                                                className="max-h-80 w-full object-contain"
                                            />
                                        ))}
                                </div>

                                <div className="flex items-center justify-between gap-3 px-4 py-3">
                                    <button
                                        type="button"
                                        disabled={currentPreview === 0}
                                        onClick={() =>
                                            setCurrentPreview(
                                                (current) => current - 1,
                                            )
                                        }
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                    >
                                        <span aria-hidden="true">←</span>{' '}
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {currentPreview + 1} of{' '}
                                        {mediaPreviews.length}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={
                                            currentPreview ===
                                            mediaPreviews.length - 1
                                        }
                                        onClick={() =>
                                            setCurrentPreview(
                                                (current) => current + 1,
                                            )
                                        }
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                    >
                                        Next <span aria-hidden="true">→</span>
                                    </button>
                                </div>

                                <div className="flex justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={removeCurrentMedia}
                                        className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || communities.length === 0}
                            className="rounded-lg bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Publishing...' : 'Publish Post'}
                        </button>
                    </div>

                    {communities.length === 0 && (
                        <p className="text-sm text-amber-600">
                            No communities are available yet. Create a community
                            before publishing.
                        </p>
                    )}
                </form>
            </section>
        </div>
    );
}
