import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Send, Clock, CheckCircle, AlertCircle,
    User, MessageSquare, Loader
} from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ticketsAPI } from '../services/api';
import { STATUS_STYLES, TICKET_STATUS } from '../constants';

export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.messages]);

    const fetchTicket = async () => {
        try {
            const data = await ticketsAPI.getById(id);
            setTicket(data);
        } catch (error) {
            console.error('Failed to load ticket:', error);
            navigate('/support');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        try {
            const updated = await ticketsAPI.sendMessage(id, message);
            setTicket(updated);
            setMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error-400" />
                    <h2 className="text-xl font-semibold text-[var(--text)]">Ticket Not Found</h2>
                    <Link to="/support" className="text-primary-400 hover:underline mt-2 inline-block">
                        Back to Support
                    </Link>
                </div>
            </div>
        );
    }

    const isClosed = ticket.status === TICKET_STATUS.RESOLVED || ticket.status === TICKET_STATUS.CLOSED;

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        to="/support"
                        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text)] mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Support
                    </Link>

                    <Card className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-mono text-[var(--text-secondary)]">
                                        {ticket.ticketId}
                                    </span>
                                    <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${STATUS_STYLES[ticket.status]?.bg} ${STATUS_STYLES[ticket.status]?.text}
                  `}>
                                        {STATUS_STYLES[ticket.status]?.label}
                                    </span>
                                </div>
                                <h1 className="text-xl font-bold text-[var(--text)]">{ticket.subject}</h1>
                            </div>
                            <div className="text-right text-sm text-[var(--text-secondary)]">
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {ticket.assignedTo && (
                            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2">
                                <span className="text-sm text-[var(--text-secondary)]">Assigned to:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-sm">
                                        {ticket.assignedTo.avatar || '👤'}
                                    </div>
                                    <span className="text-sm text-[var(--text)]">{ticket.assignedTo.name}</span>
                                </div>
                            </div>
                        )}

                        {ticket.resolution && (
                            <div className="mt-4 p-3 rounded-xl bg-success-500/10 border border-success-500/30">
                                <div className="flex items-center gap-2 text-success-400 mb-1">
                                    <CheckCircle size={16} />
                                    <span className="text-sm font-medium">Resolution</span>
                                </div>
                                <p className="text-sm text-[var(--text)]">{ticket.resolution}</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Messages */}
                <Card className="mb-4">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="font-semibold text-[var(--text)] flex items-center gap-2">
                            <MessageSquare size={18} />
                            Conversation
                        </h2>
                    </div>

                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                        {ticket.messages?.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${msg.isStaff ? '' : 'flex-row-reverse'}`}
                            >
                                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                  ${msg.isStaff
                                        ? 'bg-primary-500/20'
                                        : 'bg-secondary-500/20'
                                    }
                `}>
                                    {msg.sender?.avatar || (msg.isStaff ? '🛡️' : '👤')}
                                </div>
                                <div className={`
                  max-w-[80%] p-3 rounded-2xl
                  ${msg.isStaff
                                        ? 'bg-[var(--surface-hover)] rounded-tl-none'
                                        : 'bg-primary-500/20 rounded-tr-none'
                                    }
                `}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-[var(--text)]">
                                            {msg.sender?.name || (msg.isStaff ? 'Support' : 'You')}
                                        </span>
                                        {msg.isStaff && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400">
                                                Staff
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[var(--text)]">{msg.content}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </Card>

                {/* Reply Form */}
                {!isClosed ? (
                    <Card className="p-4">
                        <form onSubmit={handleSendMessage} className="flex gap-3">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                loading={sending}
                                disabled={!message.trim()}
                            >
                                <Send size={20} />
                            </Button>
                        </form>
                    </Card>
                ) : (
                    <Card className="p-4 text-center">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success-400" />
                        <p className="text-[var(--text-secondary)]">
                            This ticket has been {ticket.status}.
                            <button
                                onClick={() => navigate('/support')}
                                className="text-primary-400 hover:underline ml-1"
                            >
                                Create a new ticket
                            </button>
                            {' '}if you need further help.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
