const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    completedChapters: [{
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chapter'
        },
        completedAt: {
            type: Date,
            default: Date.now
        },
        readingProgress: {
            type: Number,
            default: 100
        }
    }],
    quizResults: [{
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz'
        },
        score: Number,
        passed: Boolean,
        xpEarned: Number,
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],
    totalTimeSpent: {
        type: Number,
        default: 0 // in minutes
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for user-course progress
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Virtual for completion percentage
progressSchema.virtual('completionPercentage').get(function () {
    // Will be calculated based on total chapters in course
    return this.completedChapters.length;
});

module.exports = mongoose.model('Progress', progressSchema);
