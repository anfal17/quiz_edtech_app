const express = require('express');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Quiz = require('../models/Quiz');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all published courses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { difficulty, tag, search } = req.query;

        let query = { isPublished: true };

        if (difficulty) query.difficulty = difficulty;
        if (tag) query.tags = { $in: [tag] };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const courses = await Course.find(query)
            .sort({ order: 1 })
            .lean();

        // Get chapter and quiz counts
        const coursesWithCounts = await Promise.all(
            courses.map(async (course) => {
                let chapterCount = 0;
                let quizCount = 0;

                if (course.learningPath && course.learningPath.length > 0) {
                    // Use Learning Path for accurate count of "active" items
                    chapterCount = course.learningPath.filter(item => item.itemType === 'Chapter').length;
                    quizCount = course.learningPath.filter(item => item.itemType === 'Quiz').length;
                } else {
                    // Fallback to legacy count
                    chapterCount = await Chapter.countDocuments({ courseId: course._id, isPublished: true });
                    quizCount = await Quiz.countDocuments({ courseId: course._id, isPublished: true });
                }

                return {
                    ...course,
                    totalChapters: chapterCount,
                    totalQuizzes: quizCount
                };
            })
        );

        res.json(coursesWithCounts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/courses/all (admin)
// @desc    Get all courses including unpublished
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
    try {
        const courses = await Course.find().sort({ order: 1 });
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID with chapters
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('learningPath.itemId');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const chapters = await Chapter.find({
            courseId: course._id,
            isPublished: true
        }).sort({ order: 1 }).select('-content');

        const quizzes = await Quiz.find({
            courseId: course._id,
            isPublished: true
        }).select('-questions.correctAnswer -questions.explanation');

        res.json({
            ...course.toObject(),
            chapters,
            quizzes
        });
    } catch (error) {

        console.error('Error in GET /api/courses/:id:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/courses
// @desc    Create a course
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { title, description, icon, difficulty, tags, color } = req.body;

        const course = await Course.create({
            title,
            description,
            icon,
            difficulty,
            tags: tags || [],
            color,
            createdBy: req.user._id
        });

        res.status(201).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/courses/:id/learning-path
// @desc    Update course learning path order
// @access  Private/Admin
router.put('/:id/learning-path', protect, admin, async (req, res) => {
    try {
        const { learningPath } = req.body;

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { learningPath },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Delete associated chapters and quizzes
        await Chapter.deleteMany({ courseId: course._id });
        await Quiz.deleteMany({ courseId: course._id });
        await course.deleteOne();

        res.json({ message: 'Course deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
