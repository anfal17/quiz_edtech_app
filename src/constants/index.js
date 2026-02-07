// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Roles
export const ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin'
};

// Ticket Status & Styles
export const TICKET_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in-progress',
    WAITING: 'waiting',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
};

export const STATUS_STYLES = {
    [TICKET_STATUS.OPEN]: { bg: 'bg-info-500/20', text: 'text-info-400', label: 'Open' },
    [TICKET_STATUS.IN_PROGRESS]: { bg: 'bg-warning-500/20', text: 'text-warning-400', label: 'In Progress' },
    [TICKET_STATUS.WAITING]: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Waiting' },
    [TICKET_STATUS.RESOLVED]: { bg: 'bg-success-500/20', text: 'text-success-400', label: 'Resolved' },
    [TICKET_STATUS.CLOSED]: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Closed' }
};

// Ticket Categories
export const TICKET_CATEGORIES = {
    ACCOUNT: 'account',
    CONTENT: 'content',
    TECHNICAL: 'technical',
    FEATURE: 'feature',
    OTHER: 'other'
};

export const CATEGORY_LABELS = {
    [TICKET_CATEGORIES.ACCOUNT]: { label: 'Account', icon: '👤' },
    [TICKET_CATEGORIES.CONTENT]: { label: 'Content', icon: '📚' },
    [TICKET_CATEGORIES.TECHNICAL]: { label: 'Technical', icon: '🔧' },
    [TICKET_CATEGORIES.FEATURE]: { label: 'Feature', icon: '💡' },
    [TICKET_CATEGORIES.OTHER]: { label: 'Other', icon: '❓' }
};

// Ticket Priorities
export const TICKET_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
};

export const PRIORITY_LABELS = {
    [TICKET_PRIORITIES.LOW]: { label: 'Low', color: 'text-gray-400' },
    [TICKET_PRIORITIES.MEDIUM]: { label: 'Medium', color: 'text-warning-400' },
    [TICKET_PRIORITIES.HIGH]: { label: 'High', color: 'text-error-400' },
    [TICKET_PRIORITIES.URGENT]: { label: 'Urgent', color: 'text-error-500' }
};

// Achievements
export const ACHIEVEMENTS = [
    { id: 'first_lesson', name: 'First Step', icon: '🎯', description: 'Complete your first chapter', xp: 50 },
    { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: '7 day learning streak', xp: 100 },
    { id: 'streak_30', name: 'Month Master', icon: '⚡', description: '30 day learning streak', xp: 500 },
    { id: 'quiz_perfect', name: 'Perfect Score', icon: '💯', description: 'Get 100% on any quiz', xp: 75 },
    { id: 'course_complete', name: 'Scholar', icon: '🎓', description: 'Complete a full course', xp: 200 },
    { id: 'xp_1000', name: 'Knowledge Seeker', icon: '📚', description: 'Earn 1,000 XP', xp: 100 },
    { id: 'xp_5000', name: 'Dedicated Learner', icon: '🌟', description: 'Earn 5,000 XP', xp: 250 },
    { id: 'helper', name: 'Community Helper', icon: '🤝', description: 'Submit approved content', xp: 150 },
];

// Avatars
export const AVATAR_OPTIONS = ['👤', '👨', '👩', '🧔', '👳', '🧕', '👨‍🎓', '👩‍🎓', '🦸', '🧙', '👑', '🌟'];

// Navigation
export const NAV_LINKS = {
    HOME: '/',
    EXPLORE: '/explore',
    DASHBOARD: '/dashboard',
    CREATE_QUIZ: '/create-quiz',
    ABOUT: '/about',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    SUPPORT: '/support',
    LOGIN: '/login',
    SIGNUP: '/signup',
    ADMIN: '/admin'
};

// Course Icons
export const COURSE_ICONS = [
    '📚', '🕌', '📖', '🎓', '🕋', '🤲', '📿', '🌙', '⭐', '💡', '🧠', '✍️',
    '🌍', '🛑', '✅', '❤️', '✨', '🏆', '📜', '⚖️', '🏰', '🌱', '🍎', '🗡️'
];

// Course Gradients
export const COURSE_GRADIENTS = [
    { label: 'Emerald', value: 'from-emerald-500 to-teal-500' },
    { label: 'Blue', value: 'from-blue-500 to-cyan-500' },
    { label: 'Indigo', value: 'from-indigo-500 to-purple-500' },
    { label: 'Violet', value: 'from-violet-500 to-fuchsia-500' },
    { label: 'Rose', value: 'from-rose-500 to-pink-500' },
    { label: 'Amber', value: 'from-amber-500 to-orange-500' },
    { label: 'Slate', value: 'from-slate-700 to-slate-900' },
    { label: 'Gold', value: 'from-yellow-400 to-amber-600' },
];
