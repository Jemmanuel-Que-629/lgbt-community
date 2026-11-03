
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

type CreateCommunityProps = {
    categories: string[];
};

export default function CreateCommunity({
    categories,
}: CreateCommunityProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        category: 'General',
        image: null as File | null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (!data.image) {
            setImagePreview(null);
            return;
        }

        const previewUrl = URL.createObjectURL(data.image);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [data.image]);

    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setData('image', file);
    }

    function removeImage() {
        setData('image', null);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        post('/communities', {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Create Community" />

            <main className="min-h-screen bg-gray-100 px-4 py-8 dark:bg-gray-950">
                <div className="mx-auto max-w-2xl">
                    <Link
                        href="/communities"
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to communities
                    </Link>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
                        <div className="mb-6">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                <Users className="h-6 w-6" />
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Create a Community
                            </h1>

                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Build a space where people can connect and
                                share their interests.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                >
                                    Community name
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                    maxLength={80}
                                    placeholder="e.g. LGBTQIA+ Artists"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                />

                                {errors.name && (
                                    <p className="mt-2 text-sm text-red-600">
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
                                    onChange={(event) =>
                                        setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={1000}
                                    rows={4}
                                    placeholder="What is this community about?"
                                    className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                />

                                <div className="mt-1 flex justify-between gap-2">
                                    {errors.description ? (
                                        <p className="text-sm text-red-600">
                                            {errors.description}
                                        </p>
                                    ) : (
                                        <span />
                                    )}

                                    <span className="text-xs text-gray-400">
                                        {data.description.length}/1000
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="category"
                                    className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                                >
                                    Category
                                </label>

                                <select
                                    id="category"
                                    value={data.category}
                                    onChange={(event) =>
                                        setData('category', event.target.value)
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                >
                                    {categories.map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>
                                    ))}
                                </select>

                                {errors.category && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.category}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Community image
                                    <span className="ml-2 font-normal text-gray-400">
                                        (Optional)
                                    </span>
                                </label>

                                {imagePreview ? (
                                    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                        <img
                                            src={imagePreview}
                                            alt="Community image preview"
                                            className="h-52 w-full object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            aria-label="Remove selected image"
                                            className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="image"
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-purple-500 hover:bg-purple-50 dark:border-gray-700 dark:hover:bg-purple-950/20"
                                    >
                                        <ImagePlus className="mb-3 h-8 w-8 text-gray-400" />

                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Choose an image
                                        </span>

                                        <span className="mt-1 text-xs text-gray-500">
                                            JPG, PNG, or WEBP · Maximum 5 MB
                                        </span>
                                    </label>
                                )}

                                <input
                                    id="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="sr-only"
                                />

                                {errors.image && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.image}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:justify-end">
                                <Link
                                    href="/communities"
                                    className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Community'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
