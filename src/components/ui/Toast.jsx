import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast Context for global usage
let toastId = 0;
let toastListeners = [];

export const toast = {
    show: (options) => {
        const id = ++toastId;
        const toastData = { id, ...options };
        toastListeners.forEach((listener) => listener({ type: 'ADD', toast: toastData }));
        return id;
    },
    success: (message, options = {}) => toast.show({ message, variant: 'success', ...options }),
    error: (message, options = {}) => toast.show({ message, variant: 'error', ...options }),
    info: (message, options = {}) => toast.show({ message, variant: 'info', ...options }),
    warning: (message, options = {}) => toast.show({ message, variant: 'warning', ...options }),
    dismiss: (id) => {
        toastListeners.forEach((listener) => listener({ type: 'REMOVE', id }));
    },
};

const variants = {
    success: {
        bg: 'bg-success-500/10 border-success-500/50',
        icon: <CheckCircle className="text-success-500\" size={20} />,
        text: 'text-success-400',
    },
    error: {
        bg: 'bg-error-500/10 border-error-500/50',
        icon: <AlertCircle className="text-error-500" size={20} />,
        text: 'text-error-400',
    },
    info: {
        bg: 'bg-primary-500/10 border-primary-500/50',
        icon: <Info className="text-primary-500" size={20} />,
        text: 'text-primary-400',
    },
    warning: {
        bg: 'bg-warning-500/10 border-warning-500/50',
        icon: <AlertTriangle className="text-warning-500" size={20} />,
        text: 'text-warning-400',
    },
};

function Toast({ id, message, variant = 'info', duration = 4000, onDismiss }) {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onDismiss(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onDismiss]);

    const config = variants[variant];

    return (
        <div
            className={`
        flex items-center gap-3
        px-4 py-3 rounded-xl
        border backdrop-blur-sm
        ${config.bg}
        animate-slide-in-right
        shadow-lg
      `}
        >
            {config.icon}
            <p className={`flex-1 text-sm font-medium ${config.text}`}>{message}</p>
            <button
                onClick={() => onDismiss(id)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
                <X size={16} className="text-[var(--text-secondary)]" />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    const handleToastAction = useCallback((action) => {
        if (action.type === 'ADD') {
            setToasts((prev) => [...prev, action.toast]);
        } else if (action.type === 'REMOVE') {
            setToasts((prev) => prev.filter((t) => t.id !== action.id));
        }
    }, []);

    useEffect(() => {
        toastListeners.push(handleToastAction);
        return () => {
            toastListeners = toastListeners.filter((l) => l !== handleToastAction);
        };
    }, [handleToastAction]);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => (
                <Toast key={t.id} {...t} onDismiss={dismissToast} />
            ))}
        </div>
    );
}

export default Toast;
