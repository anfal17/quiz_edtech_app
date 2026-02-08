import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { feedbackAPI } from '../services/api';

const FEEDBACK_TYPES = {
    chapter: { label: 'Chapter', icon: '📖', color: 'text-blue-400' },
    quiz_question: { label: 'Quiz Question', icon: '❓', color: 'text-purple-400' }
};

const ISSUE_TYPES = {
    typo: { label: 'Typo', color: 'text-yellow-400' },
    error: { label: 'Error', color: 'text-error-400' },
    improvement: { label: 'Improvement', color: 'text-info-400' },
    other: { label: 'Other', color: 'text-gray-400' }
};

const STATUS_STYLES = {
    open: { label: 'Open', bg: 'bg-info-500/20', text: 'text-info-400', icon: AlertCircle },
    in_review: { label: 'In Review', bg: 'bg-warning-500/20', text: 'text-warning-400', icon: Clock },
    resolved: { label: 'Resolved', bg: 'bg-success-500/20', text: 'text-success-400', icon: CheckCircle },
    dismissed: { label: 'Dismissed', bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle }
};

export default function MyFeedback() {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchFeedback();
    }, [filter]);

    const fetchFeedback = async () => {
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const data = await feedbackAPI.getAll(params);
            setFeedback(data.feedback || []);
        } catch (error) {
            console.error('Failed to load feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--text)]">My Feedback</h1>
                    <p className="text-[var(--text-secondary)]">Track your submitted feedback and responses</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    {['all', 'open', 'in_review', 'resolved', 'dismissed'].map((status) => (
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
                            {status === 'all' ? 'All' : STATUS_STYLES[status]?.label}
                        </button>
                    ))}
                </div>

                {/* Feedback List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : feedback.length === 0 ? (
                    <Card className="p-12 text-center">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                        <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No feedback yet</h3>
                        <p className="text-[var(--text-secondary)]">
                            {filter === 'all'
                                ? "You haven't submitted any feedback"
                                : `No ${filter} feedback found`
                            }
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {feedback.map((item) => {
                            const StatusIcon = STATUS_STYLES[item.status]?.icon;
                            return (
                                <Card key={item._id} className="p-6 hover:border-primary-500/30 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">
                                            {FEEDBACK_TYPES[item.feedbackType]?.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status]?.bg} ${STATUS_STYLES[item.status]?.text} flex items-center gap-1`}>
                                                    {StatusIcon && <StatusIcon size={12} />}
                                                    {STATUS_STYLES[item.status]?.label}
                                                </span>
                                                <span className={`text-xs ${ISSUE_TYPES[item.issueType]?.color}`}>
                                                    {ISSUE_TYPES[item.issueType]?.label}
                                                </span>
                                                <span className={`text-xs ${FEEDBACK_TYPES[item.feedbackType]?.color}`}>
                                                    {FEEDBACK_TYPES[item.feedbackType]?.label}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-[var(--text)] mb-1">
                                                {item.contentTitle}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                                {item.description}
                                            </p>
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                Submitted {new Date(item.createdAt).toLocaleDateString()}
                                            </div>

                                            {/* Admin Response */}
                                            {item.resolution && (
                                                <div className="mt-4 p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                                                    <div className="flex items-center gap-2 text-primary-400 mb-2">
                                                        <CheckCircle size={16} />
                                                        <span className="text-sm font-medium">Admin Response</span>
                                                    </div>
                                                    <p className="text-sm text-[var(--text)]">{item.resolution}</p>
                                                    {item.resolvedBy && (
                                                        <p className="text-xs text-[var(--text-secondary)] mt-2">
                                                            By {item.resolvedBy.name} • {new Date(item.resolvedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
