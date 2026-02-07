const mongoose = require('mongoose');
const { TICKET_STATUS, TICKET_CATEGORIES, TICKET_PRIORITIES } = require('../config/constants');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    isStaff: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    category: {
        type: String,
        enum: Object.values(TICKET_CATEGORIES),
        default: TICKET_CATEGORIES.OTHER
    },
    priority: {
        type: String,
        enum: Object.values(TICKET_PRIORITIES),
        default: TICKET_PRIORITIES.MEDIUM
    },
    status: {
        type: String,
        enum: Object.values(TICKET_STATUS),
        default: TICKET_STATUS.OPEN
    },
    description: {
        type: String,
        required: true
    },
    // User who created the ticket
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Admin assigned to the ticket
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Conversation thread
    messages: [messageSchema],
    // Resolution details
    resolution: {
        type: String
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Generate ticket ID before saving
ticketSchema.pre('save', async function () {
    if (!this.ticketId) {
        const count = await mongoose.model('Ticket').countDocuments();
        this.ticketId = `TKT-${String(count + 1).padStart(5, '0')}`;
    }
});

// Indexes
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
