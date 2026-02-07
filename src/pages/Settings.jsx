import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Moon, Sun, Bell, Shield, Trash2,
    Save, ChevronLeft, Check, AlertTriangle
} from 'lucide-react';
import { Button, Card, Modal } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

const AVATARS = ['👤', '🧕', '🧔', '👨‍🎓', '👩‍🎓', '🦁', '🌙', '⭐', '📚', '🕌'];

export default function Settings() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    // Get saved user data
    const savedData = useMemo(() => {
        return JSON.parse(localStorage.getItem('quizmaster-progress') || '{}');
    }, []);

    const [name, setName] = useState(savedData.user?.name || '');
    const [avatar, setAvatar] = useState(savedData.user?.avatar || '👤');
    const [notifications, setNotifications] = useState(savedData.settings?.notifications ?? true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        const currentData = JSON.parse(localStorage.getItem('quizmaster-progress') || '{}');

        const updatedData = {
            ...currentData,
            user: {
                ...currentData.user,
                name: name || 'Learner',
                avatar,
                joinedDate: currentData.user?.joinedDate || new Date().toISOString(),
            },
            settings: {
                ...currentData.settings,
                notifications,
            },
        };

        localStorage.setItem('quizmaster-progress', JSON.stringify(updatedData));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleClearProgress = () => {
        localStorage.removeItem('quizmaster-progress');
        localStorage.removeItem('quizmaster-user-quizzes');
        setShowDeleteModal(false);
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="min-h-screen py-6 sm:py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-[var(--text)]" />
                    </button>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
                </div>

                {/* Profile Settings */}
                <Card className="mb-6">
                    <h2 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary-400" />
                        Profile
                    </h2>

                    {/* Display Name */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="
                w-full px-4 py-3 rounded-xl
                bg-[var(--surface-hover)] border border-[var(--border)]
                text-[var(--text)] placeholder:text-[var(--text-secondary)]
                focus:outline-none focus:ring-2 focus:ring-primary-500
                transition-all
              "
                        />
                    </div>

                    {/* Avatar Selection */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">
                            Avatar
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVATARS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setAvatar(emoji)}
                                    className={`
                    w-12 h-12 rounded-xl text-2xl flex items-center justify-center
                    transition-all
                    ${avatar === emoji
                                            ? 'bg-primary-500 ring-2 ring-primary-400 ring-offset-2 ring-offset-[var(--bg)]'
                                            : 'bg-[var(--surface-hover)] hover:bg-[var(--border)]'
                                        }
                  `}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Appearance Settings */}
                <Card className="mb-6">
                    <h2 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                        {theme === 'dark' ? <Moon className="w-5 h-5 text-primary-400" /> : <Sun className="w-5 h-5 text-warning-400" />}
                        Appearance
                    </h2>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-[var(--text)]">Theme</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Switch between light and dark mode
                            </p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`
                relative w-16 h-8 rounded-full transition-colors
                ${theme === 'dark' ? 'bg-primary-500' : 'bg-[var(--border)]'}
              `}
                        >
                            <div
                                className={`
                  absolute top-1 w-6 h-6 rounded-full bg-white shadow-md
                  transition-transform flex items-center justify-center
                  ${theme === 'dark' ? 'left-9' : 'left-1'}
                `}
                            >
                                {theme === 'dark' ? (
                                    <Moon className="w-4 h-4 text-primary-500" />
                                ) : (
                                    <Sun className="w-4 h-4 text-warning-500" />
                                )}
                            </div>
                        </button>
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card className="mb-6">
                    <h2 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary-400" />
                        Notifications
                    </h2>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-[var(--text)]">Learning Reminders</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Get reminded to maintain your streak
                            </p>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`
                relative w-14 h-7 rounded-full transition-colors
                ${notifications ? 'bg-success-500' : 'bg-[var(--border)]'}
              `}
                        >
                            <div
                                className={`
                  absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md
                  transition-transform
                  ${notifications ? 'left-7' : 'left-0.5'}
                `}
                            />
                        </button>
                    </div>
                </Card>

                {/* Data Management */}
                <Card className="mb-6 border-error-500/30">
                    <h2 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-error-400" />
                        Data & Privacy
                    </h2>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-[var(--text)]">Clear All Progress</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Delete all your learning data and start fresh
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteModal(true)}
                            className="border-error-500 text-error-500 hover:bg-error-500/10"
                            leftIcon={<Trash2 size={16} />}
                        >
                            Clear Data
                        </Button>
                    </div>
                </Card>

                {/* Save Button */}
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleSave}
                    leftIcon={saved ? <Check size={20} /> : <Save size={20} />}
                    className={saved ? 'bg-success-500 hover:bg-success-600' : ''}
                >
                    {saved ? 'Saved!' : 'Save Changes'}
                </Button>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Clear All Progress?"
                    size="sm"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-error-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-error-400" />
                        </div>
                        <p className="text-[var(--text-secondary)] mb-6">
                            This will permanently delete all your learning progress, XP, streaks, and achievements.
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                fullWidth
                                onClick={handleClearProgress}
                                className="bg-error-500 hover:bg-error-600"
                            >
                                Clear Everything
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
