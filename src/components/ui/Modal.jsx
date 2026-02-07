import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showClose = true,
    closeOnOverlay = true,
    className = '',
}) {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw]',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-up"
                style={{ animationDuration: '200ms' }}
                onClick={closeOnOverlay ? onClose : undefined}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className={`
          relative w-full ${sizes[size]}
          bg-[var(--surface)] border border-[var(--border)]
          rounded-2xl shadow-2xl
          animate-fade-in-up
          ${className}
        `}
                style={{ animationDuration: '300ms' }}
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-start justify-between p-6 pb-0">
                        <div>
                            {title && (
                                <h2 className="text-xl font-bold text-[var(--text)]">{title}</h2>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    {description}
                                </p>
                            )}
                        </div>
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="
                  p-2 rounded-lg
                  text-[var(--text-secondary)] hover:text-[var(--text)]
                  hover:bg-[var(--surface-hover)]
                  transition-colors
                "
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// Confirmation Modal variant
export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}) {
    const variants = {
        danger: 'bg-error-500 hover:bg-error-600',
        warning: 'bg-warning-500 hover:bg-warning-600',
        primary: 'bg-primary-500 hover:bg-primary-600',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            {description && (
                <p className="text-[var(--text-secondary)] mb-6">{description}</p>
            )}
            <div className="flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="
            px-4 py-2 rounded-xl
            bg-[var(--surface-hover)] text-[var(--text)]
            hover:bg-[var(--border)]
            transition-colors
            disabled:opacity-50
          "
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`
            px-4 py-2 rounded-xl
            text-white font-medium
            ${variants[variant]}
            transition-colors
            disabled:opacity-50
          `}
                >
                    {isLoading ? 'Loading...' : confirmText}
                </button>
            </div>
        </Modal>
    );
}
