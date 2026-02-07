const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (!req.user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const { ROLES } = require('../config/constants');

// Admin only middleware (admin or superadmin)
const admin = (req, res, next) => {
    if (req.user && (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPERADMIN)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

// Superadmin only middleware
const superadmin = (req, res, next) => {
    if (req.user && req.user.role === ROLES.SUPERADMIN) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as superadmin' });
    }
};

module.exports = { protect, admin, superadmin };
