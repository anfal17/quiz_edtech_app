import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageSquare, Clock, CheckCircle, AlertCircle, UserPlus,
    Filter, Search, ChevronRight, Loader, Eye
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { ticketsAPI, adminAPI } from '../../services/api';
import {
    TICKET_STATUS, STATUS_STYLES, CATEGORY_LABELS, TICKET_CATEGORIES
} from '../../constants';

export default function ManageTickets() {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('open');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');
    const [pendingStatus, setPendingStatus] = useState(null);

    useEffect(() => {
        fetchData();
    }, [filter]);

    // Poll for updates when a ticket is selected
    useEffect(() => {
        if (!selectedTicket) return;

        const pollInterval = setInterval(async () => {
            try {
                const updated = await ticketsAPI.getById(selectedTicket._id);
                setSelectedTicket(updated);
            } catch (error) {
                console.error('Failed to poll ticket:', error);
            }
        }, 10000);

        return () => clearInterval(pollInterval);
    }, [selectedTicket?._id]);

    const fetchData = async () => {
        try {
            const [ticketsData, statsData] = await Promise.all([
                ticketsAPI.getAll(filter !== 'all' ? { status: filter } : {}),
                ticketsAPI.getStats()
            ]);
            setTickets(ticketsData.tickets || []);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewTicket = async (id) => {
        try {
            const ticket = await ticketsAPI.getById(id);
            setSelectedTicket(ticket);
        } catch (error) {
            console.error('Failed to load ticket:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedTicket) return;

        setSending(true);
        try {
            const updated = await ticketsAPI.sendMessage(selectedTicket._id, message);
            setSelectedTicket(updated);
            setMessage('');
            fetchData();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedTicket) return;

        if (status === TICKET_STATUS.RESOLVED || status === TICKET_STATUS.CLOSED) {
            setPendingStatus(status);
            setResolutionModalOpen(true);
            return;
        }

        try {
            await ticketsAPI.updateStatus(selectedTicket._id, status);
            setSelectedTicket({ ...selectedTicket, status });
            fetchData();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const confirmResolution = async () => {
        if (!selectedTicket || !pendingStatus) return;

        try {
            await ticketsAPI.updateStatus(selectedTicket._id, pendingStatus, resolutionNote);
            setSelectedTicket({ ...selectedTicket, status: pendingStatus, resolution: resolutionNote });
            fetchData();
            setResolutionModalOpen(false);
            setResolutionNote('');
            setPendingStatus(null);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleAssignToMe = async () => {
        if (!selectedTicket) return;
        try {
            await ticketsAPI.assign(selectedTicket._id);
            handleViewTicket(selectedTicket._id);
            fetchData();
        } catch (error) {
            console.error('Failed to assign:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--text)]">Support Tickets</h1>
                <p className="text-[var(--text-secondary)]">Manage and respond to user support requests</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-info-400">{stats.open}</div>
                        <div className="text-sm text-[var(--text-secondary)]">Open</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-warning-400">{stats.inProgress}</div>
                        <div className="text-sm text-[var(--text-secondary)]">In Progress</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{stats.waiting}</div>
                        <div className="text-sm text-[var(--text-secondary)]">Waiting</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-success-400">{stats.resolved}</div>
                        <div className="text-sm text-[var(--text-secondary)]">Resolved</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-[var(--text)]">{stats.total}</div>
                        <div className="text-sm text-[var(--text-secondary)]">Total</div>
                    </Card>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Tickets List */}
                <Card>
                    <div className="p-4 border-b border-[var(--border)]">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {['all', ...Object.values(TICKET_STATUS)].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                    ${filter === status
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                        }
                  `}
                                >
                                    {status === 'all' ? 'All' : STATUS_STYLES[status]?.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <Loader className="w-6 h-6 animate-spin mx-auto text-primary-500" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-secondary)]">
                                No tickets found
                            </div>
                        ) : (
                            tickets.map((ticket) => (
                                <div
                                    key={ticket._id}
                                    onClick={() => handleViewTicket(ticket._id)}
                                    className={`
                    p-4 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors
                    ${selectedTicket?._id === ticket._id ? 'bg-primary-500/10' : ''}
                  `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-xl">
                                            {CATEGORY_LABELS[ticket.category]?.icon || '❓'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
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
                                            <h3 className="font-medium text-[var(--text)] truncate">
                                                {ticket.subject}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                                                <span>{ticket.createdBy?.name}</span>
                                                <span>•</span>
                                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-[var(--text-secondary)]" size={18} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Ticket Detail */}
                <Card>
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b border-[var(--border)]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-mono text-[var(--text-secondary)]">
                                        {selectedTicket.ticketId}
                                    </span>
                                    <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${STATUS_STYLES[selectedTicket.status]?.bg} ${STATUS_STYLES[selectedTicket.status]?.text}
                  `}>
                                        {STATUS_STYLES[selectedTicket.status]?.label}
                                    </span>
                                </div>
                                <h2 className="font-semibold text-[var(--text)]">{selectedTicket.subject}</h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                                    <span>By: {selectedTicket.createdBy?.name}</span>
                                    <span>{selectedTicket.createdBy?.email}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-2">
                                {!selectedTicket.assignedTo && (
                                    <Button size="sm" variant="primary" onClick={handleAssignToMe}>
                                        <UserPlus size={16} className="mr-1" />
                                        Assign to Me
                                    </Button>
                                )}
                                <select
                                    value={selectedTicket.status}
                                    onChange={(e) => handleUpdateStatus(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg text-sm bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]"
                                >
                                    {Object.values(TICKET_STATUS).map(status => (
                                        <option key={status} value={status}>
                                            {STATUS_STYLES[status]?.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Messages */}
                            <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                                {selectedTicket.messages?.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`
                      p-3 rounded-xl
                      ${msg.isStaff
                                                ? 'bg-primary-500/10 border border-primary-500/30'
                                                : 'bg-[var(--surface-hover)]'
                                            }
                    `}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-[var(--text)]">
                                                {msg.sender?.name || 'Unknown'}
                                            </span>
                                            {msg.isStaff && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400">
                                                    Staff
                                                </span>
                                            )}
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {new Date(msg.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text)]">{msg.content}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Reply */}
                            <div className="p-4 border-t border-[var(--border)]">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)]"
                                    />
                                    <Button type="submit" variant="primary" size="sm" loading={sending}>
                                        Send
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center text-[var(--text-secondary)]">
                            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Select a ticket to view details</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Resolution Modal */}
            {resolutionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <Card className="w-full max-w-md">
                        <div className="p-4 border-b border-[var(--border)]">
                            <h3 className="text-lg font-semibold text-[var(--text)]">Resolve Ticket</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-[var(--text-secondary)]">
                                Please provide a resolution note for the user. This will be visible on their ticket.
                            </p>
                            <textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Resolution details..."
                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                            />
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setResolutionModalOpen(false);
                                        setPendingStatus(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={confirmResolution}
                                    disabled={!resolutionNote.trim()}
                                >
                                    Confirm Resolution
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
