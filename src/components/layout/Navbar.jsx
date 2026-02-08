import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui';
import {
    Menu, X, Search, Sun, Moon, Flame, Zap,
    BookOpen, Home, LayoutDashboard, Info, User, LogOut, Settings, Shield,
    Compass, PlusCircle, LayoutGrid, LifeBuoy, MessageSquare
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS, ROLES } from '../../constants';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, isAdmin, isGuest, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const isActive = (path) => location.pathname === path;

    const links = [
        { label: 'Home', path: NAV_LINKS.HOME, icon: Home },
        { label: 'Explore', path: NAV_LINKS.EXPLORE, icon: Compass },
        { label: 'Create Quiz', path: NAV_LINKS.CREATE_QUIZ, icon: PlusCircle },
        { label: 'About', path: NAV_LINKS.ABOUT, icon: LayoutGrid },
    ];


    const handleLogout = () => {
        logout();
        setIsProfileOpen(false);
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <span className="text-xl">📖</span>
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:block">
                            Ilm Path
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl
                  font-medium transition-all duration-200
                  ${isActive(link.path)
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                                    }
                `}
                            >
                                <link.icon size={18} />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Search Button */}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                            aria-label="Search"
                        >
                            <Search size={20} />
                        </button>

                        {/* User Stats (Desktop - only when logged in) */}
                        {isAuthenticated && (
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-500/10 border border-warning-500/30">
                                    <Flame className="w-4 h-4 text-warning-500 animate-fire" />
                                    <span className="text-sm font-bold text-warning-400">{user?.streak?.current || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/30">
                                    <Zap className="w-4 h-4 text-secondary-400" />
                                    <span className="text-sm font-bold text-secondary-400">{user?.xp || 0} XP</span>
                                </div>
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Auth Buttons / User Menu */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-lg">
                                        {user?.avatar || '👤'}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-[var(--text)]">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                </button>

                                {isProfileOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsProfileOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-3 border-b border-[var(--border)]">
                                                <p className="font-medium text-[var(--text)]">{user?.name}</p>
                                                {isGuest ? (
                                                    <p className="text-xs text-warning-400 mt-1">Progress not saved</p>
                                                ) : (
                                                    <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
                                                )}
                                            </div>

                                            {isGuest && (
                                                <div className="p-2 bg-primary-500/10 m-2 rounded-lg">
                                                    <p className="text-xs text-[var(--text-secondary)] mb-2">Create an account to save your progress and streaks.</p>
                                                    <Button
                                                        size="sm"
                                                        fullWidth
                                                        onClick={() => {
                                                            logout(); // Clear guest
                                                            navigate('/signup');
                                                        }}
                                                    >
                                                        Sign Up Now
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="py-2">
                                                {!isGuest && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setIsProfileOpen(false);
                                                                navigate(NAV_LINKS.PROFILE);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] text-left"
                                                        >
                                                            <User size={18} />
                                                            Profile
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setIsProfileOpen(false);
                                                                navigate(NAV_LINKS.SETTINGS);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] text-left"
                                                        >
                                                            <Settings size={18} />
                                                            Settings
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        navigate(NAV_LINKS.SUPPORT);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] text-left"
                                                >
                                                    <LifeBuoy size={18} />
                                                    Support
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        navigate('/my-feedback');
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] text-left"
                                                >
                                                    <MessageSquare size={18} />
                                                    My Feedback
                                                </button>
                                                {(user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN) && (
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileOpen(false);
                                                            navigate(NAV_LINKS.ADMIN);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-primary-400 hover:bg-[var(--surface-hover)] text-left"
                                                    >
                                                        <LayoutDashboard size={18} />
                                                        Admin Dashboard
                                                    </button>
                                                )}
                                            </div>
                                            <div className="py-2 border-t border-[var(--border)]">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 px-4 py-2 w-full text-error-400 hover:bg-[var(--surface-hover)]"
                                                >
                                                    <LogOut size={18} />
                                                    {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90 transition-opacity"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Search Bar (Expandable) */}
                {isSearchOpen && (
                    <div className="pb-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                placeholder="Search domains, quizzes, chapters..."
                                className="
                  w-full pl-12 pr-4 py-3 rounded-xl
                  bg-[var(--surface)] border border-[var(--border)]
                  text-[var(--text)] placeholder:text-[var(--text-secondary)]
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  transition-all
                "
                                autoFocus
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)]">
                    <div className="px-4 py-4 space-y-2">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  font-medium transition-all duration-200
                  ${isActive(link.path)
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                                    }
                `}
                            >
                                <link.icon size={20} />
                                {link.label}
                            </Link>
                        ))}

                        {/* Mobile Auth */}
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
                                >
                                    <User size={20} />
                                    Profile
                                </Link>
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-400 hover:bg-[var(--surface-hover)]"
                                    >
                                        <Shield size={20} />
                                        Admin Panel
                                    </Link>
                                )}
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-error-400 hover:bg-[var(--surface-hover)]"
                                >
                                    <LogOut size={20} />
                                    Sign Out
                                </button>

                                {/* Mobile Stats */}
                                <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[var(--border)]">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-500/10 border border-warning-500/30">
                                        <Flame className="w-4 h-4 text-warning-500" />
                                        <span className="text-sm font-bold text-warning-400">{user?.streak?.current || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/30">
                                        <Zap className="w-4 h-4 text-secondary-400" />
                                        <span className="text-sm font-bold text-secondary-400">{user?.xp || 0} XP</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex gap-2 pt-4 mt-4 border-t border-[var(--border)]">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        navigate('/login');
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl text-center font-medium text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)]"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        navigate('/signup');
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl text-center font-medium bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
