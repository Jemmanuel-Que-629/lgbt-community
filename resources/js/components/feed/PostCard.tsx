import PostActions from '@/components/feed/PostActions';
import PostMediaCarousel from '@/components/feed/PostMediaCarousel';
import type { Post } from '@/types/feed';

type PostCardProps = {
    post: Post;
};

export default function PostCard({ post }: PostCardProps) {
    return (
        <article
            id={`post-${post.id}`}
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
                    {new Date(post.created_at).toLocaleString()}
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
                <PostMediaCarousel post={post} />
            )}

            <PostActions post={post} />
        </article>
    );
}