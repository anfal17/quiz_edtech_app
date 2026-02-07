const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: 500
    },
    icon: {
        type: String,
        default: '📚'
    },
    coverImage: {
        type: String
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    tags: [{
        type: String,
        trim: true
    }],
    color: {
        type: String,
        default: '#10B981'
    },
    order: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    learningPath: [{
        itemType: {
            type: String,
            enum: ['Chapter', 'Quiz'],
            required: true
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'learningPath.itemType'
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for chapter count
courseSchema.virtual('chapters', {
    ref: 'Chapter',
    localField: '_id',
    foreignField: 'courseId'
});

// Virtual for quiz count  
courseSchema.virtual('quizzes', {
    ref: 'Quiz',
    localField: '_id',
    foreignField: 'courseId'
});

module.exports = mongoose.model('Course', courseSchema);
