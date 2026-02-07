const express = require('express');
const Chapter = require('../models/Chapter');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chapters
// @desc    Get chapters by course
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { courseId } = req.query;

        if (!courseId) {
            return res.status(400).json({ message: 'courseId is required' });
        }

        const chapters = await Chapter.find({
            courseId,
            isPublished: true
        }).sort({ order: 1 }).select('-content');

        res.json(chapters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/chapters/all (admin)
// @desc    Get all chapters including unpublished
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
    try {
        const { courseId } = req.query;
        let query = {};
        if (courseId) query.courseId = courseId;

        const chapters = await Chapter.find(query)
            .populate('courseId', 'title')
            .sort({ courseId: 1, order: 1 });

        res.json(chapters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/chapters/:id
// @desc    Get chapter with content
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.id)
            .populate('courseId', 'title icon');

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        res.json(chapter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/chapters
// @desc    Create chapter
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { courseId, title, content, type, estimatedMinutes, order, xpReward } = req.body;

        // Get next order if not provided
        let chapterOrder = order;
        if (!chapterOrder) {
            const lastChapter = await Chapter.findOne({ courseId }).sort({ order: -1 });
            chapterOrder = lastChapter ? lastChapter.order + 1 : 1;
        }

        const chapter = await Chapter.create({
            courseId,
            title,
            content,
            type,
            estimatedMinutes,
            order: chapterOrder,
            xpReward,
            isPublished: true // Default to true based on user feedback
        });

        // Add to Learning Path
        const Course = require('../models/Course'); // Lazy load or move to top
        await Course.findByIdAndUpdate(courseId, {
            $push: { learningPath: { itemType: 'Chapter', itemId: chapter._id } }
        });

        res.status(201).json(chapter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/chapters/:id
// @desc    Update chapter
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        res.json(chapter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/chapters/:id
// @desc    Delete chapter
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.id);

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        await chapter.deleteOne();
        res.json({ message: 'Chapter deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
