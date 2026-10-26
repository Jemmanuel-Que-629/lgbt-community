import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-[#17111F] p-6 md:p-10">
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#E83E8C]/10 blur-[120px]" />

                <div className="absolute top-[20%] right-[-150px] h-[500px] w-[500px] rounded-full bg-[#7C3AED]/10 blur-[130px]" />

                <div className="absolute bottom-[-200px] left-[30%] h-[450px] w-[450px] rounded-full bg-[#2563EB]/10 blur-[130px]" />
            </div>

            {/* Auth content */}
            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    {/* Logo + heading */}
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E83E8C] via-[#7C3AED] to-[#2563EB] shadow-lg shadow-purple-900/20">
                                <AppLogoIcon className="size-7 fill-current text-white" />
                            </div>

                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-semibold text-white">
                                {title}
                            </h1>

                            <p className="text-center text-sm text-white/50">
                                {description}
                            </p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
