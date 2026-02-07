const express = require('express');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/quizzes
// @desc    Get quizzes by course
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { courseId, chapterId } = req.query;
        let query = { isPublished: true };

        if (courseId) query.courseId = courseId;
        if (chapterId) query.chapterId = chapterId;

        const quizzes = await Quiz.find(query)
            .select('-questions.correctAnswer -questions.explanation')
            .populate('courseId', 'title icon');

        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/quizzes/all (admin)
// @desc    Get all quizzes including unpublished
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
    try {
        const quizzes = await Quiz.find()
            .populate('courseId', 'title')
            .populate('createdBy', 'name');
        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/quizzes/:id
// @desc    Get quiz with questions (without answers for students)
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('courseId', 'title icon');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Remove correct answers and explanations for non-admin users
        const quizData = quiz.toObject();
        quizData.questions = quizData.questions.map(q => ({
            _id: q._id,
            type: q.type,
            question: q.question,
            options: q.options
        }));

        res.json(quizData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/quizzes/:id/admin
// @desc    Get quiz with all answers (admin)
// @access  Private/Admin
router.get('/:id/admin', protect, admin, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/quizzes
// @desc    Create quiz
// @access  Private/Admin (or Private for user-created)
router.post('/', protect, async (req, res) => {
    try {
        const { courseId, chapterId, title, description, questions, timeLimit, passingScore, xpReward } = req.body;

        const quiz = await Quiz.create({
            courseId,
            chapterId,
            title,
            description,
            questions,
            timeLimit,
            passingScore,
            xpReward,
            createdBy: req.user._id,
            isPublished: true // Default to true
        });

        // Add to Learning Path if it belongs to a course
        if (courseId) {
            const Course = require('../models/Course');
            await Course.findByIdAndUpdate(courseId, {
                $push: { learningPath: { itemType: 'Quiz', itemId: quiz._id } }
            });
        }

        res.status(201).json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/quizzes/:id/submit
// @desc    Submit quiz answers
// @access  Private
router.post('/:id/submit', protect, async (req, res) => {
    try {
        const { answers } = req.body; // Array of { questionId, answer }

        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Calculate score
        let correct = 0;
        const results = quiz.questions.map((question, index) => {
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            const isCorrect = userAnswer && userAnswer.answer === question.correctAnswer;
            if (isCorrect) correct++;

            return {
                questionId: question._id,
                question: question.question,
                userAnswer: userAnswer?.answer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                explanation: question.explanation
            };
        });

        const score = Math.round((correct / quiz.questions.length) * 100);
        const passed = score >= quiz.passingScore;
        const xpEarned = passed ? quiz.xpReward : Math.floor(quiz.xpReward * 0.25);

        // Update user XP
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { xp: xpEarned }
        });

        // Update progress if course quiz
        if (quiz.courseId) {
            await Progress.findOneAndUpdate(
                { userId: req.user._id, courseId: quiz.courseId },
                {
                    $push: {
                        quizResults: {
                            quizId: quiz._id,
                            score,
                            passed,
                            xpEarned
                        }
                    },
                    lastAccessedAt: new Date()
                },
                { upsert: true }
            );
        }

        res.json({
            score,
            passed,
            xpEarned,
            totalQuestions: quiz.questions.length,
            correctAnswers: correct,
            passingScore: quiz.passingScore,
            results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/quizzes/:id/submit-guest
// @desc    Submit quiz answers (guest)
// @access  Public
router.post('/:id/submit-guest', async (req, res) => {
    try {
        const { answers } = req.body;

        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Calculate score
        let correct = 0;
        const results = quiz.questions.map((question) => {
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            const isCorrect = userAnswer && userAnswer.answer === question.correctAnswer;
            if (isCorrect) correct++;

            return {
                questionId: question._id,
                question: question.question,
                userAnswer: userAnswer?.answer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                explanation: question.explanation
            };
        });

        const score = Math.round((correct / quiz.questions.length) * 100);
        const passed = score >= quiz.passingScore;

        // Return 0 XP for guests
        const xpEarned = 0;

        res.json({
            score,
            passed,
            xpEarned, // Guests earn 0 real XP
            totalQuestions: quiz.questions.length,
            correctAnswers: correct,
            passingScore: quiz.passingScore,
            results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/quizzes/:id
// @desc    Update quiz
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/quizzes/:id
// @desc    Delete quiz
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        await quiz.deleteOne();
        res.json({ message: 'Quiz deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
