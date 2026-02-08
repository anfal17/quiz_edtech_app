import { useState, useEffect } from 'react';
import { MessageSquare, Filter, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { feedbackAPI } from '../../services/api';
import toast from 'react-hot-toast';

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
    open: { label: 'Open', bg: 'bg-info-500/20', text: 'text-info-400' },
    in_review: { label: 'In Review', bg: 'bg-warning-500/20', text: 'text-warning-400' },
    resolved: { label: 'Resolved', bg: 'bg-success-500/20', text: 'text-success-400' },
    dismissed: { label: 'Dismissed', bg: 'bg-gray-500/20', text: 'text-gray-400' }
};

export default function ManageFeedback() {
    const [feedback, setFeedback] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('open');
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [resolution, setResolution] = useState('');
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const data = await feedbackAPI.getAllAdmin(params);
            setFeedback(data.feedback || []);
            setStats(data.stats || {});
        } catch (error) {
            console.error('Failed to load feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (status) => {
        if (!selectedFeedback) return;
        setResolving(true);

        try {
            await feedbackAPI.resolve(selectedFeedback._id, { status, resolution });
            toast.success(`Feedback ${status === 'resolved' ? 'resolved' : 'dismissed'} successfully`);
            setSelectedFeedback(null);
            setResolution('');
            fetchData();
        } catch (error) {
            console.error('Failed to resolve feedback:', error);
            toast.error('Failed to update feedback');
        } finally {
            setResolving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--text)]">Content Feedback</h1>
                <p className="text-[var(--text-secondary)]">Review and resolve user feedback on chapters and quizzes</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-info-400">{stats.open || 0}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Open</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-warning-400">{stats.in_review || 0}</div>
                    <div className="text-sm text-[var(--text-secondary)]">In Review</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-success-400">{stats.resolved || 0}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Resolved</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-400">{stats.dismissed || 0}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Dismissed</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-[var(--text)]">{stats.total || 0}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Total</div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Feedback List */}
                <Card>
                    <div className="p-4 border-b border-[var(--border)]">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {['open', 'in_review', 'resolved', 'dismissed', 'all'].map((status) => (
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
                                <div className="w-6 h-6 mx-auto border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : feedback.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-secondary)]">
                                No feedback found
                            </div>
                        ) : (
                            feedback.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => setSelectedFeedback(item)}
                                    className={`
                                        p-4 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors
                                        ${selectedFeedback?._id === item._id ? 'bg-primary-500/10' : ''}
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-xl">{FEEDBACK_TYPES[item.feedbackType]?.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status]?.bg} ${STATUS_STYLES[item.status]?.text}`}>
                                                    {STATUS_STYLES[item.status]?.label}
                                                </span>
                                                <span className={`text-xs ${ISSUE_TYPES[item.issueType]?.color}`}>
                                                    {ISSUE_TYPES[item.issueType]?.label}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-[var(--text)] truncate">{item.contentTitle}</h3>
                                            <p className="text-sm text-[var(--text-secondary)] truncate">{item.description}</p>
                                            <div className="text-xs text-[var(--text-secondary)] mt-1">
                                                {item.createdBy?.name} • {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Feedback Detail */}
                <Card>
                    {selectedFeedback ? (
                        <>
                            <div className="p-4 border-b border-[var(--border)]">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{FEEDBACK_TYPES[selectedFeedback.feedbackType]?.icon}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[selectedFeedback.status]?.bg} ${STATUS_STYLES[selectedFeedback.status]?.text}`}>
                                        {STATUS_STYLES[selectedFeedback.status]?.label}
                                    </span>
                                </div>
                                <h2 className="font-semibold text-[var(--text)]">{selectedFeedback.contentTitle}</h2>
                                <div className="flex items-center gap-2 mt-2 text-sm text-[var(--text-secondary)]">
                                    <span className={ISSUE_TYPES[selectedFeedback.issueType]?.color}>
                                        {ISSUE_TYPES[selectedFeedback.issueType]?.label}
                                    </span>
                                    <span>•</span>
                                    <span>{selectedFeedback.createdBy?.name}</span>
                                </div>
                            </div>

                            <div className="p-4 space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--text)] mb-2">User Feedback</h3>
                                    <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-hover)] p-3 rounded-xl">
                                        {selectedFeedback.description}
                                    </p>
                                </div>

                                {selectedFeedback.status === 'open' || selectedFeedback.status === 'in_review' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                                Resolution / Response
                                            </label>
                                            <textarea
                                                value={resolution}
                                                onChange={(e) => setResolution(e.target.value)}
                                                placeholder="Enter your response..."
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleResolve('in_review')}
                                                loading={resolving}
                                                fullWidth
                                            >
                                                Mark In Review
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleResolve('dismissed')}
                                                loading={resolving}
                                                disabled={!resolution.trim()}
                                                fullWidth
                                            >
                                                Dismiss
                                            </Button>
                                            <Button
                                                variant="primary"
                                                onClick={() => handleResolve('resolved')}
                                                loading={resolving}
                                                disabled={!resolution.trim()}
                                                fullWidth
                                            >
                                                Resolve
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <h3 className="text-sm font-medium text-[var(--text)] mb-2">Resolution</h3>
                                        <div className="p-3 rounded-xl bg-success-500/10 border border-success-500/30">
                                            <p className="text-sm text-[var(--text)]">{selectedFeedback.resolution || 'No resolution provided'}</p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-2">
                                                By {selectedFeedback.resolvedBy?.name} • {new Date(selectedFeedback.resolvedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center text-[var(--text-secondary)]">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Select feedback to view details</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
