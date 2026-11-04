import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    Globe2,
    Image as ImageIcon,
    LockKeyhole,
    Search,
    Users,
    Crown,
    Clock,
    Check,
    X,
    LoaderCircle,
    FolderHeart,
    Plus,
} from 'lucide-react';
import { toast } from 'sonner';

type Community = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    visibility: 'public' | 'private';
    image_url: string | null;
    members_count: number;
};

type JoinRequest = {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string | null;
    requester_username: string;
    community: {
        id: number;
        name: string;
        slug: string;
        image_url: string | null;
    } | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
};

type MyCommunitiesPageProps = {
    communities: PaginatedData<Community>;
    pendingRequests: PaginatedData<JoinRequest> | null;
    counts: {
        owned: number;
        joined: number;
    };
    filters: {
        tab: 'owned' | 'joined';
        search: string;
    };
};

type SharedProps = {
    [key: string]: unknown;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

type Tab = 'owned' | 'joined';

function formatDate(date: string | null): string {
    if (!date) {
        return 'Date unavailable';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Date unavailable';
    }

    return parsedDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function CommunityImage({
    community,
}: {
    community: Pick<Community, 'name' | 'image_url'>;
}) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [community.image_url]);

    if (community.image_url && !imageFailed) {
        return (
            <img
                src={community.image_url}
                alt={`${community.name} community`}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setImageFailed(true)}
            />
        );
    }

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <ImageIcon className="h-8 w-8" aria-hidden="true" />
            <span className="text-xs font-medium">Community image</span>
        </div>
    );
}

function VisibilityBadge({
    visibility,
}: {
    visibility: 'public' | 'private';
}) {
    const isPrivate = visibility === 'private';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                isPrivate
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
            }`}
        >
            {isPrivate ? (
                <LockKeyhole className="h-3 w-3" aria-hidden="true" />
            ) : (
                <Globe2 className="h-3 w-3" aria-hidden="true" />
            )}

            {isPrivate ? 'Private' : 'Public'}
        </span>
    );
}

function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                {icon}
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                {title}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-400">
                {description}
            </p>

            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

function Pagination({
    links,
    onNavigate,
}: {
    links: PaginationLink[];
    onNavigate: (url: string) => void;
}) {
    if (links.length <= 3) {
        return null;
    }

    function readableLabel(label: string) {
        return label
            .replace(/&laquo;/g, '«')
            .replace(/&raquo;/g, '»')
            .replace(/&amp;/g, '&');
    }

    return (
        <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-center gap-2"
        >
            {links.map((link, index) => (
                <button
                    key={`${link.label}-${index}`}
                    type="button"
                    disabled={!link.url || link.active}
                    onClick={() => link.url && onNavigate(link.url)}
                    aria-current={link.active ? 'page' : undefined}
                    className={`min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        link.active
                            ? 'bg-purple-700 text-white'
                            : link.url
                              ? 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-purple-950/40 dark:hover:text-purple-300'
                              : 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-600'
                    }`}
                >
                    {readableLabel(link.label)}
                </button>
            ))}
        </nav>
    );
}

export default function MyCommunitiesIndex({
    communities,
    pendingRequests,
    counts,
    filters,
}: MyCommunitiesPageProps) {
    const { flash } = usePage<SharedProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [busyAction, setBusyAction] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const activeTab: Tab = filters.tab === 'joined' ? 'joined' : 'owned';

    function navigateToTab(tab: Tab) {
        if (isNavigating || tab === activeTab) {
            return;
        }

        setIsNavigating(true);

        router.get(
            '/my-communities',
            {
                tab,
                search: search.trim() || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsNavigating(false),
                onError: () => {
                    toast.error('Unable to load your communities.');
                },
            },
        );
    }

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isNavigating) {
            return;
        }

        setIsNavigating(true);

        router.get(
            '/my-communities',
            {
                tab: activeTab,
                search: search.trim() || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onFinish: () => setIsNavigating(false),
                onError: () => {
                    toast.error('Unable to search your communities.');
                },
            },
        );
    }

    function clearSearch() {
        setSearch('');

        if (isNavigating) {
            return;
        }

        setIsNavigating(true);

        router.get(
            '/my-communities',
            { tab: activeTab },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onFinish: () => setIsNavigating(false),
                onError: () => {
                    toast.error('Unable to clear the search.');
                },
            },
        );
    }

    function navigateToPage(url: string) {
        if (isNavigating) {
            return;
        }

        setIsNavigating(true);

        router.get(
            url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsNavigating(false),
                onError: () => {
                    toast.error('Unable to load that page.');
                },
            },
        );
    }

    function leaveCommunity(community: Community) {
        if (busyAction !== null) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to leave "${community.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        const actionKey = `leave-${community.id}`;
        setBusyAction(actionKey);

        router.delete(`/communities/${community.slug}/leave`, {
            preserveScroll: true,
            onError: () => {
                toast.error(
                    'Unable to leave this community. Please try again.',
                );
            },
            onFinish: () => setBusyAction(null),
        });
    }

    function handleJoinRequest(
        request: JoinRequest,
        action: 'approve' | 'reject',
    ) {
        if (busyAction !== null || !request.community) {
            return;
        }

        const actionKey = `request-${request.id}-${action}`;
        setBusyAction(actionKey);

        router.patch(
            `/communities/${request.community.slug}/join-requests/${request.id}/${action}`,
            {},
            {
                preserveScroll: true,
                onError: () => {
                    toast.error(
                        `Unable to ${action} this request. It may have already been processed.`,
                    );
                },
                onFinish: () => setBusyAction(null),
            },
        );
    }

    const hasCommunities = communities.data.length > 0;
    const hasPendingRequests =
        activeTab === 'owned' &&
        (pendingRequests?.data.length ?? 0) > 0;

    return (
        <>
            <Head title="My Communities" />

            <main className="min-h-screen bg-gray-100 dark:bg-gray-950">
                <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
                    {/* Page heading */}
                    <header>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                <FolderHeart
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    My Communities
                                </h1>

                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Manage the communities you own and the
                                    ones you have joined.
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Owned and Joined tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={() => navigateToTab('owned')}
                            disabled={isNavigating}
                            aria-current={
                                activeTab === 'owned' ? 'page' : undefined
                            }
                            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                activeTab === 'owned'
                                    ? 'border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            <Crown className="h-4 w-4" aria-hidden="true" />
                            Owned
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                    activeTab === 'owned'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                            >
                                {counts.owned}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigateToTab('joined')}
                            disabled={isNavigating}
                            aria-current={
                                activeTab === 'joined' ? 'page' : undefined
                            }
                            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                activeTab === 'joined'
                                    ? 'border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            <Users className="h-4 w-4" aria-hidden="true" />
                            Joined
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                    activeTab === 'joined'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                            >
                                {counts.joined}
                            </span>
                        </button>
                    </div>

                    {/* Search */}
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
                                placeholder="Search your communities..."
                                aria-label="Search your communities"
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isNavigating}
                            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isNavigating ? (
                                <LoaderCircle
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Search
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            )}
                            Search
                        </button>
                    </form>

                    {/* Result count and clear search */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {communities.total}{' '}
                            {communities.total === 1
                                ? 'community'
                                : 'communities'}{' '}
                            {activeTab === 'owned' ? 'owned' : 'joined'}
                        </p>

                        {filters.search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                disabled={isNavigating}
                                className="text-sm font-medium text-purple-700 hover:underline disabled:opacity-50 dark:text-purple-400"
                            >
                                Clear search
                            </button>
                        )}
                    </div>

                    {/* Community cards */}
                    {hasCommunities ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {communities.data.map((community) => {
                                const isLeaving =
                                    busyAction === `leave-${community.id}`;

                                return (
                                    <article
                                        key={community.id}
                                        className="flex min-h-72 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                                    >
                                        {/* Community image */}
                                        <div className="flex h-36 items-center justify-center overflow-hidden bg-purple-100 dark:bg-purple-950">
                                            <CommunityImage
                                                community={community}
                                            />
                                        </div>

                                        <div className="flex flex-1 flex-col p-5">
                                            {/* Name and badges */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h2 className="break-words font-semibold text-gray-900 dark:text-white">
                                                        {community.name}
                                                    </h2>

                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {activeTab === 'owned'
                                                            ? 'Created by you'
                                                            : 'You are a member'}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 flex-col items-end gap-2">
                                                    {community.category && (
                                                        <span className="max-w-32 truncate rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                            {community.category}
                                                        </span>
                                                    )}

                                                    <VisibilityBadge
                                                        visibility={
                                                            community.visibility
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="mt-4 flex-1 break-words whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                                                {community.description?.trim() ||
                                                    'No description has been added yet.'}
                                            </p>

                                            {/* Member count */}
                                            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                                                <Users
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />

                                                <span>
                                                    {community.members_count}{' '}
                                                    {community.members_count ===
                                                    1
                                                        ? 'member'
                                                        : 'members'}
                                                </span>
                                            </div>

                                            {/* Context-specific action */}
                                            <div className="mt-4">
                                                {activeTab === 'owned' ? (
                                                    <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                                                        <Crown
                                                            className="h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                        Community Owner
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            leaveCommunity(
                                                                community,
                                                            )
                                                        }
                                                        disabled={
                                                            busyAction !== null
                                                        }
                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
                                                    >
                                                        {isLeaving ? (
                                                            <LoaderCircle
                                                                className="h-4 w-4 animate-spin"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <X
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}

                                                        {isLeaving
                                                            ? 'Leaving...'
                                                            : 'Leave Community'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                activeTab === 'owned' ? (
                                    <Crown
                                        className="h-7 w-7"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Users
                                        className="h-7 w-7"
                                        aria-hidden="true"
                                    />
                                )
                            }
                            title={
                                filters.search
                                    ? 'No matching communities'
                                    : activeTab === 'owned'
                                      ? 'You have not created a community yet'
                                      : 'You have not joined any communities yet'
                            }
                            description={
                                filters.search
                                    ? 'Try another search term or clear your search to see all your communities.'
                                    : activeTab === 'owned'
                                      ? 'Create a community to bring people together around a shared interest.'
                                      : 'Explore communities and find people who share your interests.'
                            }
                            action={
                                filters.search ? (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        disabled={isNavigating}
                                        className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-60"
                                    >
                                        <X
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Clear search
                                    </button>
                                ) : (
                                    <a
                                        href="/communities"
                                        className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
                                    >
                                        <Plus
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Discover Communities
                                    </a>
                                )
                            }
                        />
                    )}

                    {/* Community pagination */}
                    {communities.last_page > 1 && (
                        <Pagination
                            links={communities.links}
                            onNavigate={navigateToPage}
                        />
                    )}

                    {/* Pending join requests - owned tab only */}
                    {activeTab === 'owned' && (
                        <section className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-800">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Pending Join Requests
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Review people who want to join your
                                        communities.
                                    </p>
                                </div>

                                {(pendingRequests?.total ?? 0) > 0 && (
                                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        <Clock
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                        {pendingRequests?.total} pending
                                    </span>
                                )}
                            </div>

                            {hasPendingRequests && pendingRequests ? (
                                <div className="space-y-3">
                                    {pendingRequests.data.map((request) => {
                                        const community =
                                            request.community;

                                        const isApproving =
                                            busyAction ===
                                            `request-${request.id}-approve`;

                                        const isRejecting =
                                            busyAction ===
                                            `request-${request.id}-reject`;

                                        const isBusy =
                                            isApproving || isRejecting;

                                        return (
                                            <article
                                                key={request.id}
                                                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                        <Users
                                                            className="h-5 w-5"
                                                            aria-hidden="true"
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                                                            @
                                                            {request.requester_username}
                                                        </p>

                                                        <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                                                            Wants to join{' '}
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                                {community?.name ??
                                                                    'Unavailable community'}
                                                            </span>
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                            Requested{' '}
                                                            {formatDate(
                                                                request.created_at,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 gap-2 sm:justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleJoinRequest(
                                                                request,
                                                                'approve',
                                                            )
                                                        }
                                                        disabled={
                                                            busyAction !==
                                                                null ||
                                                            !community
                                                        }
                                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                                                    >
                                                        {isApproving ? (
                                                            <LoaderCircle
                                                                className="h-4 w-4 animate-spin"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <Check
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}

                                                        {isApproving
                                                            ? 'Approving...'
                                                            : 'Approve'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleJoinRequest(
                                                                request,
                                                                'reject',
                                                            )
                                                        }
                                                        disabled={
                                                            busyAction !==
                                                                null ||
                                                            !community
                                                        }
                                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-none"
                                                    >
                                                        {isRejecting ? (
                                                            <LoaderCircle
                                                                className="h-4 w-4 animate-spin"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <X
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}

                                                        {isRejecting
                                                            ? 'Rejecting...'
                                                            : 'Reject'}
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center dark:border-gray-700 dark:bg-gray-900">
                                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        <Check
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                                        No pending requests
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        New membership requests for your
                                        communities will appear here.
                                    </p>
                                </div>
                            )}

                            {pendingRequests &&
                                pendingRequests.last_page > 1 && (
                                    <Pagination
                                        links={pendingRequests.links}
                                        onNavigate={navigateToPage}
                                    />
                                )}
                        </section>
                    )}
                </div>
            </main>
        </>
    );
}