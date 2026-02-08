import { useState, useEffect } from 'react';
import { Outlet, useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, ChevronRight, CheckCircle, Brain, BookOpen, X } from 'lucide-react';
import { Button, ProgressBar, Badge, Card } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { coursesAPI, chaptersAPI, progressAPI } from '../../services/api';

export default function CoursePlayerLayout() {
    const { domainId, chapterId, quizId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [domain, setDomain] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [completedItems, setCompletedItems] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);

    // Fetch Course & Progress
    useEffect(() => {
        const fetchData = async () => {
            try {
                const courseData = await coursesAPI.getById(domainId);
                setDomain(courseData);

                if (user && user.role !== 'guest') {
                    try {
                        const progressData = await progressAPI.getByCourse(domainId);

                        // normalize completed items IDs
                        const completedCh = progressData.completedChapters.map(c =>
                            typeof c.chapterId === 'object' ? c.chapterId._id : c.chapterId
                        );

                        const completedQz = progressData.quizResults?.filter(q => q.passed).map(q => q.quizId) || [];
                        const allCompleted = [...completedCh, ...completedQz];

                        setCompletedItems(allCompleted);
                        setProgress({
                            completed: progressData.totalChapters > 0
                                ? Math.round((allCompleted.length / progressData.totalChapters) * 100)
                                : 0,
                            total: progressData.totalChapters,
                            count: allCompleted.length
                        });
                    } catch (err) {
                        console.error('Failed to fetch progress', err);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch course', error);
                // navigate('/explore');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [domainId, user, location.pathname]); // Re-fetch on nav changes to update progress

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!domain) return null;

    // Determine current item title and index
    let currentItemTitle = '';
    let currentIndex = -1;
    let totalItems = domain.learningPath?.length || 0;

    if (domain.learningPath) {
        currentIndex = domain.learningPath.findIndex(item => {
            const id = item.itemId?._id || item.itemId;
            return id === (chapterId || quizId);
        });

        if (currentIndex !== -1) {
            const currentItem = domain.learningPath[currentIndex];
            if (currentItem?.itemId?.title) {
                currentItemTitle = currentItem.itemId.title;
            }
        }
    }

    return (
        <div className="h-screen bg-[var(--bg)] flex flex-col overflow-hidden">
            {/* Top Navbar */}
            <header className="flex-shrink-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] h-16">
                <div className="h-full px-4 flex items-center justify-between gap-4">
                    {/* Left: Back & Title */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Link to={`/domain/${domainId}`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>

                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm font-medium text-[var(--text-secondary)] truncate">
                                {domain.title}
                            </h1>
                            <div className="text-base font-bold text-[var(--text)] truncate flex items-center gap-2">
                                {currentItemTitle || 'Loading...'}
                            </div>
                        </div>
                    </div>

                    {/* Right: Progress & Menu (Mobile Only Toggle) */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="hidden md:block w-32">
                            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                                <span>{progress.completed}% Complete</span>
                            </div>
                            <ProgressBar value={progress.completed} max={100} size="sm" variant="success" />
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="lg:hidden">
                            <Button variant="ghost" size="sm" onClick={() => setMenuOpen(true)}>
                                <Menu size={20} />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-80 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="font-bold text-lg mb-2">Course Content</h2>
                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                            <span>{progress.count} / {progress.total} Completed</span>
                        </div>
                        <ProgressBar value={progress.completed} max={100} size="sm" variant="success" />
                        {user?.role === 'guest' && (
                            <p className="text-xs text-warning-400 mt-2 text-center">
                                Sign up to track progress
                            </p>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {domain.learningPath?.map((item, idx) => {
                            if (!item.itemId) return null;
                            const id = item.itemId._id || item.itemId;
                            const isCurrent = id === (chapterId || quizId);
                            const isDone = completedItems.includes(id);
                            const title = item.itemId.title || `Item ${idx + 1}`;
                            const icon = item.itemType === 'Quiz' ? <Brain size={14} /> : <BookOpen size={14} />;

                            return (
                                <Link
                                    key={idx}
                                    to={item.itemType === 'Quiz'
                                        ? `/domain/${domainId}/quiz/${id}`
                                        : `/domain/${domainId}/chapter/${id}/read`
                                    }
                                >
                                    <div className={`
                                        p-3 rounded-lg flex items-center gap-3 text-sm transition-colors
                                        ${isCurrent
                                            ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                                            : 'hover:bg-[var(--surface-hover)] text-[var(--text)]'
                                        }
                                    `}>
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                                            ${isDone ? 'bg-success-500 text-white' : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'}
                                        `}>
                                            {isDone ? <CheckCircle size={12} /> : <span>{idx + 1}</span>}
                                        </div>
                                        <div className="flex-1 truncate font-medium">
                                            {title}
                                        </div>
                                        <div className="text-[var(--text-secondary)]">
                                            {icon}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </aside>

                {/* Mobile Menu Sidebar (Drawer) */}
                {menuOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                            onClick={() => setMenuOpen(false)}
                        />

                        {/* Sidebar Panel */}
                        <div className="relative w-80 h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl animate-slide-in-right flex flex-col">
                            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                                <h2 className="font-bold text-lg">Course Content</h2>
                                <Button variant="ghost" size="sm" onClick={() => setMenuOpen(false)}>
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="p-4 bg-[var(--surface-hover)]">
                                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                                    <span>Course Progress</span>
                                    <span>{progress.completed}%</span>
                                </div>
                                <ProgressBar value={progress.completed} max={100} size="sm" variant="success" />
                                {user?.role === 'guest' && (
                                    <p className="text-xs text-warning-400 mt-2 text-center">
                                        Sign up to track progress
                                    </p>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {domain.learningPath?.map((item, idx) => {
                                    if (!item.itemId) return null;
                                    const id = item.itemId._id || item.itemId;
                                    const isCurrent = id === (chapterId || quizId);
                                    const isDone = completedItems.includes(id);
                                    const title = item.itemId.title || `Item ${idx + 1}`;
                                    const icon = item.itemType === 'Quiz' ? <Brain size={14} /> : <BookOpen size={14} />;

                                    return (
                                        <Link
                                            key={idx}
                                            to={item.itemType === 'Quiz'
                                                ? `/domain/${domainId}/quiz/${id}`
                                                : `/domain/${domainId}/chapter/${id}/read`
                                            }
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <div className={`
                                                p-3 rounded-lg flex items-center gap-3 text-sm transition-colors
                                                ${isCurrent
                                                    ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                                                    : 'hover:bg-[var(--surface-hover)] text-[var(--text)]'
                                                }
                                            `}>
                                                <div className={`
                                                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                                                    ${isDone ? 'bg-success-500 text-white' : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'}
                                                `}>
                                                    {isDone ? <CheckCircle size={12} /> : <span>{idx + 1}</span>}
                                                </div>
                                                <div className="flex-1 truncate font-medium">
                                                    {title}
                                                </div>
                                                <div className="text-[var(--text-secondary)]">
                                                    {icon}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 w-full overflow-y-auto bg-[var(--bg)] custom-scrollbar">
                    <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-full">
                        <Outlet context={{ domain, progress, completedItems, refreshProgress: () => { } }} />
                    </div>
                </main>
            </div>
        </div>
    );
}
