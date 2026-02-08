import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, FileText, HelpCircle,
    Users, Settings, Menu, X, ChevronLeft,
    Moon, Sun, LogOut, MessageSquare, MessageCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/courses', label: 'Courses', icon: BookOpen },
    { path: '/admin/chapters', label: 'Chapters', icon: FileText },
    { path: '/admin/quizzes', label: 'Quizzes', icon: HelpCircle },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/tickets', label: 'Support Tickets', icon: MessageSquare },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageCircle },
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-xl hover:bg-[var(--surface-hover)]"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <Link to="/admin" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-lg">
                        📖
                    </div>
                    <span className="font-bold text-[var(--text)]">Admin Panel</span>
                </Link>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl hover:bg-[var(--surface-hover)]"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-50 h-full bg-[var(--surface)] border-r border-[var(--border)]
          transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)]">
                    {sidebarOpen && (
                        <Link to="/admin" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xl">
                                📖
                            </div>
                            <div>
                                <span className="font-bold text-[var(--text)]">Ilm Path</span>
                                <p className="text-xs text-[var(--text-secondary)]">Admin Panel</p>
                            </div>
                        </Link>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex p-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                    >
                        <ChevronLeft className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive(item.path, item.exact)
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                                }
              `}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)]">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="font-medium">Back to Site</span>}
                    </Link>

                    {sidebarOpen && (
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`
          transition-all duration-300 pt-16 lg:pt-0
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        `}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
