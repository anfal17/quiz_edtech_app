const express = require('express');
const Ticket = require('../models/Ticket');
const { protect, admin } = require('../middleware/auth');
const { ROLES, TICKET_STATUS } = require('../config/constants');

const router = express.Router();

// @route   GET /api/tickets
// @desc    Get tickets (user: own, admin: all)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, category, priority, page = 1, limit = 20 } = req.query;

        const filter = {};

        // Non-admins only see their own tickets
        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name avatar email')
            .populate('assignedTo', 'name avatar')
            .select('-messages')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Ticket.countDocuments(query);

        res.json({
            tickets,
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

// @route   GET /api/tickets/stats
// @desc    Get ticket stats (admin)
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        // Calculate stats
        const filter = {}; // Assuming no specific filter for overall stats, adjust if needed
        const stats = {
            total: await Ticket.countDocuments(filter),
            open: await Ticket.countDocuments({ ...filter, status: TICKET_STATUS.OPEN }),
            inProgress: await Ticket.countDocuments({ ...filter, status: TICKET_STATUS.IN_PROGRESS }),
            waiting: await Ticket.countDocuments({ ...filter, status: TICKET_STATUS.WAITING }),
            resolved: await Ticket.countDocuments({ ...filter, status: TICKET_STATUS.RESOLVED }),
            closed: await Ticket.countDocuments({ ...filter, status: TICKET_STATUS.CLOSED })
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/tickets
// @desc    Create a ticket
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { subject, category, priority, description } = req.body;

        const ticket = await Ticket.create({
            subject,
            category,
            priority,
            description,
            createdBy: req.user._id,
            messages: [{
                sender: req.user._id,
                content: description,
                isStaff: false
            }]
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/tickets/:id
// @desc    Get single ticket with messages
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('createdBy', 'name avatar email')
            .populate('assignedTo', 'name avatar')
            .populate('messages.sender', 'name avatar')
            .populate('resolvedBy', 'name');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Only owner or admin can view
        const isOwner = ticket.createdBy._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role !== 'user';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/tickets/:id/message
// @desc    Add message to ticket
// @access  Private
router.post('/:id/message', protect, async (req, res) => {
    try {
        const { content } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Only owner or admin can message
        const isOwner = ticket.createdBy.toString() === req.user._id.toString();
        // Check if user is staff (admin/superadmin)
        const isStaff = req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPERADMIN;

        if (!isOwner && !isStaff) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Add message
        ticket.messages.push({
            sender: req.user._id,
            content,
            isStaff
        });

        // Auto-update status if staff replies
        if (isStaff && ticket.status === TICKET_STATUS.OPEN) {
            ticket.status = TICKET_STATUS.IN_PROGRESS;
        } else if (!isStaff && ticket.status === TICKET_STATUS.WAITING) {
            ticket.status = TICKET_STATUS.IN_PROGRESS;
        }

        await ticket.save();

        const updatedTicket = await Ticket.findById(ticket._id)
            .populate('messages.sender', 'name avatar');

        res.json(updatedTicket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/tickets/:id/assign
// @desc    Assign ticket to admin
// @access  Private/Admin
router.put('/:id/assign', protect, admin, async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.assignedTo = assignedTo || req.user._id;
        if (ticket.status === 'open') {
            ticket.status = 'in-progress';
        }

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/tickets/:id/status
// @desc    Update ticket status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status, resolution } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.status = status;

        if (status === 'resolved' || status === 'closed') {
            ticket.resolvedAt = new Date();
            ticket.resolvedBy = req.user._id;
            if (resolution) ticket.resolution = resolution;
        }

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete ticket
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        await ticket.deleteOne();
        res.json({ message: 'Ticket deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
