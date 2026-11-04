
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { toast } from 'sonner';
import {
    Compass,
    Search,
    Image as ImageIcon,
    LockKeyhole,
    Globe2,
    Plus,
    Users,
    X,
    ImagePlus,
    Check,
    UserRound,
    Clock,
} from 'lucide-react';

type CommunityMember = {
    id: number;
    username: string;
};

type PendingJoinRequest = {
    id: number;
    user_id: number;
    username: string;
    created_at: string | null;
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
    is_owner: boolean;
    visibility: 'public' | 'private';
    join_request_status: 'pending' | 'approved' | 'rejected' | null;
    pending_join_requests_count: number;
    pending_join_requests: PendingJoinRequest[];
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

type SharedProps = {
    [key: string]: unknown;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export default function CommunitiesIndex({
    communities,
    filters,
    categories,
}: CommunitiesPageProps) {
    const { flash } = usePage<SharedProps>().props;

    const [search, setSearch] = useState(filters.search);
    const [category, setCategory] = useState(filters.category);
    const [busyCommunityId, setBusyCommunityId] = useState<number | null>(
        null,
    );
    const [busyRequestId, setBusyRequestId] = useState<number | null>(null);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedCommunityId, setSelectedCommunityId] = useState<
        number | null
    >(null);

    const selectedCommunity =
        communities.data.find(
            (community) => community.id === selectedCommunityId,
        ) ?? null;

    const createForm = useForm<{
        name: string;
        description: string;
        category: string;
        category_mode: 'existing' | 'new';
        visibility: 'public' | 'private';
        image: File | null;
    }>({
        name: '',
        description: '',
        category: '',
        category_mode: 'existing',
        visibility: 'public',
        image: null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState('');

    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
        [categories],
    );

    const filteredCategories = useMemo(() => {
        const query = categorySearch.trim().toLocaleLowerCase();

        if (!query) {
            return sortedCategories;
        }

        return sortedCategories.filter((item) =>
            item.toLocaleLowerCase().includes(query),
        );
    }, [categorySearch, sortedCategories]);

    // Display server flash messages after Inertia navigation.
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    // Manage the selected image preview and release its object URL.
    useEffect(() => {
        if (!createForm.data.image) {
            setImagePreview(null);
            return;
        }

        const previewUrl = URL.createObjectURL(createForm.data.image);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [createForm.data.image]);

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

    function submitCreateCommunity(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        createForm.post('/communities', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
            },
            onError: () => {
                toast.error(
                    'Please review the form and correct the highlighted errors.',
                );
            },
        });
    }

    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        createForm.setData('image', file);
    }

    function closeCreateModal() {
        if (createForm.processing) {
            return;
        }

        setCreateModalOpen(false);
        createForm.reset();
        createForm.clearErrors();
    }

    function toggleMembership(community: CommunityItem) {
        if (
            busyCommunityId !== null ||
            community.is_owner ||
            community.join_request_status === 'pending'
        ) {
            return;
        }

        setBusyCommunityId(community.id);

        const options = {
            preserveScroll: true,
            onError: () => {
                toast.error('Unable to update your community membership.');
            },
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

    function handleJoinRequest(
        community: CommunityItem,
        request: PendingJoinRequest,
        action: 'approve' | 'reject',
    ) {
        if (busyRequestId !== null || !community.is_owner) {
            return;
        }

        setBusyRequestId(request.id);

        router.patch(
            `/communities/${community.slug}/join-requests/${request.id}/${action}`,
            {},
            {
                preserveScroll: true,
                onError: () => {
                    toast.error(
                        `Unable to ${action} this membership request. It may have already been processed.`,
                    );
                },
                onFinish: () => setBusyRequestId(null),
            },
        );
    }

    function getInitial(username: string) {
        return username.charAt(0).toUpperCase();
    }

    function getMembershipLabel(community: CommunityItem) {
        if (community.is_owner) {
            return 'Owner';
        }

        if (community.is_member) {
            return 'Leave';
        }

        if (community.join_request_status === 'pending') {
            return 'Request Pending';
        }

        return community.visibility === 'private'
            ? 'Request to Join'
            : 'Join';
    }

    return (
        <>
            <Head title="Discover Communities" />

            <main className="min-h-screen bg-gray-100 dark:bg-gray-950">
                <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
                    {/* Page heading */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Discover Communities
                            </h1>

                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Find communities, meet people, and join
                                conversations that interest you.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                        >
                            <Plus className="h-4 w-4" />
                            Create Community
                        </button>
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

                                const isPending =
                                    community.join_request_status ===
                                    'pending';

                                const isActionDisabled =
                                    busyCommunityId !== null ||
                                    community.is_owner ||
                                    isPending;

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

                                                <div className="flex shrink-0 flex-col items-end gap-2">
                                                    {community.category && (
                                                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                            {community.category}
                                                        </span>
                                                    )}

                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            community.visibility ===
                                                            'private'
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                                : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                                                        }`}
                                                    >
                                                        {community.visibility ===
                                                        'private' ? (
                                                            <LockKeyhole className="h-3 w-3" />
                                                        ) : (
                                                            <Globe2 className="h-3 w-3" />
                                                        )}

                                                        {community.visibility ===
                                                        'private'
                                                            ? 'Private'
                                                            : 'Public'}
                                                    </span>
                                                </div>
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
                                                        <Users className="mr-1 inline h-3.5 w-3.5" />
                                                        {community.members_count}{' '}
                                                        {community.members_count ===
                                                        1
                                                            ? 'member'
                                                            : 'members'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Membership and owner actions */}
                                            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                                                {community.is_owner && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedCommunityId(
                                                                community.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
                                                    >
                                                        <Users className="h-4 w-4" />
                                                        Manage Requests
                                                        {community.pending_join_requests_count >
                                                            0 && (
                                                            <span className="rounded-full bg-purple-700 px-2 py-0.5 text-xs text-white">
                                                                {
                                                                    community.pending_join_requests_count
                                                                }
                                                            </span>
                                                        )}
                                                    </button>
                                                )}

                                                {community.is_owner ? (
                                                    <span className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                        Owner
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleMembership(
                                                                community,
                                                            )
                                                        }
                                                        disabled={
                                                            isActionDisabled
                                                        }
                                                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            community.is_member
                                                                ? 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
                                                                : isPending
                                                                  ? 'border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                                  : 'bg-purple-700 text-white hover:bg-purple-800'
                                                        }`}
                                                    >
                                                        {isBusy
                                                            ? 'Please wait...'
                                                            : getMembershipLabel(
                                                                  community,
                                                              )}
                                                    </button>
                                                )}
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

            {/* Create Community Modal */}
            {createModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeCreateModal();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-community-title"
                        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-7">
                            <div>
                                <h2
                                    id="create-community-title"
                                    className="text-xl font-bold text-gray-900 dark:text-white"
                                >
                                    Create a Community
                                </h2>

                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Build a space for people to connect.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeCreateModal}
                                disabled={createForm.processing}
                                aria-label="Close create community modal"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={submitCreateCommunity}
                            className="space-y-5 p-5 sm:p-7"
                        >
                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="community-name"
                                    className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                >
                                    Community name
                                </label>

                                <input
                                    id="community-name"
                                    type="text"
                                    value={createForm.data.name}
                                    onChange={(event) =>
                                        createForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={80}
                                    required
                                    placeholder="e.g. LGBTQIA+ Artists"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                />

                                {createForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label
                                    htmlFor="community-description"
                                    className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="community-description"
                                    value={createForm.data.description}
                                    onChange={(event) =>
                                        createForm.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={1000}
                                    rows={3}
                                    placeholder="What is this community about?"
                                    className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                />

                                <div className="mt-1 flex justify-between gap-2">
                                    {createForm.errors.description ? (
                                        <p className="text-sm text-red-600">
                                            {createForm.errors.description}
                                        </p>
                                    ) : (
                                        <span />
                                    )}

                                    <span className="text-xs text-gray-400">
                                        {
                                            createForm.data.description
                                                .length
                                        }
                                        /1000
                                    </span>
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label
                                    htmlFor={
                                        createForm.data.category_mode === 'new'
                                            ? 'community-new-category'
                                            : 'community-category-search'
                                    }
                                    className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                >
                                    Category
                                </label>

                                {createForm.data.category_mode === 'existing' ? (
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                createForm.setData((data) => ({
                                                    ...data,
                                                    category: '',
                                                    category_mode: 'new',
                                                }));
                                                setCategorySearch('');
                                                createForm.clearErrors('category');
                                            }}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-purple-400 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700 transition hover:border-purple-600 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:border-purple-700 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/60"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create a new category
                                        </button>

                                        <div className="relative">
                                            <Search
                                                aria-hidden="true"
                                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                id="community-category-search"
                                                type="search"
                                                value={categorySearch}
                                                onChange={(event) =>
                                                    setCategorySearch(event.target.value)
                                                }
                                                placeholder="Search existing categories..."
                                                autoComplete="off"
                                                aria-label="Search existing categories"
                                                aria-describedby="community-category-help"
                                                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                            />
                                        </div>

                                        <div
                                            className="max-h-52 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-950"
                                            aria-label="Available categories"
                                        >
                                            {filteredCategories.length > 0 ? (
                                                <div className="space-y-1">
                                                    {filteredCategories.map((item) => {
                                                        const isSelected = createForm.data.category === item;

                                                        return (
                                                            <button
                                                                key={item}
                                                                type="button"
                                                                aria-pressed={isSelected}
                                                                onClick={() => {
                                                                    createForm.setData('category', item);
                                                                    createForm.clearErrors('category');
                                                                }}
                                                                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 ${
                                                                    isSelected
                                                                        ? 'bg-purple-100 font-semibold text-purple-800 dark:bg-purple-950 dark:text-purple-200'
                                                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                                                                }`}
                                                            >
                                                                <span className="min-w-0 break-words">{item}</span>
                                                                {isSelected && (
                                                                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-6 text-center">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                        No categories found
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        Try another search or create a new category.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>
                                                {filteredCategories.length} of {sortedCategories.length} categories
                                            </span>
                                            {categorySearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCategorySearch('')}
                                                    className="font-medium text-purple-700 hover:underline dark:text-purple-400"
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>

                                        {createForm.data.category && (
                                            <div className="flex items-center justify-between gap-3 rounded-lg bg-green-50 px-3 py-2 text-sm dark:bg-green-950/30">
                                                <span className="min-w-0 text-green-800 dark:text-green-300">
                                                    Selected: <strong className="break-words">{createForm.data.category}</strong>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => createForm.setData('category', '')}
                                                    className="shrink-0 text-xs font-semibold text-green-800 hover:underline dark:text-green-300"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            id="community-new-category"
                                            type="text"
                                            value={createForm.data.category}
                                            onChange={(event) => {
                                                createForm.setData(
                                                    'category',
                                                    event.target.value,
                                                );
                                                createForm.clearErrors('category');
                                            }}
                                            maxLength={50}
                                            required
                                            autoFocus
                                            placeholder="Enter a new category"
                                            autoComplete="off"
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    createForm.setData((data) => ({
                                                        ...data,
                                                        category: '',
                                                        category_mode: 'existing',
                                                    }));
                                                    setCategorySearch('');
                                                    createForm.clearErrors('category');
                                                }}
                                                className="text-sm font-semibold text-purple-700 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                                            >
                                                ← Choose an existing category
                                            </button>
                                            <span className="text-xs text-gray-400">
                                                {createForm.data.category.length}/50
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <p
                                    id="community-category-help"
                                    className="mt-2 text-xs text-gray-500 dark:text-gray-400"
                                >
                                    {createForm.data.category_mode === 'new'
                                        ? 'New categories must not already exist. They will become available to everyone after your community is created.'
                                        : 'Search and select an existing category, or create a new one. Categories are listed alphabetically.'}
                                </p>

                                {createForm.errors.category && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.category}
                                    </p>
                                )}
                            </div>

                            {/* Visibility */}
                            <fieldset>
                                <legend className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Community visibility
                                </legend>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label
                                        className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                                            createForm.data.visibility ===
                                            'public'
                                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600 dark:bg-purple-950/30'
                                                : 'border-gray-200 hover:border-gray-400 dark:border-gray-700'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="public"
                                            checked={
                                                createForm.data.visibility ===
                                                'public'
                                            }
                                            onChange={() =>
                                                createForm.setData(
                                                    'visibility',
                                                    'public',
                                                )
                                            }
                                            className="mt-1 accent-purple-700"
                                        />

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Globe2 className="h-5 w-5 text-purple-700 dark:text-purple-400" />
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Public
                                                </span>
                                            </div>

                                            <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                                Anyone can discover, view, and
                                                join this community.
                                            </p>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                                            createForm.data.visibility ===
                                            'private'
                                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600 dark:bg-purple-950/30'
                                                : 'border-gray-200 hover:border-gray-400 dark:border-gray-700'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="private"
                                            checked={
                                                createForm.data.visibility ===
                                                'private'
                                            }
                                            onChange={() =>
                                                createForm.setData(
                                                    'visibility',
                                                    'private',
                                                )
                                            }
                                            className="mt-1 accent-purple-700"
                                        />

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <LockKeyhole className="h-5 w-5 text-purple-700 dark:text-purple-400" />
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Private
                                                </span>
                                            </div>

                                            <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                                People can discover it, but
                                                only approved members can
                                                view posts.
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {createForm.errors.visibility && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.visibility}
                                    </p>
                                )}
                            </fieldset>

                            {/* Image */}
                            <div>
                                <label
                                    htmlFor="community-image"
                                    className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                >
                                    Community image{' '}
                                    <span className="font-normal text-gray-400">
                                        (Optional)
                                    </span>
                                </label>

                                {imagePreview ? (
                                    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                        <img
                                            src={imagePreview}
                                            alt="Community image preview"
                                            className="h-44 w-full object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                createForm.setData(
                                                    'image',
                                                    null,
                                                )
                                            }
                                            aria-label="Remove selected image"
                                            className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="community-image"
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-7 text-center transition hover:border-purple-500 hover:bg-purple-50 dark:border-gray-700 dark:hover:bg-purple-950/20"
                                    >
                                        <ImagePlus className="mb-2 h-7 w-7 text-gray-400" />

                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Choose an image
                                        </span>

                                        <span className="mt-1 text-xs text-gray-500">
                                            JPG, PNG, or WEBP · Maximum 5 MB
                                        </span>
                                    </label>
                                )}

                                <input
                                    id="community-image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="sr-only"
                                />

                                {createForm.errors.image && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.image}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={createForm.processing}
                                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {createForm.processing
                                        ? 'Creating...'
                                        : 'Create Community'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* Manage Join Requests Modal */}
            {selectedCommunity && selectedCommunity.is_owner && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedCommunityId(null);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="manage-requests-title"
                        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
                            <div className="min-w-0">
                                <h2
                                    id="manage-requests-title"
                                    className="text-lg font-bold text-gray-900 dark:text-white"
                                >
                                    Join Requests
                                </h2>

                                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                    {selectedCommunity.name}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedCommunityId(null)
                                }
                                aria-label="Close join requests"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-5">
                            {selectedCommunity.pending_join_requests.length >
                            0 ? (
                                <div className="space-y-3">
                                    {selectedCommunity.pending_join_requests.map(
                                        (request) => {
                                            const isBusy =
                                                busyRequestId === request.id;

                                            return (
                                                <div
                                                    key={request.id}
                                                    className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                            <UserRound className="h-5 w-5" />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                                @
                                                                {
                                                                    request.username
                                                                }
                                                            </p>

                                                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                <Clock className="h-3 w-3" />
                                                                Waiting for
                                                                approval
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                busyRequestId !==
                                                                null
                                                            }
                                                            onClick={() =>
                                                                handleJoinRequest(
                                                                    selectedCommunity,
                                                                    request,
                                                                    'reject',
                                                                )
                                                            }
                                                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                                        >
                                                            {isBusy
                                                                ? 'Please wait...'
                                                                : 'Reject'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                busyRequestId !==
                                                                null
                                                            }
                                                            onClick={() =>
                                                                handleJoinRequest(
                                                                    selectedCommunity,
                                                                    request,
                                                                    'approve',
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-800 disabled:opacity-50"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <Users className="mx-auto h-10 w-10 text-gray-400" />

                                    <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
                                        No pending requests
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        New membership requests will appear
                                        here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
