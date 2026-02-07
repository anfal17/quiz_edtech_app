import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('ilmpath-token');
        if (token) {
            try {
                const userData = await authAPI.getMe();
                setUser(userData);
            } catch (err) {
                // Token invalid, clear it
                localStorage.removeItem('ilmpath-token');
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    // Check for existing token on mount
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const data = await authAPI.login({ email, password });
            localStorage.setItem('ilmpath-token', data.token);
            setUser(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const register = useCallback(async (name, email, password) => {
        setError(null);
        try {
            const data = await authAPI.register({ name, email, password });
            localStorage.setItem('ilmpath-token', data.token);
            setUser(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('ilmpath-token');
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (data) => {
        try {
            const updated = await authAPI.updateProfile(data);
            setUser(prev => ({ ...prev, ...updated }));
            return updated;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const loginAsGuest = useCallback(() => {
        const guestUser = {
            _id: 'guest_' + Date.now(),
            name: 'Guest User',
            email: 'guest@ilmpath.com',
            role: 'guest',
            avatar: '👤',
            streak: { current: 0 },
            xp: 0
        };
        setUser(guestUser);
        // Do not set token in localStorage, so it's ephemeral
        return guestUser;
    }, []);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isGuest: user?.role === 'guest',
        login,
        register,
        loginAsGuest,
        logout,
        updateProfile,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export default AuthContext;
