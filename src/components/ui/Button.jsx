import { forwardRef } from 'react';

const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-primary-500/30',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-lg hover:shadow-secondary-500/30',
    success: 'bg-success-500 hover:bg-success-600 text-white shadow-lg hover:shadow-success-500/30',
    danger: 'bg-error-500 hover:bg-error-600 text-white shadow-lg hover:shadow-error-500/30',
    ghost: 'bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text)]',
    outline: 'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-base rounded-xl',
    lg: 'px-7 py-3.5 text-lg rounded-xl',
};

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loading, // Destructure loading to preventing it from passing to DOM
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}, ref) => {
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[var(--bg)]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95
    btn-glow
  `;

    const isButtonLoading = isLoading || loading;

    return (
        <button
            ref={ref}
            disabled={disabled || isButtonLoading}
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            {...props}
        >
            {isButtonLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            ) : leftIcon}
            {children}
            {!isButtonLoading && rightIcon}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
