module.exports = {
    // Roles
    ROLES: {
        USER: 'user',
        ADMIN: 'admin',
        SUPERADMIN: 'superadmin'
    },

    // Ticket Status
    TICKET_STATUS: {
        OPEN: 'open',
        IN_PROGRESS: 'in-progress',
        WAITING: 'waiting',
        RESOLVED: 'resolved',
        CLOSED: 'closed'
    },

    // Ticket Categories
    TICKET_CATEGORIES: {
        ACCOUNT: 'account',
        CONTENT: 'content',
        TECHNICAL: 'technical',
        FEATURE: 'feature',
        OTHER: 'other'
    },

    // Ticket Priorities
    TICKET_PRIORITIES: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent'
    },

    // Content Request Types
    REQUEST_TYPES: {
        CHAPTER: 'chapter',
        QUIZ: 'quiz',
        COURSE: 'course'
    },

    // Content Request Status
    REQUEST_STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected'
    },

    // Course Difficulties
    DIFFICULTIES: {
        BEGINNER: 'beginner',
        INTERMEDIATE: 'intermediate',
        ADVANCED: 'advanced'
    },

    // Question Types
    QUESTION_TYPES: {
        MCQ: 'mcq',
        TRUE_FALSE: 'true-false'
    },

    // XP Rewards
    XP_REWARDS: {
        CHAPTER_READ: 50,
        QUIZ_PASS: 100,
        COURSE_COMPLETE: 500
    }
};
