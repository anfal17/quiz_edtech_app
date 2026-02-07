import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, Flame, Trophy, Target, BookOpen,
    TrendingUp, Award, ChevronRight, Calendar,
    CheckCircle, Clock, Star
} from 'lucide-react';
import { Button, Card, Badge, ProgressBar, CircularProgress } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { progressAPI } from '../services/api';
import { ACHIEVEMENTS } from '../constants';

export default function Dashboard() {
    const { user } = useAuth();
    const [progressData, setProgressData] = useState([]);
    const [stats, setStats] = useState({
        xp: 0,
        streak: 0,
        quizzes: 0,
        avgScore: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allProgress, statsOverview] = await Promise.all([
                    progressAPI.getAll(),
                    progressAPI.getStats()
                ]);

                setProgressData(allProgress);

                // Calculate average score manually as it's not in stats endpoint
                let totalScore = 0;
                let totalQuizzes = 0;
                allProgress.forEach(p => {
                    p.quizResults.forEach(qr => {
                        totalScore += qr.score;
                        totalQuizzes++;
                    });
                });

                setStats({
                    ...statsOverview,
                    avgScore: totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0,
                    quizzes: totalQuizzes
                });

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const level = useMemo(() => {
        const xp = stats.xp || 0;
        // Level thresholds
        const levels = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];
        let currentLevel = 1;
        let nextLevelXP = 100;
        let currentLevelXP = 0;

        for (let i = 0; i < levels.length; i++) {
            if (xp >= levels[i]) {
                currentLevel = i + 1;
                currentLevelXP = levels[i];
                nextLevelXP = levels[i + 1] || levels[i] * 2;
            }
        }

        return {
            level: currentLevel,
            currentXP: xp - currentLevelXP,
            neededXP: nextLevelXP - currentLevelXP,
            totalXP: xp,
        };
    }, [stats.xp]);

    const recentActivity = useMemo(() => {
        const allActivity = [];
        progressData.forEach(p => {
            p.quizResults.forEach(qr => {
                allActivity.push({
                    type: 'quiz',
                    score: qr.score,
                    correctAnswers: Math.round(qr.score / 100 * 5), // Approximation if question count not stored
                    totalQuestions: 5, // Approximation
                    attemptedAt: qr.completedAt,
                    courseTitle: p.courseId.title
                });
            });
        });
        return allActivity.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt)).slice(0, 5);
    }, [progressData]);

    const inProgressDomains = useMemo(() => {
        return progressData.map(p => ({
            id: p.courseId._id,
            title: p.courseId.title,
            icon: p.courseId.icon,
            color: p.courseId.color,
            total: p.totalChapters,
            completed: p.completedChapters.length,
            percentage: p.completionPercentage
        })).filter(d => d.percentage < 100);
    }, [progressData]);

    const unlockedAchievements = stats.achievements || [];

    // Streak calendar (last 7 days)
    const streakDays = useMemo(() => {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Check if there's activity on this day from quiz results
            const hasActivity = progressData.some(p =>
                p.quizResults?.some(qr =>
                    new Date(qr.completedAt).toISOString().split('T')[0] === dateStr
                ) ||
                p.completedChapters?.some(cc =>
                    new Date(cc.completedAt).toISOString().split('T')[0] === dateStr
                )
            );

            days.push({
                date,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                hasActivity,
                isToday: i === 0,
            });
        }

        return days;
    }, [progressData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">
                        Welcome back! 👋
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={Zap}
                        label="Total XP"
                        value={stats.xp.toLocaleString()}
                        color="from-secondary-500 to-primary-500"
                    />
                    <StatCard
                        icon={Flame}
                        label="Current Streak"
                        value={`${stats.streak} days`}
                        color="from-warning-500 to-orange-500"
                        animate={stats.streak > 0}
                    />
                    <StatCard
                        icon={Target}
                        label="Quizzes Taken"
                        value={stats.quizzes}
                        color="from-primary-500 to-cyan-500"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Avg Score"
                        value={`${stats.avgScore}%`}
                        color="from-success-500 to-emerald-400"
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Level Progress */}
                        <Card>
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <CircularProgress
                                        value={level.currentXP}
                                        max={level.neededXP}
                                        size={100}
                                        variant="xp"
                                        showLabel={false}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-[var(--text)]">
                                            {level.level}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-[var(--text)] mb-1">
                                        Level {level.level}
                                    </h3>
                                    <ProgressBar
                                        value={level.currentXP}
                                        max={level.neededXP}
                                        variant="xp"
                                        size="lg"
                                        showLabel
                                        label={`${level.currentXP} / ${level.neededXP} XP to Level ${level.level + 1}`}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Continue Learning */}
                        {inProgressDomains.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-[var(--text)]">Continue Learning</h2>
                                    <Link to="/explore">
                                        <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={16} />}>
                                            View All
                                        </Button>
                                    </Link>
                                </div>
                                <div className="space-y-3">
                                    {inProgressDomains.map((domain) => (
                                        <Link key={domain.id} to={`/domain/${domain.id}`}>
                                            <Card hoverable className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-[var(--surface-hover)] flex items-center justify-center text-2xl">
                                                    {domain.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-[var(--text)] truncate">
                                                        {domain.title}
                                                    </h3>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        {domain.completed} of {domain.total} chapters
                                                    </div>
                                                    <ProgressBar
                                                        value={domain.completed}
                                                        max={domain.total}
                                                        size="sm"
                                                        variant="primary"
                                                        className="mt-2"
                                                    />
                                                </div>
                                                <Button variant="primary" size="sm">
                                                    Continue
                                                </Button>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Recent Activity</h2>
                            {recentActivity.length > 0 ? (
                                <Card>
                                    <div className="space-y-4">
                                        {recentActivity.map((activity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0"
                                            >
                                                <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center
                          ${activity.score >= 80
                                                        ? 'bg-success-500/20 text-success-400'
                                                        : activity.score >= 60
                                                            ? 'bg-warning-500/20 text-warning-400'
                                                            : 'bg-error-500/20 text-error-400'
                                                    }
                        `}>
                                                    {activity.score >= 80 ? <Trophy size={20} /> : <Target size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-[var(--text)] truncate">
                                                        Quiz Completed
                                                    </div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        Score: {activity.score}% • {activity.correctAnswers}/{activity.totalQuestions} correct
                                                    </div>
                                                </div>
                                                <div className="text-sm text-[var(--text-secondary)]">
                                                    {new Date(activity.attemptedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ) : (
                                <Card className="text-center py-8">
                                    <BookOpen className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
                                    <p className="text-[var(--text-secondary)]">No activity yet</p>
                                    <Link to="/explore" className="mt-4 inline-block">
                                        <Button variant="primary">Start Learning</Button>
                                    </Link>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Streak Calendar */}
                        <Card>
                            <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-warning-500" />
                                Weekly Streak
                            </h3>
                            <div className="flex justify-between">
                                {streakDays.map((day, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-xs text-[var(--text-secondary)] mb-2">
                                            {day.dayName}
                                        </div>
                                        <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      ${day.hasActivity
                                                ? 'bg-success-500 text-white'
                                                : day.isToday
                                                    ? 'bg-warning-500/20 border-2 border-dashed border-warning-500'
                                                    : 'bg-[var(--surface-hover)]'
                                            }
                    `}>
                                            {day.hasActivity ? (
                                                <CheckCircle size={18} />
                                            ) : day.isToday ? (
                                                <Star size={16} className="text-warning-500" />
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {stats.streak > 0 && (
                                <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
                                    🔥 {stats.streak} day streak! Keep it going!
                                </p>
                            )}
                        </Card>

                        {/* Achievements */}
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[var(--text)]">Achievements</h3>
                                <Badge variant="primary">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {ACHIEVEMENTS.slice(0, 8).map((achievement) => {
                                    const isUnlocked = unlockedAchievements.includes(achievement.id);
                                    return (
                                        <div
                                            key={achievement.id}
                                            className={`
                        aspect-square rounded-xl flex items-center justify-center text-2xl
                        transition-all cursor-pointer
                        ${isUnlocked
                                                    ? 'bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30'
                                                    : 'bg-[var(--surface-hover)] opacity-40 grayscale'
                                                }
                      `}
                                            title={isUnlocked ? achievement.name : '???'}
                                        >
                                            {isUnlocked ? achievement.icon : '🔒'}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <h3 className="text-lg font-bold text-[var(--text)] mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link to="/explore">
                                    <Button variant="outline" fullWidth leftIcon={<BookOpen size={18} />}>
                                        Explore Domains
                                    </Button>
                                </Link>
                                <Link to="/create-quiz">
                                    <Button variant="outline" fullWidth leftIcon={<Target size={18} />}>
                                        Create Quiz
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, animate = false }) {
    return (
        <Card className="relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-20 blur-xl`} />
            <div className="relative">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 text-white ${animate ? 'animate-fire' : ''}`} />
                </div>
                <div className="text-2xl font-bold text-[var(--text)]">{value}</div>
                <div className="text-sm text-[var(--text-secondary)]">{label}</div>
            </div>
        </Card>
    );
}
