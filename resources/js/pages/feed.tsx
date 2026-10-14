import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import FeedPagination from '@/components/feed/FeedPagination';
import PostCard from '@/components/feed/PostCard';
import CreatePostModal from '@/components/modals/CreatePostModal';
import type { FeedProps } from '@/types/feed';

export default function Feed({ posts, communities }: FeedProps) {
    const page = usePage();
    const flash = (page.props as typeof page.props & {
        flash?: { success?: string | null };
    }).flash;

    const [toast, setToast] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        if (!flash?.success) return;

        setToast(flash.success);
        const timeout = window.setTimeout(() => setToast(''), 3000);
        return () => window.clearTimeout(timeout);
    }, [flash?.success]);

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
                                onClick={() => setIsCreateOpen(true)}
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
                            {posts.data.map((post) => <PostCard key={post.id} post={post} />)}
                        </div>
                    )}

                    <FeedPagination posts={posts} />
                </div>

                {/* Keep the modal mounted so an unfinished draft survives closing/reopening. */}
                <CreatePostModal
                    isOpen={isCreateOpen}
                    communities={communities}
                    onClose={() => setIsCreateOpen(false)}
                />
            </main>
        </>
    );
}
