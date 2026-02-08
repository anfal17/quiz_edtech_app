import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button, Modal } from './index';
import { feedbackAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ISSUE_TYPES = [
    { value: 'typo', label: 'Typo / Spelling Error' },
    { value: 'error', label: 'Incorrect Information' },
    { value: 'improvement', label: 'Suggestion for Improvement' },
    { value: 'other', label: 'Other' }
];

export default function FeedbackModal({ isOpen, onClose, feedbackType, contentId, contentTitle, courseId, chapterId, quizId }) {
    const [issueType, setIssueType] = useState('typo');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) return;

        setSubmitting(true);
        try {
            await feedbackAPI.create({
                feedbackType,
                contentId,
                contentTitle,
                courseId,
                chapterId,
                quizId,
                issueType,
                description: description.trim()
            });
            toast.success('Feedback submitted successfully! We\'ll review it soon.');
            setDescription('');
            setIssueType('typo');
            onClose();
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            toast.error(error.message || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Report an Issue">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 rounded-xl bg-info-500/10 border border-info-500/30 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-info-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[var(--text-secondary)]">
                        <p className="font-medium text-[var(--text)] mb-1">Help us improve</p>
                        <p>Found a typo, error, or have a suggestion? Let us know and we'll review it.</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                        Issue Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {ISSUE_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setIssueType(type.value)}
                                className={`
                                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                                    ${issueType === type.value
                                        ? 'bg-primary-500/20 text-primary-400 border-2 border-primary-500'
                                        : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border-2 border-transparent hover:border-[var(--border)]'
                                    }
                                `}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please describe the issue or suggestion..."
                        required
                        maxLength={1000}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {description.length}/1000 characters
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        fullWidth
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={submitting}
                        disabled={!description.trim()}
                        fullWidth
                    >
                        Submit Feedback
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
