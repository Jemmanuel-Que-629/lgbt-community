import type { PaginatedPosts } from '@/types/feed';

type FeedPaginationProps = {
    posts: PaginatedPosts;
};

export default function FeedPagination({ posts }: FeedPaginationProps) {
    if (posts.last_page <= 1) return null;

    return (
        <nav aria-label="Feed pagination" className="mt-6 flex items-center justify-between">
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
    );
}
