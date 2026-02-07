const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mcq', 'true-false'],
        default: 'mcq'
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String
    }],
    correctAnswer: {
        type: Number,
        required: true
    },
    explanation: {
        type: String
    }
});

const quizSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter'
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        maxlength: 500
    },
    questions: [questionSchema],
    timeLimit: {
        type: Number,
        default: 0 // 0 = no limit
    },
    passingScore: {
        type: Number,
        default: 70
    },
    xpReward: {
        type: Number,
        default: 100
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total questions
quizSchema.virtual('totalQuestions').get(function () {
    return this.questions ? this.questions.length : 0;
});

module.exports = mongoose.model('Quiz', quizSchema);
