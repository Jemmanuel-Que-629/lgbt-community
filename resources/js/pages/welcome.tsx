import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { useEffect, useState } from 'react';

export default function Welcome() {
    const { auth } = usePage().props;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title="LGBTIA Community | You Belong Here" />

            <div className="relative min-h-screen overflow-x-hidden bg-[#17111F] font-sans text-white antialiased selection:bg-[#D4AF37] selection:text-[#17111F]">

                {/* Background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[#E83E8C]/10 blur-[140px]" />
                    <div className="absolute right-[-180px] top-[30%] h-[500px] w-[500px] rounded-full bg-[#6C2BD9]/15 blur-[140px]" />
                    <div className="absolute bottom-[-150px] left-[35%] h-[450px] w-[450px] rounded-full bg-[#2563EB]/10 blur-[140px]" />
                </div>

                {/* Navigation */}
                <header
                    className={`sticky top-0 z-50 border-b border-white/10 bg-[#17111F]/85 backdrop-blur-xl transition-all duration-700 ${
                        mounted
                            ? 'translate-y-0 opacity-100'
                            : '-translate-y-full opacity-0'
                    }`}
                >
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                        <Link
                            href="/"
                            className="group flex items-center gap-3 transition hover:opacity-90"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E83E8C] via-[#7C3AED] to-[#2563EB] shadow-lg shadow-black/20 transition group-hover:scale-105">
                                <svg
                                    className="h-5 w-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                            </span>

                            <span className="text-lg font-extrabold tracking-tight">
                                <span className="bg-gradient-to-r from-[#F472B6] via-[#C084FC] to-[#60A5FA] bg-clip-text text-transparent">
                                    LGBTIA
                                </span>{' '}
                                Community
                            </span>
                        </Link>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition-all duration-300 hover:bg-[#D4AF37] hover:text-[#17111F]"
                                >
                                    Go to Your Feed
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/75 transition hover:text-[#F472B6]"
                                    >
                                        Log in
                                    </Link>

                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-gradient-to-r from-[#E83E8C] to-[#7C3AED] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
                                    >
                                        Join the Community
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="relative z-10">

                    {/* HERO */}
                    <section className="relative overflow-hidden px-6 pb-16 pt-20 lg:px-8 lg:pb-20 lg:pt-28">
                        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">

                            <div
                                className={`mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-sm transition-all duration-700 ${
                                    mounted
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-6 opacity-0'
                                }`}
                            >
                                <span className="h-2 w-2 rounded-full bg-[#E83E8C]" />

                                <span className="bg-gradient-to-r from-[#F472B6] via-[#C084FC] to-[#60A5FA] bg-clip-text text-transparent">
                                    Whoever you are, whatever your story —
                                    you are welcome here.
                                </span>
                            </div>

                            <h1
                                className={`text-4xl font-extrabold leading-tight tracking-tight text-white transition-all delay-200 duration-700 sm:text-6xl lg:text-7xl ${
                                    mounted
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-8 opacity-0'
                                }`}
                            >
                                Find your people, share your heart,
                                <br />
                                <span className="bg-gradient-to-r from-[#F472B6] via-[#C084FC] to-[#60A5FA] bg-clip-text text-transparent">
                                    and feel at home.
                                </span>
                            </h1>

                            <p
                                className={`mt-7 max-w-2xl text-lg leading-relaxed text-white/70 transition-all delay-300 duration-700 ${
                                    mounted
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-10 opacity-0'
                                }`}
                            >
                                A welcoming community where LGBTIA individuals
                                can share experiences, discover new
                                communities, start conversations, and connect
                                with people who understand.
                            </p>

                            <div
                                className={`mt-10 flex w-full flex-col items-center justify-center gap-4 transition-all delay-400 duration-700 sm:w-auto sm:flex-row ${
                                    mounted
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-12 opacity-0'
                                }`}
                            >
                                <Link
                                    href={register()}
                                    className="w-full rounded-xl bg-gradient-to-r from-[#E83E8C] to-[#7C3AED] px-8 py-4 text-center text-sm font-bold text-white shadow-xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:brightness-110 sm:w-auto"
                                >
                                    Join the Community
                                </Link>

                                <Link
                                    href={login()}
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-8 py-4 text-center text-sm font-semibold text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37]/50 hover:bg-white/[0.06] hover:text-[#D4AF37] sm:w-auto"
                                >
                                    I already have an account
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* MESSAGE + IMAGE */}
                    <section className="px-6 py-10 lg:px-8 lg:py-14">
                        <div
                            className={`mx-auto max-w-6xl transition-all delay-500 duration-1000 ${
                                mounted
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-16 opacity-0'
                            }`}
                        >
                            <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#21182A] shadow-2xl shadow-black/30 lg:grid-cols-2">

                                {/* MESSAGE */}
                                <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
                                    <span className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                                        A space for you
                                    </span>

                                    <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                                        You don't have to figure everything out
                                        alone.
                                    </h2>

                                    <p className="mt-5 text-base leading-7 text-white/60">
                                        Sometimes you just want somewhere to
                                        talk. Somewhere to ask a question,
                                        share a little victory, meet someone
                                        with a similar experience, or simply
                                        know that you're not the only one.
                                    </p>

                                    <p className="mt-4 text-base leading-7 text-white/60">
                                        That's what we're building — a place
                                        where people can come together, find
                                        their communities, and feel comfortable
                                        being themselves.
                                    </p>

                                    <div className="mt-7 flex items-center gap-3">
                                        <div className="h-1 w-10 rounded-full bg-[#E83E8C]" />
                                        <div className="h-1 w-10 rounded-full bg-[#C084FC]" />
                                        <div className="h-1 w-10 rounded-full bg-[#60A5FA]" />
                                        <div className="h-1 w-10 rounded-full bg-[#D4AF37]" />
                                    </div>
                                </div>

                                {/* IMAGE */}
                                <div className="relative min-h-[300px] lg:min-h-[460px]">
                                    <img
                                        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85"
                                        alt="Friends spending time together"
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-[#17111F]/70 via-transparent to-[#7C3AED]/10" />

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="inline-flex rounded-lg border border-white/10 bg-black/35 px-4 py-2.5 backdrop-blur-md">
                                            <span className="text-sm font-medium text-white">
                                                Real people. Real stories.
                                                Real connections.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* COMMUNITY PILLARS */}
                    <section className="border-y border-white/10 bg-[#1C1524]/80 py-20 backdrop-blur-md">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">

                            <div className="mx-auto mb-14 max-w-2xl text-center">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                                    What's inside
                                </span>

                                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Find a place where you belong.
                                </h2>

                                <p className="mt-4 text-base leading-7 text-white/55">
                                    Different people, different stories, and
                                    different communities — all sharing the
                                    same space.
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">

                                {/* CARD 1 */}
                                <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#E83E8C]/40 hover:bg-white/[0.04]">
                                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E83E8C]/10 text-xl">
                                        💬
                                    </div>

                                    <h3 className="text-lg font-bold transition group-hover:text-[#F472B6]">
                                        Conversations
                                    </h3>

                                    <p className="mt-3 text-sm leading-6 text-white/55">
                                        Start discussions, ask questions, share
                                        your experiences, or simply join the
                                        conversation.
                                    </p>
                                </div>

                                {/* CARD 2 */}
                                <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#8B5CF6]/40 hover:bg-white/[0.04]">
                                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-xl">
                                        🫂
                                    </div>

                                    <h3 className="text-lg font-bold transition group-hover:text-[#C084FC]">
                                        Community
                                    </h3>

                                    <p className="mt-3 text-sm leading-6 text-white/55">
                                        Discover communities built around
                                        shared interests, identities,
                                        experiences, and everyday life.
                                    </p>
                                </div>

                                {/* CARD 3 */}
                                <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#3B82F6]/40 hover:bg-white/[0.04]">
                                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-xl">
                                        🛡️
                                    </div>

                                    <h3 className="text-lg font-bold transition group-hover:text-[#60A5FA]">
                                        Support
                                    </h3>

                                    <p className="mt-3 text-sm leading-6 text-white/55">
                                        A community built around respect,
                                        thoughtful discussion, and making room
                                        for different experiences.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* FOOTER */}
                <footer className="border-t border-white/10 bg-[#100C15]">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                        <div>
                            <p className="font-semibold text-white">
                                <span className="text-[#F472B6]">LGBTIA</span>{' '}
                                Community
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                                A place to connect, share, and belong.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-6 text-xs text-white/35">
                            <span className="transition hover:text-[#D4AF37]">
                                Community Guidelines
                            </span>

                            <span className="transition hover:text-[#D4AF37]">
                                Privacy
                            </span>

                            <span className="transition hover:text-[#D4AF37]">
                                Support
                            </span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}