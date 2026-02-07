import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastContainer } from '../ui/Toast';

export default function Layout({ showFooter = true }) {
    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg)]">
            <Navbar />

            {/* Main Content - pt-16 for fixed navbar height */}
            <main className="flex-1 pt-16">
                <Outlet />
            </main>

            {showFooter && <Footer />}

            {/* Toast Notifications */}
            <ToastContainer />
        </div>
    );
}

// Minimal layout without footer (for quiz pages, reading pages)
export function MinimalLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg)]">
            <Navbar />
            <main className="flex-1 pt-16">
                <Outlet />
            </main>
            <ToastContainer />
        </div>
    );
}
