import { useState, useEffect } from 'react';
import { Button } from '../ui';

export default function QuizForm({ quiz, courses, courseId, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: courseId || (courses && courses.length > 0 ? courses[0]._id : ''),
        timeLimit: 15,
        passingScore: 70,
        xpReward: 100,
        isPublished: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (quiz) {
            setFormData({
                title: quiz.title || '',
                description: quiz.description || '',
                courseId: (typeof quiz.courseId === 'object' ? quiz.courseId?._id : quiz.courseId) || '',
                timeLimit: quiz.timeLimit || 15,
                passingScore: quiz.passingScore || 70,
                xpReward: quiz.xpReward || 100,
                isPublished: quiz.isPublished !== undefined ? quiz.isPublished : true,
            });
        } else if (courseId) {
            setFormData(prev => ({ ...prev, courseId }));
        }
    }, [quiz, courseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave({
            ...formData,
            courseId: formData.courseId
        });
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                </div>

                {!courseId && courses && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">Course</label>
                        <select
                            value={formData.courseId}
                            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        >
                            {courses.map((course) => (
                                <option key={course._id} value={course._id}>{course.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">Time Limit (min)</label>
                        <input
                            type="number"
                            value={formData.timeLimit}
                            onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                            min={1}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">Passing Score (%)</label>
                        <input
                            type="number"
                            value={formData.passingScore}
                            onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                            min={0}
                            max={100}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">XP Reward</label>
                    <input
                        type="number"
                        value={formData.xpReward}
                        onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                        min={0}
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                            <span className="block text-sm font-medium text-[var(--text)]">Publish Quiz</span>
                            <span className="block text-xs text-[var(--text-secondary)]">Visible to students when enabled</span>
                        </div>
                    </label>
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={saving}>Cancel</Button>
                <Button type="submit" variant="primary" fullWidth disabled={saving}>{quiz ? 'Save Changes' : 'Create Quiz'}</Button>
            </div>
        </form>
    );
}
