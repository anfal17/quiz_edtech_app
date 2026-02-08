const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    feedbackType: {
        type: String,
        enum: ['chapter', 'quiz_question'],
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    contentTitle: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter'
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    },
    issueType: {
        type: String,
        enum: ['typo', 'error', 'improvement', 'other'],
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_review', 'resolved', 'dismissed'],
        default: 'open'
    },
    resolution: {
        type: String,
        maxlength: 1000
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
feedbackSchema.index({ createdBy: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ feedbackType: 1, status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
