import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

type Community = {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    visibility: 'public' | 'private';
    image_url: string | null;
};

type Props = {
    community: Community;
    categories: string[];
};

export default function EditCommunity({ community, categories }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: community.name,
        description: community.description ?? '',
        category: community.category ?? '',
        visibility: community.visibility,
        image: null as File | null,
        remove_image: false,
    });

    const [preview, setPreview] = useState<string | null>(community.image_url);

    useEffect(() => {
        if (!data.image) {
            return;
        }

        const objectUrl = URL.createObjectURL(data.image);
        setPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.image]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        patch(`/communities/${community.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    function removeCover() {
        setData({
            ...data,
            image: null,
            remove_image: true,
        });
        setPreview(null);
    }

    function handleImage(file: File | undefined) {
        if (!file) return;

        setData({
            ...data,
            image: file,
            remove_image: false,
        });
    }

    return (
        <>
            <Head title={`Edit ${community.name}`} />

            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
                <Link
                    href="/my-communities"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-purple-700 dark:text-gray-300 dark:hover:text-purple-400"
                >
                    <ArrowLeft size={16} />
                    Back to My Communities
                </Link>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Edit community
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Update your community information and settings.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-gray-700 dark:bg-gray-900"
                >
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                        >
                            Community name
                        </label>
                        <input
                            id="name"
                            value={data.name}
                            maxLength={80}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-900"
                            required
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={data.description}
                            maxLength={2000}
                            rows={4}
                            onChange={(event) =>
                                setData('description', event.target.value)
                            }
                            className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-900"
                            placeholder="What is this community about?"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="category"
                            className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                        >
                            Category
                        </label>
                        <input
                            id="category"
                            list="community-categories"
                            value={data.category}
                            maxLength={50}
                            onChange={(event) =>
                                setData('category', event.target.value)
                            }
                            placeholder="Choose or enter a category"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-900"
                        />
                        <datalist id="community-categories">
                            {categories.map((category) => (
                                <option key={category} value={category} />
                            ))}
                        </datalist>
                        {errors.category && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.category}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Select an existing category or enter a new one.
                        </p>
                    </div>

                    <fieldset>
                        <legend className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Community visibility
                        </legend>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label
                                className={`cursor-pointer rounded-xl border p-4 transition ${
                                    data.visibility === 'public'
                                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30'
                                        : 'border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="public"
                                    checked={data.visibility === 'public'}
                                    onChange={() =>
                                        setData('visibility', 'public')
                                    }
                                    className="sr-only"
                                />
                                <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                                    Public
                                </span>
                                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                                    Anyone can view posts and join.
                                </span>
                            </label>

                            <label
                                className={`cursor-pointer rounded-xl border p-4 transition ${
                                    data.visibility === 'private'
                                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30'
                                        : 'border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="private"
                                    checked={data.visibility === 'private'}
                                    onChange={() =>
                                        setData('visibility', 'private')
                                    }
                                    className="sr-only"
                                />
                                <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                                    Private
                                </span>
                                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                                    Only approved members can view posts.
                                </span>
                            </label>
                        </div>
                        {errors.visibility && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.visibility}
                            </p>
                        )}
                    </fieldset>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Community cover
                        </label>

                        {preview ? (
                            <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                <img
                                    src={preview}
                                    alt="Community cover preview"
                                    className="h-48 w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={removeCover}
                                    aria-label="Remove community cover"
                                    className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black"
                                >
                                    <X size={14} />
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center transition hover:border-purple-500 dark:border-gray-700 dark:bg-gray-800">
                                <ImagePlus className="mb-2 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Upload a cover image
                                </span>
                                <span className="mt-1 text-xs text-gray-500">
                                    JPG, PNG, or WEBP · Maximum 5 MB
                                </span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={(event) =>
                                        handleImage(event.target.files?.[0])
                                    }
                                />
                            </label>
                        )}

                        {preview && (
                            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-800 dark:text-purple-400">
                                <ImagePlus size={16} />
                                Replace cover image
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={(event) =>
                                        handleImage(event.target.files?.[0])
                                    }
                                />
                            </label>
                        )}

                        {errors.image && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.image}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
                        <Link
                            href="/my-communities"
                            className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Saving changes...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
