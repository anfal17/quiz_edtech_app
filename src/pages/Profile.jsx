import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    User, Mail, Award, Flame, Zap, Trophy, Clock, BookOpen,
    Settings, HelpCircle, ChevronRight, Star, Target, TrendingUp,
    Camera
} from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { progressAPI } from '../services/api';
import { ACHIEVEMENTS, AVATAR_OPTIONS, NAV_LINKS } from '../constants';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', avatar: '' });

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (user) {
            setEditForm({ name: user.name || '', avatar: user.avatar || '👤' });
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const data = await progressAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            await updateProfile(editForm);
            setEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    const userAchievements = user?.achievements || [];
    const level = Math.floor((user?.xp || 0) / 500) + 1;
    const xpToNext = 500 - ((user?.xp || 0) % 500);
    const progressPercent = (((user?.xp || 0) % 500) / 500) * 100;

    const avatarOptions = AVATAR_OPTIONS;

    if (!user) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[var(--text-secondary)]">Please log in to view your profile</p>
                    <Link to="/login" className="text-primary-400 hover:underline">Sign In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <Card className="relative overflow-hidden mb-8">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-secondary-500/20" />

                    <div className="relative p-8">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-5xl shadow-lg">
                                    {user.avatar || '👤'}
                                </div>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="absolute -bottom-2 -right-2 p-2 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg hover:bg-[var(--surface-hover)] transition-colors"
                                >
                                    <Camera size={16} className="text-[var(--text-secondary)]" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-3">
                                    <h1 className="text-2xl font-bold text-[var(--text)]">{user.name}</h1>
                                    {user.role !== 'user' && (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-400">
                                            {user.role === 'superadmin' ? '👑 Super Admin' : '🛡️ Admin'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[var(--text-secondary)] flex items-center justify-center sm:justify-start gap-2 mt-1">
                                    <Mail size={16} />
                                    {user.email}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)] mt-2">
                                    Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
                                </p>
                            </div>

                            {/* Level Badge */}
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center shadow-lg">
                                    <div>
                                        <div className="text-2xl font-bold text-white">{level}</div>
                                        <div className="text-xs text-white/80">LEVEL</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="mt-8">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-[var(--text-secondary)]">
                                    <Zap className="inline w-4 h-4 text-secondary-400 mr-1" />
                                    {user.xp || 0} XP
                                </span>
                                <span className="text-[var(--text-secondary)]">{xpToNext} XP to Level {level + 1}</span>
                            </div>
                            <div className="h-3 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-secondary-500 to-secondary-400 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4 text-center">
                        <Flame className="w-8 h-8 mx-auto mb-2 text-warning-500" />
                        <div className="text-2xl font-bold text-[var(--text)]">{user.streak?.current || 0}</div>
                        <div className="text-sm text-[var(--text-secondary)]">Day Streak</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <Trophy className="w-8 h-8 mx-auto mb-2 text-primary-400" />
                        <div className="text-2xl font-bold text-[var(--text)]">{userAchievements.length}</div>
                        <div className="text-sm text-[var(--text-secondary)]">Achievements</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-success-400" />
                        <div className="text-2xl font-bold text-[var(--text)]">{stats?.completedChapters || 0}</div>
                        <div className="text-sm text-[var(--text-secondary)]">Chapters Done</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-info-400" />
                        <div className="text-2xl font-bold text-[var(--text)]">{Math.round((stats?.totalTimeSpent || 0) / 60)}h</div>
                        <div className="text-sm text-[var(--text-secondary)]">Time Spent</div>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Achievements */}
                        <Card>
                            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                                    <Trophy className="text-primary-400" />
                                    Achievements
                                </h2>
                                <span className="text-sm text-[var(--text-secondary)]">
                                    {userAchievements.length}/{ACHIEVEMENTS.length} Unlocked
                                </span>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {ACHIEVEMENTS.map((achievement) => {
                                        const unlocked = userAchievements.includes(achievement.id);
                                        return (
                                            <div
                                                key={achievement.id}
                                                className={`
                          p-4 rounded-xl text-center transition-all
                          ${unlocked
                                                        ? 'bg-primary-500/10 border border-primary-500/30'
                                                        : 'bg-[var(--surface-hover)] opacity-50'
                                                    }
                        `}
                                            >
                                                <div className="text-3xl mb-2">{achievement.icon}</div>
                                                <div className={`text-sm font-medium ${unlocked ? 'text-[var(--text)]' : 'text-[var(--text-secondary)]'}`}>
                                                    {achievement.name}
                                                </div>
                                                <div className="text-xs text-[var(--text-secondary)] mt-1">
                                                    +{achievement.xp} XP
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <div className="p-4 border-b border-[var(--border)]">
                                <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                                    <TrendingUp className="text-success-400" />
                                    Learning Progress
                                </h2>
                            </div>
                            <div className="p-4">
                                {stats?.coursesInProgress?.length > 0 ? (
                                    <div className="space-y-4">
                                        {stats.coursesInProgress.slice(0, 3).map((course, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center text-2xl">
                                                    {course.icon || '📚'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-[var(--text)]">{course.title}</div>
                                                    <div className="h-2 bg-[var(--surface-hover)] rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                                                            style={{ width: `${course.progress || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium text-[var(--text-secondary)]">
                                                    {course.progress || 0}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Start learning to see your progress here!</p>
                                        <Link to="/explore" className="text-primary-400 hover:underline mt-2 inline-block">
                                            Explore Courses →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Quick Actions */}
                    <div className="space-y-4">
                        <Card>
                            <div className="p-4 border-b border-[var(--border)]">
                                <h3 className="font-semibold text-[var(--text)]">Quick Actions</h3>
                            </div>
                            <div className="divide-y divide-[var(--border)]">
                                <Link
                                    to="/settings"
                                    className="flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Settings className="text-[var(--text-secondary)]" size={20} />
                                        <span className="text-[var(--text)]">Account Settings</span>
                                    </div>
                                    <ChevronRight className="text-[var(--text-secondary)]" size={20} />
                                </Link>
                                <Link
                                    to="/support"
                                    className="flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <HelpCircle className="text-[var(--text-secondary)]" size={20} />
                                        <span className="text-[var(--text)]">Support & Help</span>
                                    </div>
                                    <ChevronRight className="text-[var(--text-secondary)]" size={20} />
                                </Link>
                                <Link
                                    to="/my-requests"
                                    className="flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Star className="text-[var(--text-secondary)]" size={20} />
                                        <span className="text-[var(--text)]">My Content Requests</span>
                                    </div>
                                    <ChevronRight className="text-[var(--text-secondary)]" size={20} />
                                </Link>
                            </div>
                        </Card>

                        {/* Streak Info */}
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-warning-500/20 flex items-center justify-center">
                                    <Flame className="w-8 h-8 text-warning-500" />
                                </div>
                                <div>
                                    <div className="font-semibold text-[var(--text)]">
                                        {user.streak?.current || 0} Day Streak
                                    </div>
                                    <div className="text-sm text-[var(--text-secondary)]">
                                        Best: {user.streak?.longest || 0} days
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-3">
                                Keep learning daily to maintain your streak and earn bonus XP!
                            </p>
                        </Card>
                    </div>
                </div>

                {/* Edit Profile Modal */}
                {editing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <Card className="w-full max-w-md">
                            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-[var(--text)]">Edit Profile</h3>
                                <button onClick={() => setEditing(false)} className="text-[var(--text-secondary)] hover:text-[var(--text)]">
                                    ✕
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Avatar Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Avatar</label>
                                    <div className="flex flex-wrap gap-2">
                                        {avatarOptions.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => setEditForm({ ...editForm, avatar: emoji })}
                                                className={`
                          w-12 h-12 rounded-xl text-2xl transition-all
                          ${editForm.avatar === emoji
                                                        ? 'bg-primary-500/20 border-2 border-primary-500'
                                                        : 'bg-[var(--surface-hover)] hover:bg-[var(--surface)]'
                                                    }
                        `}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button variant="ghost" onClick={() => setEditing(false)} fullWidth>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onClick={handleSaveProfile} fullWidth>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
