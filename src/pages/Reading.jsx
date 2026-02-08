import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Clock, BookOpen, Brain,
    CheckCircle, List, ChevronUp, Flag
} from 'lucide-react';
import { Button, Card, ProgressBar, Badge, toast, FeedbackModal } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { coursesAPI, chaptersAPI, progressAPI } from '../services/api';

export default function Reading() {
    const { domainId, chapterId } = useParams();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    const [domain, setDomain] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [nextItem, setNextItem] = useState(null);
    const [prevItem, setPrevItem] = useState(null);
    const [readingProgress, setReadingProgress] = useState(0);
    const [showToc, setShowToc] = useState(false);
    const [toc, setToc] = useState([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    const contentRef = useRef(null);
    const lastScrollPosition = useRef(0);
    const timeStartRef = useRef(Date.now());

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch course, current chapter (with content), and all chapters (for nav) parallel
                const [courseRes, chapterRes, allChaptersRes] = await Promise.all([
                    coursesAPI.getById(domainId),
                    chaptersAPI.getById(chapterId),
                    chaptersAPI.getByCourse(domainId)
                ]);

                if (!courseRes || !chapterRes) {
                    navigate('/explore');
                    return;
                }

                setDomain(courseRes);
                setChapter(chapterRes);

                // Calculate Next/Prev Item
                if (courseRes.learningPath && courseRes.learningPath.length > 0) {
                    const currentIndex = courseRes.learningPath.findIndex(item =>
                        (item.itemId?._id || item.itemId) === chapterId
                    );

                    if (currentIndex !== -1) {
                        setPrevItem(currentIndex > 0 ? courseRes.learningPath[currentIndex - 1] : null);
                        setNextItem(currentIndex < courseRes.learningPath.length - 1 ? courseRes.learningPath[currentIndex + 1] : null);
                    }
                } else {
                    // Fallback to sorted chapters
                    const sortedChapters = allChaptersRes.sort((a, b) => a.order - b.order);
                    const currentIndex = sortedChapters.findIndex(c => c._id === chapterId);

                    if (currentIndex !== -1) {
                        const prev = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
                        const next = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

                        if (prev) setPrevItem({ itemType: 'Chapter', itemId: prev });
                        if (next) setNextItem({ itemType: 'Chapter', itemId: next });
                    }
                }

                // Check completion status from backend
                if (user && user.role !== 'guest') {
                    try {
                        const progressRes = await progressAPI.getByCourse(domainId);
                        const completed = progressRes.completedChapters.some(c =>
                            (c.chapterId?._id || c.chapterId) === chapterId
                        );
                        setIsCompleted(completed);
                    } catch (err) {
                        console.error('Failed to fetch progress:', err);
                    }
                }

                // Restore scroll progress from localStorage
                const savedProgress = JSON.parse(localStorage.getItem('quizmaster-progress') || '{}');
                const readProgress = savedProgress.domains?.[domainId]?.readingProgress?.[chapterId] || 0;
                setReadingProgress(readProgress);

            } catch (error) {
                console.error('Failed to fetch reading data:', error);
                navigate('/explore'); // Or show error
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Reset time tracking
        timeStartRef.current = Date.now();

        // Scroll to top
        window.scrollTo(0, 0);

    }, [domainId, chapterId, navigate, user]);

    // Parse TOC
    useEffect(() => {
        if (chapter?.content) {
            const headings = chapter.content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
            const tocItems = headings.map((h, i) => ({
                id: `heading-${i}`,
                text: h.replace(/<[^>]+>/g, ''),
                level: h.startsWith('<h2') ? 2 : 3,
            }));
            setToc(tocItems);
        }
    }, [chapter]);

    // Track scroll progress
    const handleScroll = useCallback(() => {
        if (!contentRef.current) return;

        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;

        const progress = Math.min(
            Math.round((scrollTop / (documentHeight - windowHeight)) * 100),
            100
        );

        if (progress >= lastScrollPosition.current) {
            setReadingProgress(Math.max(readingProgress, progress));
            lastScrollPosition.current = progress;
        }
    }, [readingProgress]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Save progress locally and sync time
    useEffect(() => {
        return () => {
            if (readingProgress > 0) {
                saveLocalProgress();
            }
            // Sync time spent
            const timeSpentMinutes = (Date.now() - timeStartRef.current) / 1000 / 60;
            if (timeSpentMinutes >= 0.1 && user && user.role !== 'guest') { // Only if spent at least 6 seconds
                progressAPI.updateTime(domainId, Math.round(timeSpentMinutes))
                    .catch(err => console.error('Failed to update time:', err));
            }
        };
    }, [readingProgress, domainId, chapterId, user]);

    const saveLocalProgress = () => {
        const savedProgress = JSON.parse(localStorage.getItem('quizmaster-progress') || '{}');

        if (!savedProgress.domains) savedProgress.domains = {};
        if (!savedProgress.domains[domainId]) savedProgress.domains[domainId] = {};
        if (!savedProgress.domains[domainId].readingProgress) savedProgress.domains[domainId].readingProgress = {};

        savedProgress.domains[domainId].readingProgress[chapterId] = readingProgress;

        localStorage.setItem('quizmaster-progress', JSON.stringify(savedProgress));
    };

    const markAsComplete = async () => {
        if (!user) {
            toast.error('Please login to save progress');
            return;
        }

        try {
            const res = await progressAPI.completeChapter(domainId, chapterId);
            setIsCompleted(true);
            if (res.xpEarned > 0) {
                toast.success(`Chapter completed! +${res.xpEarned} XP`);
            } else {
                toast.success('Chapter marked as complete');
            }
            refreshUser();
        } catch (error) {
            console.error('Failed to mark chapter complete:', error);
            toast.error('Failed to save progress');
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Header removed - handled by CoursePlayerLayout */}

            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex gap-8">
                    {/* Main Content */}
                    <article className="flex-1 min-w-0">
                        {/* Meta Bar */}
                        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)] mb-4 border-b border-[var(--border)] pb-4">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {chapter.estimatedMinutes} min read
                                </span>
                                <span className="hidden sm:flex items-center gap-1.5">
                                    <BookOpen size={14} />
                                    Chapter {chapter.order}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowToc(!showToc)}
                                leftIcon={<List size={14} />}
                                className="md:hidden"
                            >
                                Table of Contents
                            </Button>
                        </div>

                        {/* Chapter Title */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="primary" className="sm:hidden">
                                    Chapter {chapter.order}
                                </Badge>
                                {isCompleted && (
                                    <Badge variant="success" icon={<CheckCircle size={12} />}>
                                        Completed
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">
                                {chapter.title}
                            </h1>
                        </div>

                        {/* Content */}
                        <div
                            ref={contentRef}
                            className="reading-content prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: chapter.content }}
                        />

                        {/* Bottom Actions */}
                        <div className="mt-12 pt-8 border-t border-[var(--border)]">
                            {!isCompleted && (
                                <Button
                                    fullWidth
                                    variant="success"
                                    size="lg"
                                    onClick={markAsComplete}
                                    leftIcon={<CheckCircle size={20} />}
                                    className="mb-6"
                                    disabled={!user || user.role === 'guest'}
                                    title={user?.role === 'guest' ? 'Sign up to save progress' : ''}
                                >
                                    Mark as Complete (+{chapter.xpReward || 50} XP)
                                </Button>
                            )}
                            {(!user || user?.role === 'guest') && !isCompleted && (
                                <p className="text-center text-sm text-[var(--text-secondary)] mb-6">
                                    <Link to="/signup" className="text-primary-400 hover:underline">
                                        {user?.role === 'guest' ? 'Sign Up' : 'Login'}
                                    </Link> to save progress and earn XP
                                </p>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center gap-4">
                                {prevItem ? (
                                    <Link to={
                                        prevItem.itemType === 'Quiz'
                                            ? `/domain/${domainId}/quiz/${prevItem.itemId?._id || prevItem.itemId}`
                                            : `/domain/${domainId}/chapter/${prevItem.itemId?._id || prevItem.itemId}/read`
                                    } className="flex-1">
                                        <Button fullWidth variant="outline" leftIcon={<ArrowLeft size={18} />}>
                                            Previous
                                        </Button>
                                    </Link>
                                ) : (
                                    <div className="flex-1" /> // Spacer
                                )}

                                {nextItem ? (
                                    <Link to={
                                        nextItem.itemType === 'Quiz'
                                            ? `/domain/${domainId}/quiz/${nextItem.itemId?._id || nextItem.itemId}`
                                            : `/domain/${domainId}/chapter/${nextItem.itemId?._id || nextItem.itemId}/read`
                                    } className="flex-1">
                                        <Button fullWidth variant="primary" rightIcon={<ArrowRight size={18} />}>
                                            Next
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link to={`/domain/${domainId}`} className="flex-1">
                                        <Button fullWidth rightIcon={<CheckCircle size={18} />}>
                                            Finish Course
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </article>

                    {/* Table of Contents Sidebar - Desktop */}
                    {showToc && toc.length > 0 && (
                        <aside className="hidden md:block w-64 flex-shrink-0">
                            <div className="sticky top-44">
                                <Card>
                                    <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
                                        Table of Contents
                                    </h3>
                                    <nav className="space-y-1">
                                        {toc.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                className={`
                                                    block text-sm py-1 transition-colors
                                                    ${item.level === 3 ? 'pl-4' : ''}
                                                    text-[var(--text-secondary)] hover:text-primary-400
                                                `}
                                            >
                                                {item.text}
                                            </a>
                                        ))}
                                    </nav>
                                </Card>
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {/* Scroll to Top Button */}
            {readingProgress > 20 && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 p-3 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-all z-40"
                >
                    <ChevronUp size={24} />
                </button>
            )}

            {/* Report Issue Floating Button */}
            <button
                onClick={() => setFeedbackOpen(true)}
                className="fixed bottom-6 left-6 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-primary-500 shadow-lg transition-all z-40 flex items-center gap-2"
            >
                <Flag size={16} />
                <span className="hidden sm:inline">Report Issue</span>
            </button>

            {/* Feedback Modal */}
            {chapter && (
                <FeedbackModal
                    isOpen={feedbackOpen}
                    onClose={() => setFeedbackOpen(false)}
                    feedbackType="chapter"
                    contentId={chapter._id}
                    contentTitle={chapter.title}
                    courseId={domain?._id}
                    chapterId={chapter._id}
                />
            )}
        </div>
    );
}
