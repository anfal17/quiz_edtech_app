const variants = {
    default: 'bg-[var(--surface)] text-[var(--text-secondary)]',
    primary: 'bg-primary-500/20 text-primary-400',
    secondary: 'bg-secondary-500/20 text-secondary-400',
    success: 'bg-success-500/20 text-success-400',
    warning: 'bg-warning-500/20 text-warning-400',
    error: 'bg-error-500/20 text-error-400',
    // Difficulty levels
    beginner: 'bg-success-500/20 text-success-400',
    intermediate: 'bg-warning-500/20 text-warning-400',
    advanced: 'bg-error-500/20 text-error-400',
};

const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
};

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    icon,
    className = '',
}) {
    return (
        <span
            className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
}

// Difficulty Badge helper
export function DifficultyBadge({ level }) {
    const labels = {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
    };

    return (
        <Badge variant={level} size="sm">
            {labels[level] || level}
        </Badge>
    );
}
