const express = require('express');
const Feedback = require('../models/Feedback');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Create new feedback
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { feedbackType, contentId, contentTitle, issueType, description } = req.body;

        // Validate required fields
        if (!feedbackType || !contentId || !contentTitle || !issueType || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const feedback = await Feedback.create({
            feedbackType,
            contentId,
            contentTitle,
            issueType,
            description,
            createdBy: req.user._id
        });

        res.status(201).json(feedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/feedback
// @desc    Get user's own feedback
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;

        const query = { createdBy: req.user._id };
        if (status) query.status = status;
        if (type) query.feedbackType = type;

        const feedback = await Feedback.find(query)
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Feedback.countDocuments(query);

        res.json({
            feedback,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/feedback/admin
// @desc    Get all feedback (admin only)
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (type) query.feedbackType = type;

        const feedback = await Feedback.find(query)
            .populate('createdBy', 'name email')
            .populate('resolvedBy', 'name email')
            .populate('courseId', 'title')
            .populate('chapterId', 'title')
            .populate('quizId', 'title')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Feedback.countDocuments(query);

        // Get stats
        const stats = await Feedback.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsMap = stats.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
        }, {});

        res.json({
            feedback,
            stats: {
                open: statsMap.open || 0,
                in_review: statsMap.in_review || 0,
                resolved: statsMap.resolved || 0,
                dismissed: statsMap.dismissed || 0,
                total
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/feedback/:id/resolve
// @desc    Resolve or dismiss feedback
// @access  Private/Admin
router.put('/:id/resolve', protect, admin, async (req, res) => {
    try {
        const { status, resolution } = req.body;

        if (!['resolved', 'dismissed', 'in_review'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        feedback.status = status;
        if (resolution) feedback.resolution = resolution;
        if (status === 'resolved' || status === 'dismissed') {
            feedback.resolvedBy = req.user._id;
            feedback.resolvedAt = new Date();
        }

        await feedback.save();

        const updated = await Feedback.findById(feedback._id)
            .populate('createdBy', 'name email')
            .populate('resolvedBy', 'name');

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
