const express = require('express');
const Progress = require('../models/Progress');
const Chapter = require('../models/Chapter');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/progress
// @desc    Get user's progress across all courses
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const progress = await Progress.find({ userId: req.user._id })
            .populate('courseId', 'title icon difficulty color')
            .populate('completedChapters.chapterId', 'title');

        // Get total items for each course to calculate percentage
        const progressWithPercentage = (await Promise.all(
            progress.map(async (p) => {
                if (!p.courseId) return null; // Skip if course was deleted

                // Use Course Learning Path as source of truth for total items
                // We typically populated courseId with 'title icon difficulty color', 
                // but we need learningPath to count.
                // Since we already populated courseId, we can't easily add learningPath to that populate 
                // without fetching the full object potentially?
                // Actually `p.courseId` is a document if populated?
                // Mongoose populate usually returns specific fields if specified.
                // Let's re-fetch the course with learningPath or populate it above.
                // To minimize queries, let's just populate `learningPath` in the initial find.
                // But `learningPath` can be large? It's just an array of IDs. Should be fine.
                // Wait, I need to modify the initial find query.

                // Falling back to fetching course here if needed, or better:
                // Modify lines 15-17 to populate learningPath.

                // Since I can't modify lines 15-17 in this specific replacement block easily without context shift,
                // I will fetch the counts here using the Course model directly.

                const Course = require('../models/Course');
                const course = await Course.findById(p.courseId._id).select('learningPath');

                let totalItems = 0;
                if (course && course.learningPath && course.learningPath.length > 0) {
                    totalItems = course.learningPath.length;
                } else {
                    // Fallback to legacy counting
                    const totalChapters = await Chapter.countDocuments({
                        courseId: p.courseId._id,
                        isPublished: true
                    });
                    const totalQuizzes = await Quiz.countDocuments({
                        courseId: p.courseId._id,
                        isPublished: true
                    });
                    totalItems = totalChapters + totalQuizzes;
                }

                // Calculate unique completed items (Chapters + Passed Quizzes)
                const completedChaptersCount = p.completedChapters.length;

                // Filter unique passed quizzes
                const uniquePassedQuizzes = new Set(
                    p.quizResults
                        .filter(q => q.passed)
                        .map(q => q.quizId ? q.quizId.toString() : null) // Handle deleted quiz
                        .filter(Boolean)
                ).size;

                const completedTotal = completedChaptersCount + uniquePassedQuizzes;

                return {
                    ...p.toObject(),
                    totalChapters: totalItems,
                    completionPercentage: totalItems > 0
                        ? Math.round((completedTotal / totalItems) * 100)
                        : 0
                };
            })
        )).filter(Boolean);

        res.json(progressWithPercentage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/progress/:courseId
// @desc    Get user's progress for a specific course
// @access  Private
router.get('/:courseId', protect, async (req, res) => {
    try {
        let progress = await Progress.findOne({
            userId: req.user._id,
            courseId: req.params.courseId
        }).populate('completedChapters.chapterId', 'title order');

        if (!progress) {
            progress = {
                courseId: req.params.courseId,
                completedChapters: [],
                quizResults: [],
                totalTimeSpent: 0
            };
        }

        const Course = require('../models/Course');
        const course = await Course.findById(req.params.courseId).select('learningPath');

        let totalItems = 0;
        if (course && course.learningPath && course.learningPath.length > 0) {
            totalItems = course.learningPath.length;
        } else {
            const totalChapters = await Chapter.countDocuments({
                courseId: req.params.courseId,
                isPublished: true
            });
            const totalQuizzes = await Quiz.countDocuments({
                courseId: req.params.courseId,
                isPublished: true
            });
            totalItems = totalChapters + totalQuizzes;
        }

        // Calculate completed count
        const completedChaptersCount = progress.completedChapters.length;
        const uniquePassedQuizzes = new Set(
            progress.quizResults
                .filter(q => q.passed)
                .map(q => q.quizId ? q.quizId.toString() : null)
                .filter(Boolean)
        ).size;

        const completedTotal = completedChaptersCount + uniquePassedQuizzes;

        res.json({
            ...progress.toObject ? progress.toObject() : progress,
            totalChapters: totalItems,
            completionPercentage: totalItems > 0
                ? Math.round((completedTotal / totalItems) * 100)
                : 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/progress/chapter
// @desc    Mark chapter as complete
// @access  Private
router.post('/chapter', protect, async (req, res) => {
    try {
        const { courseId, chapterId, readingProgress } = req.body;

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Check if already completed
        let progress = await Progress.findOne({ userId: req.user._id, courseId });

        if (!progress) {
            progress = new Progress({
                userId: req.user._id,
                courseId,
                completedChapters: []
            });
        }

        const alreadyCompleted = progress.completedChapters.some(
            c => c.chapterId.toString() === chapterId
        );

        if (!alreadyCompleted) {
            progress.completedChapters.push({
                chapterId,
                readingProgress: readingProgress || 100
            });

            // Award XP
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { xp: chapter.xpReward }
            });

            progress.lastAccessedAt = new Date();
            await progress.save();

            res.json({
                message: 'Chapter completed',
                xpEarned: chapter.xpReward,
                progress: progress.completedChapters.length
            });
        } else {
            res.json({
                message: 'Chapter already completed',
                xpEarned: 0
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/progress/time
// @desc    Update time spent
// @access  Private
router.post('/time', protect, async (req, res) => {
    try {
        const { courseId, minutes } = req.body;

        await Progress.findOneAndUpdate(
            { userId: req.user._id, courseId },
            {
                $inc: { totalTimeSpent: minutes },
                lastAccessedAt: new Date()
            },
            { upsert: true }
        );

        res.json({ message: 'Time updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/progress/stats
// @desc    Get user's overall learning stats
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const allProgress = await Progress.find({ userId: req.user._id });

        const stats = {
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            achievements: user.achievements,
            coursesStarted: allProgress.length,
            totalChaptersCompleted: allProgress.reduce(
                (sum, p) => sum + p.completedChapters.length, 0
            ),
            totalQuizzesTaken: allProgress.reduce(
                (sum, p) => sum + p.quizResults.length, 0
            ),
            totalTimeSpent: allProgress.reduce(
                (sum, p) => sum + p.totalTimeSpent, 0
            )
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
