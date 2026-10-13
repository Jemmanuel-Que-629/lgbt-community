import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
type User = {
    id: number;
    username: string;
};
type Community = {
    id: number;
    name: string;
    slug: string;
};
type CommunityOption = {
    id: number;
    name: string;
};
type PostMedia = {
    id: number;
    type: 'image' | 'video' | 'gif';
    path: string;
    original_name: string | null;
    mime_type: string | null;
    size: number | null;
};
type Post = {
    id: number;
    title: string;
    body: string | null;
    created_at: string;
    user: User;
    community: Community;
    media: PostMedia[];
};
type PaginatedPosts = {
    data: Post[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};
type FeedProps = {
    posts: PaginatedPosts;
    communities: CommunityOption[];
};

function PostMediaCarousel({ media }: { media: PostMedia[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex((current) =>
            Math.min(current, Math.max(0, media.length - 1)),
        );
    }, [media.length]);

    if (media.length === 0) return null;

    const currentMedia = media[currentIndex];
    const url = `/storage/${currentMedia.path}`;

    return (
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
                    onClick={() => setCurrentIndex((current) => current - 1)}
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
                        <img
                            key={currentMedia.id}
                            src={url}
                            alt={`Post media ${currentIndex + 1}`}
                            loading="lazy"
                            className="max-h-[450px] w-full object-contain"
                        />
                    )}
                </div>

                <button
                    type="button"
                    disabled={currentIndex === media.length - 1}
                    onClick={() => setCurrentIndex((current) => current + 1)}
                    className="flex w-9 shrink-0 items-center justify-center self-stretch rounded-lg text-2xl text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25 sm:w-11"
                    aria-label="Next media"
                >
                    <span aria-hidden="true">›</span>
                </button>
            </div>
        </div>
    );
}
export default function Feed({ posts, communities }: FeedProps) {
    const page = usePage();
    const flash = (page.props as typeof page.props & {
        flash?: { success?: string | null };
    }).flash;
    const [toast, setToast] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [currentPreview, setCurrentPreview] = useState(0);
    useEffect(() => {
        if (!flash?.success) return;
        setToast(flash.success);
        const timeout = window.setTimeout(() => setToast(''), 3000);
        return () => window.clearTimeout(timeout);
    }, [flash?.success]);
    const {
        data,
        setData,
        post: submitPost,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        community_id: communities[0]?.id.toString() ?? '',
        title: '',
        body: '',
        media: [] as File[],
    });
    const [mediaPreviews, setMediaPreviews] = useState<
        { file: File; url: string }[]
    >([]);
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
            previews.forEach((preview) => {
                URL.revokeObjectURL(preview.url);
            });
        };
    }, [data.media]);
    function closeModal() {
        if (processing) return;
        setIsCreateOpen(false);
        setCurrentPreview(0);
    }
    function handleCreatePost(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        submitPost('/posts', {
            onSuccess: () => {
                reset();
                clearErrors();
                setCurrentPreview(0);
                setIsCreateOpen(false);
            },
        });
    }
    function handleMediaSelection(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        const selected = Array.from(e.target.files ?? []);
        const remaining = 5 - data.media.length;
        if (remaining > 0) {
            setData('media', [
                ...data.media,
                ...selected.slice(0, remaining),
            ]);
        }
        e.target.value = '';
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
    return (
        <>
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed right-5 top-5 z-[100] flex items-center gap-3 rounded-xl bg-green-600 px-5 py-3 font-medium text-white shadow-lg"
                >
                    <span aria-hidden="true">✓</span>
                    <span>{toast}</span>
                    <button
                        type="button"
                        onClick={() => setToast('')}
                        className="ml-2 rounded px-1 text-lg leading-none hover:bg-green-700"
                        aria-label="Dismiss notification"
                    >
                        ×
                    </button>
                </div>
            )}
            <Head title="Community Feed" />
            <main className="min-h-screen bg-gray-100 px-4 py-8 dark:bg-gray-950">
                <div className="mx-auto max-w-2xl">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Community Feed
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            A space to connect, share, and be yourself.
                        </p>
                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    clearErrors();
                                    setIsCreateOpen(true);
                                }}
                                className="inline-flex items-center rounded-lg bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800"
                            >
                                + Create Post
                            </button>
                        </div>
                    </header>
                    {posts.data.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                No posts yet
                            </h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Be the first to share something with the community!
                            </p>
                        </section>
                    ) : (
                        <div className="space-y-5">
                            {posts.data.map((post) => (
                                <article
                                    key={post.id}
                                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                                >
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                @{post.user.username}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {post.community.name}
                                            </p>
                                        </div>
                                        <time
                                            className="text-xs text-gray-500 dark:text-gray-400"
                                            dateTime={post.created_at}
                                        >
                                            {new Date(
                                                post.created_at,
                                            ).toLocaleString()}
                                        </time>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {post.title}
                                    </h2>
                                    {post.body && (
                                        <p className="mt-3 whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                                            {post.body}
                                        </p>
                                    )}
                                    {post.media.length > 0 && (
                                        <PostMediaCarousel media={post.media} />
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                    {posts.last_page > 1 && (
                        <nav
                            aria-label="Feed pagination"
                            className="mt-6 flex items-center justify-between"
                        >
                            {posts.prev_page_url ? (
                                <a
                                    href={posts.prev_page_url}
                                    className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700 dark:text-white"
                                >
                                    Previous
                                </a>
                            ) : (
                                <span />
                            )}
                            <span className="text-sm text-gray-500">
                                Page {posts.current_page} of {posts.last_page}
                            </span>
                            {posts.next_page_url ? (
                                <a
                                    href={posts.next_page_url}
                                    className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700 dark:text-white"
                                >
                                    Next
                                </a>
                            ) : (
                                <span />
                            )}
                        </nav>
                    )}
                </div>
                {isCreateOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
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
                                    onClick={closeModal}
                                    disabled={processing}
                                    aria-label="Close create post modal"
                                    className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                                >
                                    ×
                                </button>
                            </div>
                            <form
                                onSubmit={handleCreatePost}
                                className="space-y-5"
                            >
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
                                        onChange={(e) =>
                                            setData(
                                                'community_id',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="" disabled>
                                            Choose a community
                                        </option>
                                        {communities.map((community) => (
                                            <option
                                                key={community.id}
                                                value={community.id}
                                            >
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
                                        onChange={(e) =>
                                            setData('title', e.target.value)
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
                                        onChange={(e) =>
                                            setData('body', e.target.value)
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
                                        disabled={
                                            processing ||
                                            data.media.length >= 5
                                        }
                                        onChange={handleMediaSelection}
                                        className="block w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-2 file:font-medium file:text-purple-800 dark:border-gray-700 dark:text-gray-300"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        JPG, PNG, WEBP, GIF, MP4, WEBM or MOV.
                                        Maximum 20 MB per file.
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
                                        .filter(([key]) =>
                                            key.startsWith('media.'),
                                        )
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
                                                    (mediaPreviews[currentPreview].file.type.startsWith(
                                                        'video/',
                                                    ) ? (
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
                                                            (current) =>
                                                                current - 1,
                                                        )
                                                    }
                                                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                                >
                                                    <span aria-hidden="true">
                                                        ←
                                                    </span>
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
                                                            (current) =>
                                                                current + 1,
                                                        )
                                                    }
                                                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                                >
                                                    Next
                                                    <span aria-hidden="true">
                                                        →
                                                    </span>
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
                                        onClick={closeModal}
                                        disabled={processing}
                                        className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            communities.length === 0
                                        }
                                        className="rounded-lg bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing
                                            ? 'Publishing...'
                                            : 'Publish Post'}
                                    </button>
                                </div>
                                {communities.length === 0 && (
                                    <p className="text-sm text-amber-600">
                                        No communities are available yet.
                                        Create a community before publishing.
                                    </p>
                                )}
                            </form>
                        </section>
                    </div>
                )}
            </main>
        </>
    );
}
