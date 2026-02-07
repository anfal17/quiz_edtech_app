import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, BookOpen, Brain, Flame, Zap,
    ChevronRight, Filter, Star
} from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { coursesAPI, progressAPI } from '../services/api';

export default function Landing() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProgress, setUserProgress] = useState({
        xp: 0,
        streak: 0,
        inProgressCount: 0
    });
    const [inProgressCourses, setInProgressCourses] = useState([]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await coursesAPI.getAll();
                setCourses(data);
            } catch (error) {
                console.error('Failed to fetch courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    useEffect(() => {
        const fetchProgress = async () => {
            if (user) {
                try {
                    const [stats, progress] = await Promise.all([
                        progressAPI.getStats(),
                        progressAPI.getAll()
                    ]);

                    setUserProgress({
                        xp: stats.xp,
                        streak: stats.streak?.current || 0,
                        inProgressCount: stats.coursesStarted
                    });

                    // Map progress to in-progress courses
                    const inProgress = progress.map(p => ({
                        id: p.courseId._id,
                        title: p.courseId.title,
                        icon: p.courseId.icon,
                        // Fix: handle color if it's missing or ensure backend sends it
                        color: p.courseId.color,
                        totalChapters: p.totalChapters,
                        completed: p.completedChapters.length,
                        percentage: p.completionPercentage
                    })).filter(c => c.percentage < 100);

                    setInProgressCourses(inProgress);

                } catch (error) {
                    console.error('Failed to fetch progress:', error);
                }
            }
        };

        fetchProgress();
    }, [user]);

    // Filter courses based on search and category
    const filteredCourses = useMemo(() => {
        let result = [...courses];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.title.toLowerCase().includes(query) ||
                    c.description.toLowerCase().includes(query) ||
                    c.tags.some((t) => t.toLowerCase().includes(query))
            );
        }

        if (selectedCategory !== 'all') {
            result = result.filter((c) => c.tags.includes(selectedCategory));
        }

        return result;
    }, [courses, searchQuery, selectedCategory]);

    // Get unique categories from courses
    const categories = useMemo(() => {
        const allTags = [...new Set(courses.flatMap((c) => c.tags))];
        return ['all', ...allTags];
    }, [courses]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Header with Stats */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
                                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                            </h1>
                            <p className="text-[var(--text-secondary)] mt-1">
                                Start your journey of Islamic knowledge
                            </p>
                        </div>

                        {/* Quick Stats - Only show if logged in */}
                        {user && (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-500/10 border border-secondary-500/30">
                                    <Zap className="w-5 h-5 text-secondary-400" />
                                    <span className="font-bold text-secondary-400">{userProgress.xp} XP</span>
                                </div>
                                {userProgress.streak > 0 && (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning-500/10 border border-warning-500/30">
                                        <Flame className="w-5 h-5 text-warning-400" />
                                        <span className="font-bold text-warning-400">{userProgress.streak} days</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search courses, topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="
                w-full pl-12 pr-4 py-3 rounded-xl
                bg-[var(--surface)] border border-[var(--border)]
                text-[var(--text)] placeholder:text-[var(--text-secondary)]
                focus:outline-none focus:ring-2 focus:ring-primary-500
                transition-all
              "
                        />
                    </div>
                </div>

                {/* Continue Learning Section */}
                {user && inProgressCourses.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary-400" />
                                Continue Learning
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inProgressCourses.slice(0, 3).map((course) => (
                                <Link key={course.id} to={`/domain/${course.id}`}>
                                    <Card hoverable className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-[var(--surface-hover)] flex items-center justify-center text-2xl flex-shrink-0">
                                            {course.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[var(--text)] truncate">
                                                {course.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <ProgressBar value={course.percentage} max={100} size="sm" className="flex-1" />
                                                <span className="text-xs text-[var(--text-secondary)]">{course.percentage}%</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Category Filter */}
                <section className="mb-6">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  transition-colors
                  ${selectedCategory === category
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                                    }
                `}
                            >
                                {category === 'all' ? 'All Courses' : category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Available Courses Grid */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[var(--text)]">
                            Available Courses
                            <span className="text-sm font-normal text-[var(--text-secondary)] ml-2">
                                ({filteredCourses.length})
                            </span>
                        </h2>
                        <Link to="/explore">
                            <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={16} />}>
                                View All
                            </Button>
                        </Link>
                    </div>

                    {filteredCourses.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCourses.map((course, index) => (
                                <DomainCard key={course._id} domain={course} index={index} />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-12">
                            <Search className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-[var(--text)] mb-2">No courses found</h3>
                            <p className="text-[var(--text-secondary)]">
                                Try adjusting your search or filters
                            </p>
                        </Card>
                    )}
                </section>

                {/* Quick Actions */}
                <section className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link to="/dashboard">
                        <Card hoverable className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--text)]">My Progress</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Track your learning journey</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] ml-auto" />
                        </Card>
                    </Link>

                    <Link to="/create-quiz">
                        <Card hoverable className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-emerald-400 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--text)]">Create Quiz</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Build your own quizzes</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] ml-auto" />
                        </Card>
                    </Link>

                    <Link to="/about">
                        <Card hoverable className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-500 to-orange-400 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--text)]">About</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Learn more about us</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] ml-auto" />
                        </Card>
                    </Link>
                </section>
            </div>
        </div>
    );
}

function DomainCard({ domain, index }) {
    // For Landing page, we don't necessarily show progress on the card unless we have it passed down
    // or we fetch it. simpler to just show course info.
    // If we want progress, we need to pass it from parent or lookup from userProgress context/state

    // NOTE: domain is actually a course object from backend now
    // Backend course object: { _id, title, description, icon, difficulty, tags, color, totalChapters, totalQuizzes }

    return (
        <Link to={`/domain/${domain._id}`}>
            <Card
                variant="default"
                padding="none"
                hoverable
                className="overflow-hidden animate-fade-in-up h-full"
                style={{ animationDelay: `${index * 50}ms` }}
            >
                {/* Cover - Generating a cover or using a default if not present */}
                <div className="relative h-32 overflow-hidden">
                    {/* Using a gradient background instead of image if image missing */}
                    <div className={`w-full h-full bg-gradient-to-br ${domain.color}`} />

                    <div className="absolute top-3 left-3 text-3xl">{domain.icon}</div>
                    <div className="absolute top-3 right-3">
                        <Badge variant={domain.difficulty} size="sm">
                            {domain.difficulty}
                        </Badge>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-bold text-[var(--text)] mb-1 line-clamp-1">{domain.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                        {domain.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mb-3">
                        <span>{domain.totalChapters} chapters</span>
                        <span>•</span>
                        <span>{domain.totalQuizzes} quizzes</span>
                    </div>

                    {/* We can skip progress bar here for simplicity or add it back if we want to join data */}
                </div>
            </Card>
        </Link>
    );
}
