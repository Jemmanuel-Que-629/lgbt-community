import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import PostCard from '@/components/feed/PostCard';
import type {
    SavedPostCollection,
    SavedPostsProps,
} from '@/types/feed';

type FlashProps = {
    flash?: {
        success?: string | null;
    };
};

export default function SavedPosts({
    posts,
    collections,
    active_collection,
}: SavedPostsProps) {
    const page = usePage();
    const flash = (page.props as typeof page.props & FlashProps).flash;

    const [collectionName, setCollectionName] = useState('');
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!flash?.success) return;

        setToast(flash.success);

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [flash?.success]);

    function selectCollection(collectionId: number | null) {
        router.get(
            '/saved-posts',
            collectionId === null ? {} : { collection: collectionId },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    }

    function createCollection(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const name = collectionName.trim();

        if (!name || creating) return;

        setCreating(true);
        setError('');

        router.post(
            '/saved-post-collections',
            { name },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCollectionName('');
                },
                onError: (errors) => {
                    setError(
                        errors.name ??
                            'Could not create the collection. Please try again.',
                    );
                },
                onFinish: () => {
                    setCreating(false);
                },
            },
        );
    }

    function renameCollection(collection: SavedPostCollection) {
        const newName = window.prompt(
            'Enter the new collection name:',
            collection.name,
        );

        if (newName === null) return;

        const trimmedName = newName.trim();

        if (!trimmedName || trimmedName === collection.name) return;

        router.patch(
            `/saved-post-collections/${collection.id}`,
            { name: trimmedName },
            {
                preserveScroll: true,
            },
        );
    }

    function deleteCollection(collection: SavedPostCollection) {
        const confirmed = window.confirm(
            `Delete "${collection.name}"? Posts inside it will remain in All Saved.`,
        );

        if (!confirmed) return;

        router.delete(
            `/saved-post-collections/${collection.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (active_collection === collection.id) {
                        router.get('/saved-posts', {}, {
                            preserveScroll: true,
                        });
                    }
                },
            },
        );
    }

    return (
        <>
            <Head title="Saved Posts" />

            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed top-5 right-5 z-[100] flex items-center gap-3 rounded-xl bg-green-600 px-5 py-3 font-medium text-white shadow-lg"
                >
                    <span aria-hidden="true">✓</span>
                    <span>{toast}</span>

                    <button
                        type="button"
                        onClick={() => setToast('')}
                        aria-label="Dismiss notification"
                        className="ml-2 rounded px-1 text-lg leading-none hover:bg-green-700"
                    >
                        ×
                    </button>
                </div>
            )}

            <main className="min-h-screen bg-gray-100 px-4 py-8 dark:bg-gray-950">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Saved Posts
                        </h1>

                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Keep the posts you want to revisit in one place.
                        </p>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                        {/* Collections sidebar */}
                        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                            <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                Your library
                            </h2>

                            <button
                                type="button"
                                onClick={() => selectCollection(null)}
                                aria-current={
                                    active_collection === null
                                        ? 'page'
                                        : undefined
                                }
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                                    active_collection === null
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                }`}
                            >
                                <span className="flex items-center gap-3">
                                    <span aria-hidden="true">🔖</span>
                                    All Saved
                                </span>

                                <span className="text-xs">
                                    {posts.total ?? posts.data.length}
                                </span>
                            </button>

                            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

                            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Collections
                            </h3>

                            {collections.length > 0 ? (
                                <div className="space-y-1">
                                    {collections.map((collection) => {
                                        const selected =
                                            active_collection === collection.id;

                                        return (
                                            <div
                                                key={collection.id}
                                                className={`group flex items-center gap-1 rounded-lg transition ${
                                                    selected
                                                        ? 'bg-purple-100 dark:bg-purple-950'
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        selectCollection(
                                                            collection.id,
                                                        )
                                                    }
                                                    aria-current={
                                                        selected
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                    className={`min-w-0 flex-1 truncate px-3 py-3 text-left text-sm font-medium ${
                                                        selected
                                                            ? 'text-purple-800 dark:text-purple-300'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <span aria-hidden="true">
                                                        📁
                                                    </span>{' '}
                                                    {collection.name}
                                                </button>

                                                <div className="flex shrink-0 pr-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            renameCollection(
                                                                collection,
                                                            )
                                                        }
                                                        aria-label={`Rename ${collection.name}`}
                                                        title="Rename collection"
                                                        className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
                                                    >
                                                        ✎
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteCollection(
                                                                collection,
                                                            )
                                                        }
                                                        aria-label={`Delete ${collection.name}`}
                                                        title="Delete collection"
                                                        className="rounded p-2 text-gray-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No collections yet.
                                </p>
                            )}

                            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

                            <form onSubmit={createCollection}>
                                <label
                                    htmlFor="saved-collection-name"
                                    className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                                >
                                    Create a collection
                                </label>

                                <input
                                    id="saved-collection-name"
                                    value={collectionName}
                                    onChange={(event) =>
                                        setCollectionName(event.target.value)
                                    }
                                    maxLength={60}
                                    placeholder="e.g. Helpful resources"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        creating || !collectionName.trim()
                                    }
                                    className="mt-2 w-full rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {creating
                                        ? 'Creating...'
                                        : '+ Create collection'}
                                </button>

                                {error && (
                                    <p
                                        role="alert"
                                        className="mt-2 text-sm text-red-600 dark:text-red-400"
                                    >
                                        {error}
                                    </p>
                                )}
                            </form>
                        </aside>

                        {/* Saved posts */}
                        <section className="min-w-0">
                            <div className="mb-5">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {active_collection === null
                                        ? 'All Saved'
                                        : collections.find(
                                              (collection) =>
                                                  collection.id ===
                                                  active_collection,
                                          )?.name ?? 'Collection'}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {posts.total ?? posts.data.length}{' '}
                                    {posts.total === 1 ? 'post' : 'posts'}
                                </p>
                            </div>

                            {posts.data.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
                                    <div
                                        className="text-4xl"
                                        aria-hidden="true"
                                    >
                                        🔖
                                    </div>

                                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                                        {active_collection === null
                                            ? 'No saved posts yet'
                                            : 'This collection is empty'}
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
                                        {active_collection === null
                                            ? 'When you save a post from your feed or a community, it will appear here.'
                                            : 'Save posts to this collection using the Organize into collections option on a saved post.'}
                                    </p>

                                    {active_collection !== null && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                selectCollection(null)
                                            }
                                            className="mt-5 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800"
                                        >
                                            View all saved posts
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {posts.data.map((post) => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {(posts.prev_page_url ||
                                posts.next_page_url) && (
                                <nav
                                    aria-label="Saved posts pagination"
                                    className="mt-6 flex items-center justify-between gap-3"
                                >
                                    {posts.prev_page_url ? (
                                        <Link
                                            href={posts.prev_page_url}
                                            preserveScroll
                                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                                        >
                                            ← Previous
                                        </Link>
                                    ) : (
                                        <span />
                                    )}

                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Page {posts.current_page} of{' '}
                                        {posts.last_page}
                                    </span>

                                    {posts.next_page_url ? (
                                        <Link
                                            href={posts.next_page_url}
                                            preserveScroll
                                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                                        >
                                            Next →
                                        </Link>
                                    ) : (
                                        <span />
                                    )}
                                </nav>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}