import { forwardRef } from 'react';

const variants = {
    default: 'bg-[var(--surface)] border border-[var(--border)]',
    glass: 'glass',
    gradient: 'bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20',
    elevated: 'bg-[var(--surface)] shadow-xl shadow-black/10',
};

const Card = forwardRef(({
    children,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    clickable = false,
    className = '',
    ...props
}, ref) => {
    const paddingSizes = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            ref={ref}
            className={`
        rounded-2xl
        ${variants[variant]}
        ${paddingSizes[padding]}
        ${hoverable ? 'card-hover cursor-pointer' : ''}
        ${clickable ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

// Card subcomponents
export const CardHeader = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>
        {children}
    </div>
);

export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-xl font-bold text-[var(--text)] ${className}`}>
        {children}
    </h3>
);

export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-[var(--text-secondary)] mt-1 ${className}`}>
        {children}
    </p>
);

export const CardContent = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = '' }) => (
    <div className={`mt-4 pt-4 border-t border-[var(--border)] ${className}`}>
        {children}
    </div>
);

export default Card;
