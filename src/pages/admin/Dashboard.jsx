import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, FileText, HelpCircle, Users,
    TrendingUp, Zap, Target, ChevronRight,
    Plus, BarChart3, Activity
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';
import { adminAPI, coursesAPI } from '../../services/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalCourses: 0,
        totalChapters: 0,
        totalQuizzes: 0,
        pendingRequests: 0
    });
    const [recentCourses, setRecentCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, coursesData] = await Promise.all([
                    adminAPI.getStats(),
                    coursesAPI.getAllAdmin()
                ]);

                setStats(statsData);

                // Sort courses by creation date (assuming _id timestamp or createdAt if available)
                // If createdAt is available:
                const sortedCourses = [...coursesData].sort((a, b) => {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                }).slice(0, 5);
                setRecentCourses(sortedCourses);

            } catch (error) {
                console.error('Failed to fetch admin dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const statItems = [
        {
            label: 'Total Courses',
            value: stats.totalCourses,
            icon: BookOpen,
            color: 'from-primary-500 to-indigo-500',
            link: '/admin/courses',
        },
        {
            label: 'Total Chapters',
            value: stats.totalChapters,
            icon: FileText,
            color: 'from-success-500 to-emerald-500',
            link: '/admin/chapters',
        },
        {
            label: 'Total Quizzes',
            value: stats.totalQuizzes,
            icon: HelpCircle,
            color: 'from-secondary-500 to-purple-500',
            link: '/admin/quizzes',
        },
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'from-warning-500 to-orange-500',
            link: '/admin/users',
        },
    ];

    const quickActions = [
        { label: 'Add Course', icon: BookOpen, path: '/admin/courses?action=new', color: 'primary' },
        { label: 'Add Chapter', icon: FileText, path: '/admin/chapters?action=new', color: 'success' },
        { label: 'Add Quiz', icon: HelpCircle, path: '/admin/quizzes?action=new', color: 'secondary' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Admin Dashboard</h1>
                    <p className="text-[var(--text-secondary)]">Welcome back! Here's an overview of your platform.</p>
                </div>
                <div className="flex gap-2">
                    {quickActions.map((action) => (
                        <Link key={action.label} to={action.path}>
                            <Button variant={action.color} size="sm" leftIcon={<Plus size={16} />}>
                                {action.label}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statItems.map((stat) => (
                    <Link key={stat.label} to={stat.link}>
                        <Card hoverable className="relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                                    <p className="text-3xl font-bold text-[var(--text)] mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Courses */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-[var(--text)]">Recent Courses</h2>
                        <Link to="/admin/courses">
                            <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={16} />}>
                                View All
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentCourses.length === 0 ? (
                            <p className="text-[var(--text-secondary)] text-center py-4">No courses yet.</p>
                        ) : (
                            recentCourses.map((course) => (
                                <div
                                    key={course._id}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface-hover)]"
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[var(--bg)]">
                                        {course.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-[var(--text)] truncate">{course.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                            <span>
                                                {/* Requires fetching chapter counts from stats or course object? 
                                                    The getAllAdmin might not include counts unless updated.
                                                    The /courses (public) endpoint includes counts.
                                                    The /courses/all (admin) endpoints DOES NOT include counts in current implementation.
                                                    Wait, checking courses.js... 
                                                    GET /api/courses/all just does Course.find().
                                                    GET /api/courses DOES calculate counts.
                                                    So admin view might miss counts.
                                                    I should stick to static labels or just not show counts.
                                                */}
                                                {course.difficulty}
                                            </span>
                                            {!course.isPublished && (
                                                <Badge variant="warning" size="sm">Draft</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant={course.difficulty}>{course.difficulty}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Recent Activity (Placeholder) */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-[var(--text)]">Updates</h2>
                    </div>

                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Activity className="w-12 h-12 text-[var(--text-secondary)] mb-4 opacity-50" />
                        <p className="text-[var(--text-secondary)]">
                            Activity feed coming soon in the next update.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
