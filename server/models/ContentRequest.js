const mongoose = require('mongoose');
const { REQUEST_STATUS, REQUEST_TYPES, QUESTION_TYPES } = require('../config/constants');

const contentRequestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: Object.values(REQUEST_TYPES),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(REQUEST_STATUS),
        default: REQUEST_STATUS.PENDING
    },
    // Where to add this content
    targetCourse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    targetChapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter'
    },
    // Request details
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    // Content data (flexible based on type)
    contentData: {
        // For chapter
        content: String,
        estimatedMinutes: Number,
        // For quiz
        questions: [{
            type: { type: String, enum: Object.values(QUESTION_TYPES) },
            question: String,
            options: [String],
            correctAnswer: Number,
            explanation: String
        }],
        passingScore: Number,
        xpReward: Number
    },
    // Submitted by
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Reviewed by
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewNote: {
        type: String
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
contentRequestSchema.index({ status: 1, type: 1 });
contentRequestSchema.index({ submittedBy: 1 });

module.exports = mongoose.model('ContentRequest', contentRequestSchema);
