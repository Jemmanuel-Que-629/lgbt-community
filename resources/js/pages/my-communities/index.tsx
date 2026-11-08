import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    AlertTriangle,
    Check,
    Clock,
    Crown,
    FolderHeart,
    Globe2,
    Image as ImageIcon,
    LoaderCircle,
    LockKeyhole,
    Pencil,
    Search,
    Save,
    Trash2,
    Users,
    X,
    ArrowRight,
    ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'owned' | 'joined' | 'requests';

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
    status: 'pending';
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
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type MyCommunitiesPageProps = {
    communities: PaginatedData<Community> | null;
    pendingRequests: PaginatedData<JoinRequest> | null;
    counts: {
        owned: number;
        joined: number;
        pendingRequests: number;
    };
    filters: {
        tab: Tab;
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

type EditErrors = Record<string, string>;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
    name,
    imageUrl,
}: {
    name: string;
    imageUrl: string | null;
}) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [imageUrl]);

    if (imageUrl && !imageFailed) {
        return (
            <img
                src={imageUrl}
                alt={`${name} community`}
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
    disabled,
}: {
    links: PaginationLink[];
    onNavigate: (url: string) => void;
    disabled: boolean;
}) {
    if (links.length <= 3) {
        return null;
    }

    function readableLabel(label: string) {
        return label
            .replace(/&laquo;/g, '«')
            .replace(/&raquo;/g, '»')
            .replace(/&amp;/g, '&')
            .replace(/&hellip;/g, '…');
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
                    disabled={disabled || !link.url || link.active}
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

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            {message}
        </p>
    );
}

export default function MyCommunitiesIndex({
    communities,
    pendingRequests,
    counts,
    filters,
}: MyCommunitiesPageProps) {
    const { flash } = usePage<SharedProps>().props;

    const activeTab: Tab = filters.tab ?? 'owned';

    const [search, setSearch] = useState(filters.search ?? '');
    const [isNavigating, setIsNavigating] = useState(false);
    const [busyAction, setBusyAction] = useState<string | null>(null);

    // Edit modal state
    const [editingCommunity, setEditingCommunity] =
        useState<Community | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editVisibility, setEditVisibility] = useState<
        'public' | 'private'
    >('public');
    const [editImage, setEditImage] = useState<File | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editErrors, setEditErrors] = useState<EditErrors>({});

    // Delete confirmation state
    const [deletingCommunity, setDeletingCommunity] =
        useState<Community | null>(null);

    const isSaving = busyAction === 'edit';
    const isDeleting = busyAction?.startsWith('delete-') ?? false;

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

    // Create and clean up temporary image previews.
    useEffect(() => {
        if (editImage) {
            const objectUrl = URL.createObjectURL(editImage);
            setImagePreview(objectUrl);

            return () => URL.revokeObjectURL(objectUrl);
        }

        if (editingCommunity && !removeExistingImage) {
            setImagePreview(editingCommunity.image_url);
            return;
        }

        setImagePreview(null);
    }, [editImage, editingCommunity, removeExistingImage]);

    // Close open modals with Escape.
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || busyAction !== null) {
                return;
            }

            setEditingCommunity(null);
            setDeletingCommunity(null);
        };

        window.addEventListener('keydown', handleEscape);

        return () => window.removeEventListener('keydown', handleEscape);
    }, [busyAction]);

    function navigateToTab(tab: Tab) {
        if (isNavigating || tab === activeTab || busyAction !== null) {
            return;
        }

        setIsNavigating(true);

        router.get(
            '/my-communities',
            {
                tab,
                search: tab === 'requests' ? undefined : search.trim() || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsNavigating(false),
                onError: () => {
                    toast.error('Unable to load this section.');
                },
            },
        );
    }

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isNavigating || activeTab === 'requests' || busyAction !== null) {
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
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsNavigating(false),
                onError: () => {
                    toast.error('Unable to search your communities.');
                },
            },
        );
    }

    function clearSearch() {
        if (isNavigating || busyAction !== null) {
            return;
        }

        setSearch('');
        setIsNavigating(true);

        router.get(
            '/my-communities',
            { tab: activeTab },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsNavigating(false),
                onError: () => {
                    toast.error('Unable to clear the search.');
                },
            },
        );
    }

    function navigateToPage(url: string) {
        if (isNavigating || busyAction !== null) {
            return;
        }

        setIsNavigating(true);

        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
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

        if (
            !window.confirm(
                `Are you sure you want to leave "${community.name}"?`,
            )
        ) {
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

    function openEditModal(community: Community) {
        if (busyAction !== null) {
            return;
        }

        setEditingCommunity(community);
        setEditName(community.name);
        setEditDescription(community.description ?? '');
        setEditCategory(community.category ?? '');
        setEditVisibility(community.visibility);
        setEditImage(null);
        setRemoveExistingImage(false);
        setEditErrors({});
    }

    function closeEditModal() {
        if (isSaving) {
            return;
        }

        setEditingCommunity(null);
        setEditImage(null);
        setRemoveExistingImage(false);
        setImagePreview(null);
        setEditErrors({});
    }

    function handleImageSelection(file: File | null) {
        setEditErrors((current) => ({
            ...current,
            image: '',
        }));

        if (!file) {
            setEditImage(null);
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            setEditErrors((current) => ({
                ...current,
                image: 'Choose a JPG, PNG, or WebP image.',
            }));
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setEditErrors((current) => ({
                ...current,
                image: 'The image must not exceed 5 MB.',
            }));
            return;
        }

        setEditImage(file);
        setRemoveExistingImage(false);
    }

    function submitEdit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editingCommunity || busyAction !== null) {
            return;
        }

        const trimmedName = editName.trim();

        if (trimmedName.length < 3 || trimmedName.length > 100) {
            setEditErrors({
                name: 'The community name must be between 3 and 100 characters.',
            });
            return;
        }

        if (editDescription.length > 2000) {
            setEditErrors({
                description: 'The description must not exceed 2,000 characters.',
            });
            return;
        }

        setEditErrors({});
        setBusyAction('edit');

        router.post(
            `/communities/${editingCommunity.slug}`,
            {
                _method: 'PATCH',
                name: trimmedName,
                description: editDescription.trim(),
                category: editCategory.trim(),
                visibility: editVisibility,
                image: editImage,
                remove_image: removeExistingImage,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setEditingCommunity(null);
                    setEditImage(null);
                    setRemoveExistingImage(false);
                    setImagePreview(null);
                    setEditErrors({});
                },
                onError: (errors) => {
                    setEditErrors(errors as EditErrors);
                    toast.error(
                        'Please check the form for errors before saving.',
                    );
                },
                onFinish: () => setBusyAction(null),
            },
        );
    }

    function confirmDeleteCommunity() {
        if (!deletingCommunity || busyAction !== null) {
            return;
        }

        const community = deletingCommunity;
        setBusyAction(`delete-${community.id}`);

        router.delete(`/communities/${community.slug}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingCommunity(null);
            },
            onError: () => {
                toast.error(
                    'Unable to delete this community. Please try again.',
                );
            },
            onFinish: () => setBusyAction(null),
        });
    }

    const communityData = communities?.data ?? [];
    const requestData = pendingRequests?.data ?? [];

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
                                    Manage your communities and membership
                                    requests.
                                </p>
                            </div>
                        </div>
                    </header>
                    

                    {/* Three tabs */}
                    <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-800">
                        <div
                            className="flex min-w-max gap-2"
                            role="tablist"
                            aria-label="My community sections"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'owned'}
                                onClick={() => navigateToTab('owned')}
                                disabled={isNavigating || busyAction !== null}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    activeTab === 'owned'
                                        ? 'border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <Crown
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Owned

                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    {counts.owned}
                                </span>
                            </button>

                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'joined'}
                                onClick={() => navigateToTab('joined')}
                                disabled={isNavigating || busyAction !== null}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    activeTab === 'joined'
                                        ? 'border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <Users
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Joined

                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    {counts.joined}
                                </span>
                            </button>

                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'requests'}
                                onClick={() => navigateToTab('requests')}
                                disabled={isNavigating || busyAction !== null}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    activeTab === 'requests'
                                        ? 'border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <Clock
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Pending Requests

                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        counts.pendingRequests > 0
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                >
                                    {counts.pendingRequests}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Owned / Joined content */}
                    {activeTab !== 'requests' && (
                        <>
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
                                    disabled={isNavigating || busyAction !== null}
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

                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {communities?.total ?? 0}{' '}
                                    {(communities?.total ?? 0) === 1
                                        ? 'community'
                                        : 'communities'}{' '}
                                    {activeTab === 'owned'
                                        ? 'owned'
                                        : 'joined'}
                                </p>

                                {filters.search && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        disabled={isNavigating || busyAction !== null}
                                        className="text-sm font-medium text-purple-700 hover:underline disabled:opacity-50 dark:text-purple-400"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>

                            {communityData.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {communityData.map((community) => {
                                        const isLeaving =
                                            busyAction ===
                                            `leave-${community.id}`;

                                        const isDeletingThisCommunity =
                                            busyAction ===
                                            `delete-${community.id}`;

                                        return (
                                            <article
                                                key={community.id}
                                                className="flex min-h-72 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                                            >
                                                <div className="flex h-36 items-center justify-center overflow-hidden bg-purple-100 dark:bg-purple-950">
                                                    <CommunityImage
                                                        name={community.name}
                                                        imageUrl={
                                                            community.image_url
                                                        }
                                                    />
                                                </div>

                                                <div className="flex flex-1 flex-col p-5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h2 className="break-words font-semibold text-gray-900 dark:text-white">
                                                                {community.name}
                                                            </h2>

                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                {activeTab ===
                                                                'owned'
                                                                    ? 'Created by you'
                                                                    : 'You are a member'}
                                                            </p>
                                                        </div>

                                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                                            {community.category && (
                                                                <span className="max-w-32 truncate rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                                    {
                                                                        community.category
                                                                    }
                                                                </span>
                                                            )}

                                                            <VisibilityBadge
                                                                visibility={
                                                                    community.visibility
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <p className="mt-4 flex-1 break-words whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                                                        {community.description?.trim() ||
                                                            'No description has been added yet.'}
                                                    </p>

                                                    <Link
                                                        href={`/communities/${community.slug}`}
                                                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 hover:underline dark:text-indigo-400"
                                                    >
                                                        View Community
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Link>

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

                                                    <div className="mt-4">
                                                        {activeTab ===
                                                        'owned' ? (
                                                            <div className="space-y-2">
                                                                <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                                                                    <Crown
                                                                        className="h-4 w-4"
                                                                        aria-hidden="true"
                                                                    />
                                                                    Community Owner
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openEditModal(
                                                                                community,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            busyAction !==
                                                                            null
                                                                        }
                                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-purple-800 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
                                                                    >
                                                                        <Pencil
                                                                            className="h-4 w-4"
                                                                            aria-hidden="true"
                                                                        />
                                                                        Edit
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setDeletingCommunity(
                                                                                community,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            busyAction !==
                                                                            null
                                                                        }
                                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
                                                                    >
                                                                        {isDeletingThisCommunity ? (
                                                                            <LoaderCircle
                                                                                className="h-4 w-4 animate-spin"
                                                                                aria-hidden="true"
                                                                            />
                                                                        ) : (
                                                                            <Trash2
                                                                                className="h-4 w-4"
                                                                                aria-hidden="true"
                                                                            />
                                                                        )}
                                                                        Delete
                                                                    </button>
                                                                </div>
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
                                                                    busyAction !==
                                                                    null
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
                                                disabled={isNavigating || busyAction !== null}
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
                                                <Users
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                                Discover Communities
                                            </a>
                                        )
                                    }
                                />
                            )}

                            {communities && communities.last_page > 1 && (
                                <Pagination
                                    links={communities.links}
                                    onNavigate={navigateToPage}
                                    disabled={isNavigating || busyAction !== null}
                                />
                            )}
                        </>
                    )}

                    {/* Pending Requests tab */}
                    {activeTab === 'requests' && (
                        <section className="space-y-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Membership Requests
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Review people requesting to join
                                        communities you own.
                                    </p>
                                </div>

                                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    <Clock
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                    {counts.pendingRequests}{' '}
                                    {counts.pendingRequests === 1
                                        ? 'pending request'
                                        : 'pending requests'}
                                </span>
                            </div>

                            {requestData.length > 0 ? (
                                <div className="space-y-3">
                                    {requestData.map((request) => {
                                        const community = request.community;

                                        const isApproving =
                                            busyAction ===
                                            `request-${request.id}-approve`;

                                        const isRejecting =
                                            busyAction ===
                                            `request-${request.id}-reject`;

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
                                <EmptyState
                                    icon={
                                        <Check
                                            className="h-7 w-7"
                                            aria-hidden="true"
                                        />
                                    }
                                    title="No pending requests"
                                    description="You're all caught up. New membership requests for your communities will appear here."
                                />
                            )}

                            {pendingRequests &&
                                pendingRequests.last_page > 1 && (
                                    <Pagination
                                        links={pendingRequests.links}
                                        onNavigate={navigateToPage}
                                        disabled={isNavigating || busyAction !== null}
                                    />
                                )}
                        </section>
                    )}
                </div>
            </main>

            {/* Edit Community Modal */}
            {editingCommunity && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeEditModal();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-community-title"
                        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
                            <div>
                                <h2
                                    id="edit-community-title"
                                    className="text-lg font-bold text-gray-900 dark:text-white"
                                >
                                    Edit Community
                                </h2>

                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Update your community information and
                                    settings.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEditModal}
                                disabled={isSaving}
                                aria-label="Close edit community dialog"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        <form onSubmit={submitEdit}>
                            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                                <div>
                                    <label
                                        htmlFor="edit-community-name"
                                        className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                    >
                                        Community name
                                    </label>

                                    <input
                                        id="edit-community-name"
                                        type="text"
                                        value={editName}
                                        onChange={(event) =>
                                            setEditName(event.target.value)
                                        }
                                        minLength={3}
                                        maxLength={100}
                                        required
                                        disabled={isSaving}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                    />

                                    <FieldError message={editErrors.name} />
                                </div>

                                <div>
                                    <label
                                        htmlFor="edit-community-description"
                                        className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                    >
                                        Description
                                    </label>

                                    <textarea
                                        id="edit-community-description"
                                        value={editDescription}
                                        onChange={(event) =>
                                            setEditDescription(
                                                event.target.value,
                                            )
                                        }
                                        maxLength={2000}
                                        rows={4}
                                        disabled={isSaving}
                                        placeholder="What is this community about?"
                                        className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                    />

                                    <div className="mt-1 flex items-center justify-between gap-2">
                                        <FieldError
                                            message={editErrors.description}
                                        />

                                        <span className="ml-auto shrink-0 text-xs text-gray-400">
                                            {editDescription.length}/2000
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="edit-community-category"
                                        className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                    >
                                        Category
                                    </label>

                                    <input
                                        id="edit-community-category"
                                        type="text"
                                        value={editCategory}
                                        onChange={(event) =>
                                            setEditCategory(event.target.value)
                                        }
                                        maxLength={50}
                                        disabled={isSaving}
                                        placeholder="e.g. Support, Art, Gaming"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                    />

                                    <FieldError message={editErrors.category} />
                                </div>

                                <div>
                                    <label
                                        htmlFor="edit-community-visibility"
                                        className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                    >
                                        Visibility
                                    </label>

                                    <select
                                        id="edit-community-visibility"
                                        value={editVisibility}
                                        onChange={(event) =>
                                            setEditVisibility(
                                                event.target.value as
                                                    | 'public'
                                                    | 'private',
                                            )
                                        }
                                        disabled={isSaving}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                    >
                                        <option value="public">
                                            Public — Anyone can discover this
                                            community
                                        </option>
                                        <option value="private">
                                            Private — Membership requires
                                            approval
                                        </option>
                                    </select>

                                    <FieldError
                                        message={editErrors.visibility}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        Community cover image
                                    </label>

                                    {imagePreview ? (
                                        <div className="relative mb-3 h-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-950">
                                            <img
                                                src={imagePreview}
                                                alt="Community cover preview"
                                                className="h-full w-full object-cover"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditImage(null);
                                                    setRemoveExistingImage(
                                                        true,
                                                    );
                                                }}
                                                disabled={isSaving}
                                                className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                            >
                                                <X
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden="true"
                                                />
                                                Remove image
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mb-3 flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
                                            <ImageIcon
                                                className="h-7 w-7"
                                                aria-hidden="true"
                                            />
                                            <span className="text-xs">
                                                No cover image selected
                                            </span>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        disabled={isSaving}
                                        onChange={(event) => {
                                            handleImageSelection(
                                                event.target.files?.[0] ?? null,
                                            );
                                            event.target.value = '';
                                        }}
                                        className="block w-full cursor-pointer rounded-xl border border-gray-300 bg-white text-sm text-gray-700 file:mr-3 file:cursor-pointer file:border-0 file:bg-purple-50 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:file:bg-purple-950 dark:file:text-purple-300"
                                    />

                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        JPG, PNG, or WebP. Maximum file size:
                                        5 MB.
                                    </p>

                                    <FieldError message={editErrors.image} />
                                </div>

                                {editErrors.remove_image && (
                                    <FieldError
                                        message={editErrors.remove_image}
                                    />
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/50 sm:flex-row sm:justify-end sm:px-6">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    disabled={isSaving}
                                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? (
                                        <LoaderCircle
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Save
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    )}

                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* Permanent Delete Confirmation Modal */}
            {deletingCommunity && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isDeleting) {
                            setDeletingCommunity(null);
                        }
                    }}
                >
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-community-title"
                        aria-describedby="delete-community-description"
                        className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
                    >
                        <div className="p-6">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                                <AlertTriangle
                                    className="h-7 w-7"
                                    aria-hidden="true"
                                />
                            </div>

                            <div className="mt-4 text-center">
                                <h2
                                    id="delete-community-title"
                                    className="text-lg font-bold text-gray-900 dark:text-white"
                                >
                                    Permanently delete community?
                                </h2>

                                <p
                                    id="delete-community-description"
                                    className="mt-2 break-words text-sm leading-6 text-gray-600 dark:text-gray-400"
                                >
                                    You are about to permanently delete{' '}
                                    <strong className="text-gray-900 dark:text-white">
                                        {deletingCommunity.name}
                                    </strong>
                                    .
                                </p>
                            </div>

                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/30">
                                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                    This action cannot be undone.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-400">
                                    The community, its posts, comments,
                                    replies, reactions, shares, membership
                                    records, join requests, reports, and
                                    uploaded media will be permanently
                                    deleted.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/50 sm:flex-row sm:justify-end sm:px-6">
                            <button
                                type="button"
                                onClick={() => setDeletingCommunity(null)}
                                disabled={isDeleting}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Keep Community
                            </button>

                            <button
                                type="button"
                                onClick={confirmDeleteCommunity}
                                disabled={isDeleting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isDeleting ? (
                                    <LoaderCircle
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Trash2
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                )}

                                {isDeleting
                                    ? 'Deleting...'
                                    : 'Permanently Delete'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}