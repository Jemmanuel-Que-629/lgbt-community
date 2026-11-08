import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Globe2,
    LockKeyhole,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';

import FeedPagination from '@/components/feed/FeedPagination';
import PostCard from '@/components/feed/PostCard';
import CreatePostModal from '@/components/modals/CreatePostModal';

import type { CommunityShowProps } from '@/types/feed';

export default function CommunityShow({
    community,
    posts,
    can_view_posts,
    can_post,
    communities,
}: CommunityShowProps) {
    const page = usePage();

    const flash = (
        page.props as typeof page.props & {
            flash?: { success?: string | null };
        }
    ).flash;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isMembershipProcessing, setIsMembershipProcessing] =
        useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash?.success]);

    function joinCommunity() {
        if (isMembershipProcessing) return;

        setIsMembershipProcessing(true);

        router.post(
            `/communities/${community.slug}/join`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsMembershipProcessing(false),
            },
        );
    }

    function leaveCommunity() {
        if (isMembershipProcessing) return;

        const confirmed = window.confirm(
            `Are you sure you want to leave ${community.name}?`,
        );

        if (!confirmed) return;

        setIsMembershipProcessing(true);

        router.delete(
            `/communities/${community.slug}/leave`,
            {
                preserveScroll: true,
                onFinish: () => setIsMembershipProcessing(false),
            },
        );
    }

    const membershipButtonLabel =
        community.visibility === 'private'
            ? community.join_request_status === 'pending'
                ? 'Request Pending'
                : 'Request to Join'
            : 'Join Community';

    return (
        <>
            <Head title={community.name} />

            <main className="min-h-screen bg-gray-100 px-4 py-8 dark:bg-gray-950">
                <div className="mx-auto max-w-3xl">
                    {/* Back navigation */}
                    <div className="mb-5">
                        <Link
                            href="/communities"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-400"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Discover Communities
                        </Link>
                    </div>

                    {/* Community header */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-950 dark:to-pink-950">
                            {community.image_url ? (
                                <img
                                    src={community.image_url}
                                    alt={`${community.name} community cover`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span
                                    className="text-6xl font-bold text-purple-700 dark:text-purple-300"
                                    aria-hidden="true"
                                >
                                    {community.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="break-words text-2xl font-bold text-gray-900 dark:text-white">
                                            {community.name}
                                        </h1>

                                        {community.visibility === 'private' ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                                <LockKeyhole className="h-3 w-3" />
                                                Private
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-950/50 dark:text-green-300">
                                                <Globe2 className="h-3 w-3" />
                                                Public
                                            </span>
                                        )}
                                    </div>

                                    {community.category && (
                                        <p className="mt-2 text-sm font-medium text-purple-700 dark:text-purple-400">
                                            {community.category}
                                        </p>
                                    )}
                                </div>

                                {can_post ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(true)}
                                        className="shrink-0 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                    >
                                        + Create Post
                                    </button>
                                ) : !community.is_member ? (
                                    <button
                                        type="button"
                                        onClick={joinCommunity}
                                        disabled={
                                            isMembershipProcessing ||
                                            community.join_request_status ===
                                                'pending'
                                        }
                                        className="shrink-0 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isMembershipProcessing
                                            ? 'Please wait...'
                                            : membershipButtonLabel}
                                    </button>
                                ) : null}
                            </div>

                            <p className="mt-5 break-words whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
                                {community.description?.trim() ||
                                    'No description has been added yet.'}
                            </p>

                            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                                {community.members_count !== null && (
                                    <span className="inline-flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        {community.members_count}{' '}
                                        {community.members_count === 1
                                            ? 'member'
                                            : 'members'}
                                    </span>
                                )}

                                <span>
                                    Created by @{community.creator.username}
                                </span>

                                {community.is_owner && (
                                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                        You own this community
                                    </span>
                                )}

                                {community.is_member &&
                                    !community.is_owner && (
                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">
                                            Member
                                        </span>
                                    )}
                            </div>

                            {community.is_member && !community.is_owner && (
                                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={leaveCommunity}
                                        disabled={isMembershipProcessing}
                                        className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50 dark:text-red-400"
                                    >
                                        {isMembershipProcessing
                                            ? 'Please wait...'
                                            : 'Leave Community'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Posts */}
                    <section className="mt-8">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Community Posts
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Posts shared by this community's members.
                                </p>
                            </div>
                        </div>

                        {!can_view_posts ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
                                <LockKeyhole className="mx-auto h-8 w-8 text-amber-700 dark:text-amber-400" />

                                <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                                    This is a private community
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    You need to be an approved member to view
                                    posts in this community. Send a request to
                                    the owner to become a member.
                                </p>

                                {community.join_request_status ===
                                    'pending' && (
                                    <p className="mt-4 text-sm font-semibold text-amber-800 dark:text-amber-300">
                                        Your membership request is waiting for
                                        approval.
                                    </p>
                                )}
                            </div>
                        ) : posts.data.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    No posts yet
                                </h3>

                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {can_post
                                        ? 'Be the first member to share something with this community.'
                                        : 'There are no posts in this community yet.'}
                                </p>

                                {can_post && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(true)}
                                        className="mt-5 rounded-lg bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                                    >
                                        Create the First Post
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {posts.data.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}

                        {can_view_posts && (
                            <FeedPagination posts={posts} />
                        )}
                    </section>
                </div>

                {/* Keep mounted so a draft survives closing and reopening. */}
                {can_post && (
                    <CreatePostModal
                        isOpen={isCreateOpen}
                        communities={communities}
                        selectedCommunityId={community.id}
                        returnToCommunity
                        onClose={() => setIsCreateOpen(false)}
                    />
                )}
            </main>
        </>
    );
}