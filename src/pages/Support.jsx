import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HelpCircle, Plus, MessageSquare, Clock, CheckCircle,
    AlertCircle, ChevronRight, Filter, Search, Loader
} from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ticketsAPI } from '../services/api';
import {
    TICKET_STATUS, TICKET_CATEGORIES, TICKET_PRIORITIES,
    STATUS_STYLES, CATEGORY_LABELS, PRIORITY_LABELS
} from '../constants';

export default function Support() {
    const { user, isAuthenticated } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [filter, setFilter] = useState('all');
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: TICKET_CATEGORIES.OTHER,
        priority: TICKET_PRIORITIES.MEDIUM,
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchTickets();
        }
    }, [isAuthenticated]);

    const fetchTickets = async () => {
        try {
            const data = await ticketsAPI.getAll();
            setTickets(data.tickets || []);
        } catch (error) {
            console.error('Failed to load tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const ticket = await ticketsAPI.create(newTicket);
            setTickets([ticket, ...tickets]);
            setShowNewTicket(false);
            setNewTicket({ subject: '', category: 'other', priority: 'medium', description: '' });
        } catch (error) {
            console.error('Failed to create ticket:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTickets = filter === 'all'
        ? tickets
        : tickets.filter(t => t.status === filter);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="text-center">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                    <h2 className="text-xl font-semibold text-[var(--text)] mb-2">Support Center</h2>
                    <p className="text-[var(--text-secondary)] mb-4">Please log in to access support</p>
                    <Link to="/login">
                        <Button variant="primary">Sign In</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text)]">Support Center</h1>
                        <p className="text-[var(--text-secondary)]">Get help with your account or report issues</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowNewTicket(true)}
                        leftIcon={<Plus size={20} />}
                    >
                        New Ticket
                    </Button>
                </div>

                {/* Quick Help */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    <Card className="p-4 hover:border-primary-500/50 transition-colors cursor-pointer">
                        <div className="text-2xl mb-2">📖</div>
                        <h3 className="font-medium text-[var(--text)]">FAQ</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Common questions answered</p>
                    </Card>
                    <Card className="p-4 hover:border-primary-500/50 transition-colors cursor-pointer">
                        <div className="text-2xl mb-2">🎓</div>
                        <h3 className="font-medium text-[var(--text)]">Guides</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Learn how to use Ilm Path</p>
                    </Card>
                    <Card className="p-4 hover:border-primary-500/50 transition-colors cursor-pointer">
                        <div className="text-2xl mb-2">💬</div>
                        <h3 className="font-medium text-[var(--text)]">Community</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Connect with other learners</p>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    {['all', ...Object.values(TICKET_STATUS)].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`
                px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${filter === status
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                }
              `}
                        >
                            {status === 'all' ? 'All Tickets' : STATUS_STYLES[status]?.label || status}
                        </button>
                    ))}
                </div>

                {/* Tickets List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <Card className="p-12 text-center">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                        <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No tickets yet</h3>
                        <p className="text-[var(--text-secondary)] mb-4">
                            {filter === 'all'
                                ? "You haven't submitted any support tickets"
                                : `No ${filter} tickets found`
                            }
                        </p>
                        <Button variant="primary" onClick={() => setShowNewTicket(true)}>
                            Create Your First Ticket
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredTickets.map((ticket) => (
                            <Link key={ticket._id} to={`/support/${ticket._id}`}>
                                <Card className="p-4 hover:border-primary-500/30 transition-all group">
                                    <div className="flex items-start gap-4">
                                        <div className="text-2xl">
                                            {CATEGORY_LABELS[ticket.category]?.icon || '❓'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-xs font-mono text-[var(--text-secondary)]">
                                                    {ticket.ticketId}
                                                </span>
                                                <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${STATUS_STYLES[ticket.status]?.bg} ${STATUS_STYLES[ticket.status]?.text}
                        `}>
                                                    {STATUS_STYLES[ticket.status]?.label}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-[var(--text)] truncate group-hover:text-primary-400 transition-colors">
                                                {ticket.subject}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)] truncate mt-1">
                                                {ticket.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <MessageSquare size={14} className="text-[var(--text-secondary)]" />
                                                <span className="text-xs text-[var(--text-secondary)]">
                                                    {ticket.messages?.length || 1}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-[var(--text-secondary)] group-hover:text-primary-400 transition-colors" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* New Ticket Modal */}
                {showNewTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface)]">
                                <h3 className="text-lg font-semibold text-[var(--text)]">Create Support Ticket</h3>
                                <button
                                    onClick={() => setShowNewTicket(false)}
                                    className="text-[var(--text-secondary)] hover:text-[var(--text)]"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreateTicket} className="p-4 space-y-4">
                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Category</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {Object.values(TICKET_CATEGORIES).map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setNewTicket({ ...newTicket, category: cat })}
                                                className={`
                          p-3 rounded-xl text-left transition-all
                          ${newTicket.category === cat
                                                        ? 'bg-primary-500/20 border-2 border-primary-500'
                                                        : 'bg-[var(--surface-hover)] border-2 border-transparent hover:border-[var(--border)]'
                                                    }
                        `}
                                            >
                                                <div className="text-xl mb-1">{CATEGORY_LABELS[cat]?.icon}</div>
                                                <div className="text-sm font-medium text-[var(--text)]">{CATEGORY_LABELS[cat]?.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Subject</label>
                                    <input
                                        type="text"
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                        placeholder="Brief summary of your issue"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Priority</label>
                                    <div className="flex gap-2">
                                        {Object.values(TICKET_PRIORITIES).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setNewTicket({ ...newTicket, priority: p })}
                                                className={`
                          flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all
                          ${newTicket.priority === p
                                                        ? `bg-primary-500/20 border-2 border-primary-500 ${PRIORITY_LABELS[p].color}`
                                                        : 'bg-[var(--surface-hover)] border-2 border-transparent text-[var(--text-secondary)]'
                                                    }
                        `}
                                            >
                                                {PRIORITY_LABELS[p].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Description</label>
                                    <textarea
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        placeholder="Describe your issue in detail..."
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowNewTicket(false)}
                                        fullWidth
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={submitting}
                                        fullWidth
                                    >
                                        Submit Ticket
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
