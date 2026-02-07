import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';
import { ROLES } from '../constants';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children ? children : <Outlet />;
};

export const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;

    if (!isAdmin) {
        return <Navigate to="/" />;
    }

    return children ? children : <Outlet />;
};

export const GuestRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
