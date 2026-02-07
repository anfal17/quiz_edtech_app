import { useEffect, useState } from 'react';

const variants = {
    primary: {
        bg: 'bg-primary-500/20',
        fill: 'bg-gradient-to-r from-primary-500 to-secondary-500',
    },
    success: {
        bg: 'bg-success-500/20',
        fill: 'bg-gradient-to-r from-success-500 to-success-400',
    },
    warning: {
        bg: 'bg-warning-500/20',
        fill: 'bg-gradient-to-r from-warning-500 to-warning-400',
    },
    error: {
        bg: 'bg-error-500/20',
        fill: 'bg-gradient-to-r from-error-500 to-error-400',
    },
    xp: {
        bg: 'bg-secondary-500/20',
        fill: 'bg-gradient-to-r from-secondary-500 via-primary-500 to-secondary-400',
    },
};

export default function ProgressBar({
    value = 0,
    max = 100,
    variant = 'primary',
    size = 'md',
    showLabel = false,
    label,
    animated = true,
    glowing = false,
    className = '',
}) {
    const [displayValue, setDisplayValue] = useState(0);
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => {
                setDisplayValue(percentage);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setDisplayValue(percentage);
        }
    }, [percentage, animated]);

    const heights = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
        xl: 'h-6',
    };

    return (
        <div className={`w-full ${className}`}>
            {(showLabel || label) && (
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                        {label}
                    </span>
                    {showLabel && (
                        <span className="text-sm font-bold text-[var(--text)]">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}
            <div
                className={`
          w-full rounded-full overflow-hidden
          ${variants[variant].bg}
          ${heights[size]}
        `}
            >
                <div
                    className={`
            h-full rounded-full
            ${variants[variant].fill}
            ${animated ? 'transition-all duration-1000 ease-out' : ''}
            ${glowing ? 'animate-pulse-glow' : ''}
          `}
                    style={{ width: `${displayValue}%` }}
                />
            </div>
        </div>
    );
}

// Circular Progress variant
export function CircularProgress({
    value = 0,
    max = 100,
    size = 120,
    strokeWidth = 8,
    variant = 'primary',
    showLabel = true,
    label,
    className = '',
}) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const colors = {
        primary: '#6366f1',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        xp: '#8b5cf6',
    };

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors[variant]}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 6px ${colors[variant]}40)`,
                    }}
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--text)]">
                        {Math.round(percentage)}%
                    </span>
                    {label && (
                        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
                    )}
                </div>
            )}
        </div>
    );
}
