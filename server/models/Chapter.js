const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['reading', 'quiz', 'both'],
        default: 'reading'
    },
    estimatedMinutes: {
        type: Number,
        default: 15
    },
    order: {
        type: Number,
        default: 0
    },
    xpReward: {
        type: Number,
        default: 50
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
chapterSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
