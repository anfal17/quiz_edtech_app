const express = require('express');
const ContentRequest = require('../models/ContentRequest');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Quiz = require('../models/Quiz');
const { protect, admin } = require('../middleware/auth');
const { ROLES, REQUEST_STATUS } = require('../config/constants');

const router = express.Router();

// @route   GET /api/requests
// @desc    Get content requests (admin: all, user: own)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;

        const filter = {};

        // Non-admins only see their own requests
        if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPERADMIN) {
            filter.submittedBy = req.user._id;
        }

        if (status) filter.status = status;
        if (type) filter.type = type;

        const requests = await ContentRequest.find(filter)
            .populate('targetCourse', 'title icon')
            .populate('targetChapter', 'title')
            .populate('submittedBy', 'name avatar')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await ContentRequest.countDocuments(query);

        res.json({
            requests,
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

// @route   POST /api/requests
// @desc    Submit a content request
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { type, targetCourse, targetChapter, title, description, contentData } = req.body;

        // Validate course exists
        const course = await Course.findById(targetCourse);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const request = await ContentRequest.create({
            type,
            targetCourse,
            targetChapter,
            title,
            description,
            contentData,
            submittedBy: req.user._id
        });

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/requests/:id
// @desc    Get single request
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const request = await ContentRequest.findById(req.params.id)
            .populate('targetCourse', 'title icon')
            .populate('targetChapter', 'title')
            .populate('submittedBy', 'name email avatar')
            .populate('reviewedBy', 'name');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only owner or admin can view
        if (
            req.user.role === 'user' &&
            request.submittedBy._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/requests/:id
// @desc    Update request (only pending, only by owner)
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const request = await ContentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only owner can update
        if (request.submittedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Can't update if not pending
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Can only update pending requests' });
        }

        const { title, description, contentData } = req.body;

        if (title) request.title = title;
        if (description) request.description = description;
        if (contentData) request.contentData = contentData;

        await request.save();
        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/requests/:id/approve
// @desc    Approve request and create content
// @access  Private/Admin
router.post('/:id/approve', protect, admin, async (req, res) => {
    try {
        const request = await ContentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        const { reviewNote } = req.body;
        let createdContent;

        // Create the actual content based on type
        if (request.type === 'chapter') {
            // Get next order number
            const lastChapter = await Chapter.findOne({ courseId: request.targetCourse })
                .sort({ order: -1 });
            const nextOrder = lastChapter ? lastChapter.order + 1 : 1;

            createdContent = await Chapter.create({
                courseId: request.targetCourse,
                title: request.title,
                content: request.contentData.content || '',
                estimatedMinutes: request.contentData.estimatedMinutes || 15,
                xpReward: request.contentData.xpReward || 50,
                order: nextOrder,
                isPublished: true
            });
        } else if (request.type === 'quiz') {
            createdContent = await Quiz.create({
                courseId: request.targetCourse,
                chapterId: request.targetChapter,
                title: request.title,
                description: request.description,
                questions: request.contentData.questions || [],
                passingScore: request.contentData.passingScore || 70,
                xpReward: request.contentData.xpReward || 100,
                isPublished: true,
                createdBy: request.submittedBy
            });
        }

        // Update request status
        // Update request status
        request.status = REQUEST_STATUS.APPROVED;

        request.reviewedBy = req.user._id;
        request.reviewNote = reviewNote;
        request.reviewedAt = new Date();
        await request.save();

        res.json({
            message: `${request.type} approved and created`,
            request,
            createdContent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/requests/:id/reject
// @desc    Reject request
// @access  Private/Admin
router.post('/:id/reject', protect, admin, async (req, res) => {
    try {
        const request = await ContentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== REQUEST_STATUS.PENDING) {
            return res.status(400).json({ message: 'Request already processed' });
        }

        const { reviewNote } = req.body;

        request.status = REQUEST_STATUS.REJECTED;
        request.reviewedBy = req.user._id;
        request.reviewNote = reviewNote || 'Request rejected';
        request.reviewedAt = new Date();
        await request.save();

        res.json({
            message: 'Request rejected',
            request
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/requests/:id
// @desc    Delete request
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const request = await ContentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only owner or admin can delete
        const isOwner = request.submittedBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPERADMIN;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await request.deleteOne();
        res.json({ message: 'Request deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
