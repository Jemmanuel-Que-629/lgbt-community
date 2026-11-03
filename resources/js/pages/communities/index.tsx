import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    Compass,
    Search,
    Users,
    Image as ImageIcon,
} from 'lucide-react';

type CommunityMember = {
    id: number;
    username: string;
};

type CommunityItem = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    image_url: string | null;
    user_id: number;
    members_count: number;
    is_member: boolean;
    creator: {
        id: number;
        username: string;
    };
    members: CommunityMember[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedCommunities = {
    data: CommunityItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
};

type CommunitiesPageProps = {
    communities: PaginatedCommunities;
    filters: {
        search: string;
        category: string;
    };
    categories: string[];
};

export default function CommunitiesIndex({
    communities,
    filters,
    categories,
}: CommunitiesPageProps) {
    const [search, setSearch] = useState(filters.search);
    const [category, setCategory] = useState(filters.category);
    const [busyCommunityId, setBusyCommunityId] = useState<number | null>(
        null,
    );

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            '/communities',
            {
                search: search.trim() || undefined,
                category: category || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function changeCategory(value: string) {
        setCategory(value);

        router.get(
            '/communities',
            {
                search: search.trim() || undefined,
                category: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setCategory('');

        router.get(
            '/communities',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function toggleMembership(community: CommunityItem) {
        if (busyCommunityId !== null) {
            return;
        }

        setBusyCommunityId(community.id);

        const options = {
            preserveScroll: true,
            onFinish: () => setBusyCommunityId(null),
        };

        if (community.is_member) {
            router.delete(
                `/communities/${community.slug}/leave`,
                options,
            );
        } else {
            router.post(
                `/communities/${community.slug}/join`,
                {},
                options,
            );
        }
    }

    function getInitial(username: string) {
        return username.charAt(0).toUpperCase();
    }

    return (
        <>
            <Head title="Discover Communities" />

            <main className="min-h-screen bg-gray-100 dark:bg-gray-950">
                <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Discover Communities
                        </h1>

                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Find communities, meet people, and join
                            conversations that interest you.
                        </p>
                    </div>

                    {/* Search and category filters */}
                    <form
                        onSubmit={submitSearch}
                        className="flex flex-col gap-3 sm:flex-row"
                        role="search"
                    >
                        <div className="relative min-w-0 flex-1">
                            <Search
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                maxLength={100}
                                placeholder="Search communities..."
                                aria-label="Search communities"
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                        <select
                            value={category}
                            onChange={(event) =>
                                changeCategory(event.target.value)
                            }
                            aria-label="Filter by category"
                            className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                            <option value="">All categories</option>

                            {categories.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="h-12 shrink-0 rounded-xl bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800"
                        >
                            Search
                        </button>
                    </form>

                    {/* Community count */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {communities.total}{' '}
                            {communities.total === 1
                                ? 'community'
                                : 'communities'}{' '}
                            available
                        </p>

                        {(search || category) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-sm font-medium text-purple-700 hover:underline dark:text-purple-400"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

                    {/* Community cards */}
                    {communities.data.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {communities.data.map((community) => {
                                const isBusy =
                                    busyCommunityId === community.id;

                                return (
                                    <article
                                        key={community.id}
                                        className="flex min-h-72 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                                    >
                                        {/* Community image */}
                                        <div className="flex h-36 items-center justify-center overflow-hidden bg-purple-100 dark:bg-purple-950">
                                            {community.image_url ? (
                                                <img
                                                    src={community.image_url}
                                                    alt={`${community.name} community`}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-purple-700 dark:text-purple-300">
                                                    <ImageIcon className="h-8 w-8" />

                                                    <span className="text-xs font-medium">
                                                        Community image
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h2 className="break-words font-semibold text-gray-900 dark:text-white">
                                                        {community.name}
                                                    </h2>

                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        Created by @
                                                        {community.creator.username}
                                                    </p>
                                                </div>

                                                {community.category && (
                                                    <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                        {community.category}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-4 flex-1 break-words whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                                                {community.description?.trim() ||
                                                    'No description has been added yet.'}
                                            </p>

                                            {/* Member previews */}
                                            <div className="mt-4 flex items-center justify-between gap-3">
                                                <div className="flex items-center">
                                                    {community.members.map(
                                                        (member, index) => (
                                                            <div
                                                                key={member.id}
                                                                title={`@${member.username}`}
                                                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-200 text-xs font-semibold text-purple-800 dark:border-gray-900 dark:bg-purple-900 dark:text-purple-200 ${
                                                                    index > 0
                                                                        ? '-ml-2'
                                                                        : ''
                                                                }`}
                                                            >
                                                                {getInitial(
                                                                    member.username,
                                                                )}
                                                            </div>
                                                        ),
                                                    )}

                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                        {community.members_count}{' '}
                                                        {community.members_count ===
                                                        1
                                                            ? 'member'
                                                            : 'members'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleMembership(
                                                            community,
                                                        )
                                                    }
                                                    disabled={
                                                        busyCommunityId !==
                                                        null
                                                    }
                                                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        community.is_member
                                                            ? 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
                                                            : 'bg-purple-700 text-white hover:bg-purple-800'
                                                    }`}
                                                >
                                                    {isBusy
                                                        ? 'Please wait...'
                                                        : community.is_member
                                                          ? 'Leave'
                                                          : 'Join'}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
                            <Compass className="mx-auto h-10 w-10 text-gray-400" />

                            <h2 className="mt-4 font-semibold text-gray-900 dark:text-white">
                                No communities found
                            </h2>

                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Try another search or category, or check
                                back later for more communities.
                            </p>

                            {(search || category) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 text-sm font-semibold text-purple-700 hover:underline dark:text-purple-400"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {communities.last_page > 1 && (
                        <nav
                            aria-label="Community pagination"
                            className="flex flex-wrap items-center justify-center gap-2"
                        >
                            {communities.links.map((link, index) => (
                                <button
                                    key={`${index}-${link.label}`}
                                    type="button"
                                    disabled={!link.url || link.active}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveScroll: true,
                                                preserveState: true,
                                            });
                                        }
                                    }}
                                    className={`rounded-lg border px-3 py-2 text-sm ${
                                        link.active
                                            ? 'border-purple-700 bg-purple-700 text-white'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                </button>
                            ))}
                        </nav>
                    )}
                </div>
            </main>
        </>
    );
}