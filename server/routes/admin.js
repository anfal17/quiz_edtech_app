const express = require('express');
const User = require('../models/User');
const { protect, admin, superadmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get dashboard stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const Course = require('../models/Course');
        const Chapter = require('../models/Chapter');
        const Quiz = require('../models/Quiz');

        const [
            totalUsers,
            activeUsers,
            inactiveUsers,
            totalCourses,
            totalChapters,
            totalQuizzes
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: false }),
            Course.countDocuments(),
            Chapter.countDocuments(),
            Quiz.countDocuments()
        ]);

        res.json({
            totalUsers,
            activeUsers,
            inactiveUsers,
            totalCourses,
            totalChapters,
            totalQuizzes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const { status, role, search, page = 1, limit = 20 } = req.query;

        let query = {};

        if (status) query.isActive = status === 'active';
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            users,
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

// @route   GET /api/admin/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/users
// @desc    Create new user (with password)
// @access  Private/Superadmin
router.post('/users', protect, superadmin, async (req, res) => {
    try {
        const { name, email, password, role = 'user' } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password, // Will be hashed by pre-save hook in User model
            role,
            isActive: true
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin can update role, status)
// @access  Private/Admin
router.put('/users/:id', protect, admin, async (req, res) => {
    try {
        const { name, email, role, isActive, avatar } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only superadmin can change roles to admin/superadmin
        if (role && role !== 'user') {
            if (req.user.role !== 'superadmin') {
                return res.status(403).json({ message: 'Only superadmin can promote users to admin' });
            }
        }

        // Prevent changing own role
        if (req.params.id === req.user._id.toString() && role && role !== req.user.role) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            avatar: user.avatar
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/users/:id/toggle-status
// @desc    Toggle user active status (ban/unban)
// @access  Private/Admin
router.post('/users/:id/toggle-status', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Can't ban yourself
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot change your own status' });
        }

        // Only superadmin can ban admins
        if (user.role === 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only superadmin can modify admin accounts' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            _id: user._id,
            isActive: user.isActive,
            message: user.isActive ? 'User activated' : 'User deactivated'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/users/:id/promote
// @desc    Promote user to admin
// @access  Private/Superadmin
router.post('/users/:id/promote', protect, superadmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin' || user.role === 'superadmin') {
            return res.status(400).json({ message: 'User is already an admin' });
        }

        user.role = 'admin';
        await user.save();

        res.json({
            _id: user._id,
            role: user.role,
            message: 'User promoted to admin'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/users/:id/demote
// @desc    Demote admin to user
// @access  Private/Superadmin
router.post('/users/:id/demote', protect, superadmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'superadmin') {
            return res.status(400).json({ message: 'Cannot demote superadmin' });
        }

        user.role = 'user';
        await user.save();

        res.json({
            _id: user._id,
            role: user.role,
            message: 'Admin demoted to user'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Superadmin
router.delete('/users/:id', protect, superadmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'superadmin') {
            return res.status(400).json({ message: 'Cannot delete superadmin' });
        }

        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;
