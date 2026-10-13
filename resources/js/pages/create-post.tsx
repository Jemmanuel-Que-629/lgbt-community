
import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

type Community = {
    id: number;
    name: string;
};

type Props = {
    communities: Community[];
};

export default function CreatePost({ communities }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        community_id: communities[0]?.id.toString() ?? '',
        title: '',
        body: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/posts');
    }

    return (
        <>
            <Head title="Create Post" />

            <main className="min-h-screen bg-gray-100 px-4 py-8 dark:bg-gray-950">
                <div className="mx-auto max-w-2xl">
                    <Link href="/feed" className="text-purple-700 hover:underline">
                        ← Back to feed
                    </Link>

                    <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create a post
                        </h1>

                        {communities.length === 0 ? (
                            <p className="mt-5 text-gray-600 dark:text-gray-300">
                                No communities exist yet. Create a community first.
                            </p>
                        ) : (
                            <form onSubmit={submit} className="mt-6 space-y-5">
                                <div>
                                    <label htmlFor="community_id" className="mb-2 block font-medium">
                                        Community
                                    </label>
                                    <select
                                        id="community_id"
                                        value={data.community_id}
                                        onChange={(e) => setData('community_id', e.target.value)}
                                        className="w-full rounded-lg border p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        required
                                    >
                                        {communities.map((community) => (
                                            <option key={community.id} value={community.id}>
                                                {community.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.community_id && (
                                        <p className="text-sm text-red-600">{errors.community_id}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="title" className="mb-2 block font-medium">
                                        Title
                                    </label>
                                    <input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Give your post a title"
                                        maxLength={255}
                                        className="w-full rounded-lg border p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="body" className="mb-2 block font-medium">
                                        Body (optional)
                                    </label>
                                    <textarea
                                        id="body"
                                        value={data.body}
                                        onChange={(e) => setData('body', e.target.value)}
                                        placeholder="What would you like to share?"
                                        rows={7}
                                        maxLength={10000}
                                        className="w-full rounded-lg border p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {errors.body && (
                                        <p className="text-sm text-red-600">{errors.body}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !data.community_id}
                                    className="rounded-lg bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                                >
                                    {processing ? 'Publishing...' : 'Publish post'}
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
