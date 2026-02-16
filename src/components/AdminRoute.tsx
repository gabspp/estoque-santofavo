
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AdminRoute = () => {
    const { role, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-brown" />
            </div>
        );
    }

    // If not logged in, AuthGuard usually handles this, but safety check:
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If logged in but not admin
    if (role !== 'admin') {
        console.log('Access denied: User is not admin', role);
        // Redirect to dashboard or a "Not Authorized" page
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
