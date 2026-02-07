import { useState, createContext, useContext } from 'react';

const TabsContext = createContext();

export function Tabs({ defaultValue, value, onChange, children, className = '' }) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (newValue) => {
        setInternalValue(newValue);
        onChange?.(newValue);
    };

    return (
        <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className = '' }) {
    return (
        <div
            className={`
        inline-flex p-1 rounded-xl
        bg-[var(--surface)] border border-[var(--border)]
        ${className}
      `}
        >
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className = '' }) {
    const { value: currentValue, onChange } = useContext(TabsContext);
    const isActive = currentValue === value;

    return (
        <button
            onClick={() => onChange(value)}
            className={`
        px-4 py-2 rounded-lg
        text-sm font-medium
        transition-all duration-200
        ${isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                }
        ${className}
      `}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className = '' }) {
    const { value: currentValue } = useContext(TabsContext);

    if (currentValue !== value) return null;

    return (
        <div className={`animate-fade-in-up ${className}`} style={{ animationDuration: '200ms' }}>
            {children}
        </div>
    );
}

export default Tabs;
