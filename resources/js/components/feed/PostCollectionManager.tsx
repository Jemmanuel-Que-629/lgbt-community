import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

import type { Post } from '@/types/feed';

type Collection = {
    id: number;
    name: string;
    is_default: boolean;
};

type CollectionData = {
    is_saved: boolean;
    saved_post_id: number | null;
    collections: Collection[];
    assigned_collection_ids: number[];
};

type PostCollectionManagerProps = {
    post: Post;
    isSaved: boolean;
    isOpen: boolean;
    onClose: () => void;
};

export default function PostCollectionManager({
    post,
    isSaved,
    isOpen,
    onClose,
}: PostCollectionManagerProps) {
    const [data, setData] = useState<CollectionData | null>(null);
    const [loading, setLoading] = useState(false);

    const [creating, setCreating] = useState(false);
    const [collectionName, setCollectionName] = useState('');
    const [createAsDefault, setCreateAsDefault] = useState(false);

    const [busyCollectionId, setBusyCollectionId] = useState<number | null>(
        null,
    );

    const [busyDefaultCollectionId, setBusyDefaultCollectionId] = useState<
        number | null
    >(null);

    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');

    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    const loadData = useCallback(
        async (signal?: AbortSignal) => {
            if (!isSaved) {
                setData(null);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const response = await fetch(
                    `/posts/${post.id}/saved-post-data`,
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                        },
                        credentials: 'same-origin',
                        signal,
                    },
                );

                if (!response.ok) {
                    throw new Error('Unable to load your collections.');
                }

                const result: CollectionData = await response.json();

                if (!signal?.aborted) {
                    setData(result);
                }
            } catch (exception) {
                if (
                    exception instanceof DOMException &&
                    exception.name === 'AbortError'
                ) {
                    return;
                }

                if (!signal?.aborted) {
                    setError('Could not load collections. Please try again.');
                }
            } finally {
                if (!signal?.aborted) {
                    setLoading(false);
                }
            }
        },
        [isSaved, post.id],
    );

    // Load collection information whenever the modal opens.
    useEffect(() => {
        if (!isOpen) return;

        if (!isSaved) {
            setData(null);
            setError('Save this post before organizing it into collections.');
            return;
        }

        const controller = new AbortController();

        void loadData(controller.signal);

        return () => {
            controller.abort();
        };
    }, [isOpen, isSaved, loadData]);

    // Manage focus, body scrolling, and Escape behavior.
    useEffect(() => {
        if (!isOpen) return;

        const previousActiveElement =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        function handleEscape(event: globalThis.KeyboardEvent) {
            if (event.key === 'Escape') {
                onCloseRef.current();
            }
        }

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleEscape);

            previousActiveElement?.focus();
        };
    }, [isOpen]);

    function createCollection(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const name = collectionName.trim();

        if (!name || creating || !isSaved || !data?.saved_post_id) {
            return;
        }

        setCreating(true);
        setFeedback('');
        setError('');

        router.post(
            '/saved-post-collections',
            {
                name,
                is_default: createAsDefault,
                saved_post_id: data.saved_post_id,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setCollectionName('');
                    setCreateAsDefault(false);

                    setFeedback(
                        createAsDefault
                            ? 'Collection created, this post was added, and future saves will be added automatically.'
                            : 'Collection created and this post was added successfully.',
                    );

                    void loadData();
                },

                onError: (errors) => {
                    setError(
                        errors.name ??
                            errors.saved_post_id ??
                            errors.is_default ??
                            'Could not create the collection. Please try again.',
                    );
                },

                onFinish: () => {
                    setCreating(false);
                },
            },
        );
    }

    function toggleCollection(collectionId: number) {
        if (!data?.saved_post_id || busyCollectionId !== null || !isSaved) {
            return;
        }

        const isAssigned = data.assigned_collection_ids.includes(collectionId);

        setBusyCollectionId(collectionId);
        setFeedback('');
        setError('');

        const url = `/saved-post-collections/${collectionId}/posts/${data.saved_post_id}`;

        const options = {
            preserveScroll: true,

            onSuccess: () => {
                setData((current) => {
                    if (!current) return current;

                    const assigned = new Set(current.assigned_collection_ids);

                    if (isAssigned) {
                        assigned.delete(collectionId);
                    } else {
                        assigned.add(collectionId);
                    }

                    return {
                        ...current,
                        assigned_collection_ids: Array.from(assigned),
                    };
                });

                setFeedback(
                    isAssigned
                        ? 'Removed from collection.'
                        : 'Added to collection.',
                );
            },

            onError: () => {
                setError('Could not update this collection. Please try again.');
            },

            onFinish: () => {
                setBusyCollectionId(null);
            },
        };

        if (isAssigned) {
            router.delete(url, options);
        } else {
            router.post(url, {}, options);
        }
    }

    function toggleDefaultCollection(collection: Collection) {
        if (busyDefaultCollectionId !== null) {
            return;
        }

        const nextDefaultState = !collection.is_default;

        setBusyDefaultCollectionId(collection.id);
        setFeedback('');
        setError('');

        router.patch(
            `/saved-post-collections/${collection.id}/default`,
            {
                is_default: nextDefaultState,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setData((current) => {
                        if (!current) return current;

                        return {
                            ...current,
                            collections: current.collections.map((item) =>
                                item.id === collection.id
                                    ? {
                                          ...item,
                                          is_default: nextDefaultState,
                                      }
                                    : item,
                            ),
                        };
                    });

                    setFeedback(
                        nextDefaultState
                            ? 'Future saved posts will automatically be added to this collection.'
                            : 'Automatic adding has been turned off. Existing posts remain in this collection.',
                    );
                },

                onError: () => {
                    setError(
                        'Could not update the automatic saving setting. Please try again.',
                    );
                },

                onFinish: () => {
                    setBusyDefaultCollectionId(null);
                },
            },
        );
    }

    function handleModalKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key !== 'Tab') return;

        const focusableElements =
            modalRef.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
            );

        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    if (!isOpen) return null;

    const assignedCount = data?.assigned_collection_ids.length ?? 0;

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`collection-modal-title-${post.id}`}
                aria-describedby={`collection-modal-description-${post.id}`}
                onKeyDown={handleModalKeyDown}
                className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            >
                {/* Modal header */}
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                    <div className="min-w-0">
                        <h2
                            id={`collection-modal-title-${post.id}`}
                            className="text-lg font-bold text-gray-900 dark:text-white"
                        >
                            Organize into collections
                        </h2>

                        <p
                            id={`collection-modal-description-${post.id}`}
                            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                        >
                            Choose where you want to keep this saved post.
                        </p>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close collection manager"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                        ×
                    </button>
                </div>

                {/* Modal content */}
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                    {!isSaved ? (
                        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            Save this post first before adding it to a
                            collection.
                        </div>
                    ) : loading ? (
                        <div
                            role="status"
                            className="flex items-center justify-center gap-3 py-10 text-sm text-gray-500 dark:text-gray-400"
                        >
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
                            Loading your collections...
                        </div>
                    ) : data ? (
                        <>
                            {/* Create collection */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Create a new collection
                                </h3>

                                <form
                                    onSubmit={createCollection}
                                    className="mt-3 space-y-3"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <label
                                            htmlFor={`new-collection-${post.id}`}
                                            className="sr-only"
                                        >
                                            New collection name
                                        </label>

                                        <input
                                            id={`new-collection-${post.id}`}
                                            value={collectionName}
                                            onChange={(event) =>
                                                setCollectionName(
                                                    event.target.value,
                                                )
                                            }
                                            maxLength={60}
                                            placeholder="e.g. Helpful resources"
                                            disabled={creating}
                                            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />

                                        <button
                                            type="submit"
                                            disabled={
                                                creating ||
                                                !collectionName.trim() ||
                                                !data.saved_post_id
                                            }
                                            className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {creating
                                                ? 'Creating...'
                                                : 'Create'}
                                        </button>
                                    </div>

                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/70 p-3 dark:border-purple-900 dark:bg-purple-950/30">
                                        <input
                                            type="checkbox"
                                            checked={createAsDefault}
                                            onChange={(event) =>
                                                setCreateAsDefault(
                                                    event.target.checked,
                                                )
                                            }
                                            disabled={creating}
                                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-purple-700 focus:ring-purple-600"
                                        />

                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                                                Automatically add future saved
                                                posts
                                            </span>

                                            <span className="mt-1 block text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                                                New posts you save will
                                                automatically appear in this
                                                collection too.
                                            </span>
                                        </span>
                                    </label>

                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        This post will be added to the new
                                        collection automatically.
                                    </p>
                                </form>
                            </section>

                            <div className="border-t border-gray-200 dark:border-gray-700" />

                            {/* Existing collections */}
                            <section>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Your collections
                                    </h3>

                                    {data.collections.length > 0 && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {assignedCount} selected
                                        </span>
                                    )}
                                </div>

                                {data.collections.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.collections.map((collection) => {
                                            const checked =
                                                data.assigned_collection_ids.includes(
                                                    collection.id,
                                                );

                                            const updatingAssignment =
                                                busyCollectionId ===
                                                collection.id;

                                            const updatingDefault =
                                                busyDefaultCollectionId ===
                                                collection.id;

                                            return (
                                                <div
                                                    key={collection.id}
                                                    className={`rounded-xl border p-3 transition ${
                                                        checked
                                                            ? 'border-purple-300 bg-purple-50/70 dark:border-purple-800 dark:bg-purple-950/30'
                                                            : 'border-gray-200 dark:border-gray-700'
                                                    }`}
                                                >
                                                    {/* Current post assignment */}
                                                    <label className="flex cursor-pointer items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            disabled={
                                                                busyCollectionId !==
                                                                null
                                                            }
                                                            onChange={() =>
                                                                toggleCollection(
                                                                    collection.id,
                                                                )
                                                            }
                                                            className="h-4 w-4 shrink-0 rounded border-gray-300 text-purple-700 focus:ring-purple-600"
                                                        />

                                                        <span
                                                            aria-hidden="true"
                                                            className="text-lg"
                                                        >
                                                            📁
                                                        </span>

                                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            {collection.name}
                                                        </span>

                                                        {updatingAssignment && (
                                                            <span
                                                                role="status"
                                                                className="text-xs text-gray-500 dark:text-gray-400"
                                                            >
                                                                Updating...
                                                            </span>
                                                        )}
                                                    </label>

                                                    {/* Future post assignment */}
                                                    <div className="mt-3 ml-7 flex items-center justify-between gap-3 border-t border-gray-200/80 pt-3 dark:border-gray-700">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                Automatically
                                                                add future saves
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                {collection.is_default
                                                                    ? 'New saved posts will be added here.'
                                                                    : 'Only posts you manually add will appear here.'}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={
                                                                collection.is_default
                                                            }
                                                            aria-label={`Automatically add future saved posts to ${collection.name}`}
                                                            disabled={
                                                                busyDefaultCollectionId !==
                                                                null
                                                            }
                                                            onClick={() =>
                                                                toggleDefaultCollection(
                                                                    collection,
                                                                )
                                                            }
                                                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-wait disabled:opacity-60 ${
                                                                collection.is_default
                                                                    ? 'bg-purple-700'
                                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                                                    collection.is_default
                                                                        ? 'translate-x-6'
                                                                        : 'translate-x-1'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    {updatingDefault && (
                                                        <p
                                                            role="status"
                                                            className="mt-2 ml-7 text-xs text-gray-500 dark:text-gray-400"
                                                        >
                                                            Updating automatic
                                                            saving...
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
                                        <div
                                            aria-hidden="true"
                                            className="text-3xl"
                                        >
                                            📁
                                        </div>

                                        <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            No collections yet
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Create your first collection above
                                            to organize this post.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </>
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                Collection information is unavailable.
                            </p>

                            <button
                                type="button"
                                onClick={() => void loadData()}
                                className="mt-3 text-sm font-semibold text-purple-700 hover:underline dark:text-purple-400"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        >
                            {error}

                            {data && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError('');
                                        void loadData();
                                    }}
                                    className="ml-2 font-semibold underline"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    )}

                    {feedback && (
                        <p
                            role="status"
                            aria-live="polite"
                            className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300"
                        >
                            {feedback}
                        </p>
                    )}
                </div>

                {/* Modal footer */}
                <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        A post can belong to multiple collections.
                    </p>

                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
