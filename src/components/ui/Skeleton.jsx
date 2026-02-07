export function Skeleton({ className = '', variant = 'default' }) {
    const variants = {
        default: 'rounded-lg',
        circle: 'rounded-full',
        text: 'rounded h-4',
    };

    return (
        <div
            className={`
        animate-pulse
        bg-[var(--border)]
        ${variants[variant]}
        ${className}
      `}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12" variant="circle" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
        </div>
    );
}

export function SkeletonDomainCard() {
    return (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full mt-4" />
            </div>
        </div>
    );
}

export function SkeletonQuizQuestion() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-8 w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export default Skeleton;
