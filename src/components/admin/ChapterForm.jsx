import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useDebouncedCallback } from 'use-debounce';
import { Button, Badge } from '../ui';
import { Save, CheckCircle } from 'lucide-react';

export default function ChapterForm({ chapter, courses, courseId, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        courseId: courseId || '',
        type: 'reading',
        estimatedMinutes: 15,
        xpReward: 50,
        content: '',
        order: '',
        isPublished: true,
    });

    const [lastSaved, setLastSaved] = useState(Date.now());
    const [isDirty, setIsDirty] = useState(false);

    // Skip first render to avoid auto-saving initial state
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (chapter) {
            setFormData({
                title: chapter.title || '',
                courseId: (typeof chapter.courseId === 'object' ? chapter.courseId?._id : chapter.courseId) || courseId || '',
                type: 'reading',
                estimatedMinutes: chapter.estimatedMinutes || 15,
                xpReward: chapter.xpReward || 50,
                content: chapter.content || '',
                order: chapter.order || '',
                isPublished: chapter.isPublished !== undefined ? chapter.isPublished : true,
            });
            setIsDirty(false);
        }
    }, [chapter, courseId]);

    const debouncedSave = useDebouncedCallback((data) => {
        if (!chapter) return; // Should not happen with new flow
        const payload = {
            ...data,
            _id: chapter._id, // Ensure we pass the ID
            courseId: data.courseId
        };
        onSave(payload);
        setLastSaved(Date.now());
        setIsDirty(false);
    }, 60000);


    const handleChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            setIsDirty(true);
            debouncedSave(newData);
            return newData;
        });
    };

    // ReactQuill modules configuration
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', // 'bullet' is not a separate format in basic Quill setup, it's covered by list
        'link', 'image', 'video'
    ];

    return (
        <div className="space-y-4 flex flex-col h-full">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {formData.title || 'Untitled Chapter'}
                        {isDirty ? (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-warning-500/10 text-warning-500 animate-pulse">Saving...</span>
                        ) : (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-success-500/10 text-success-500 flex items-center gap-1">
                                <CheckCircle size={10} /> Saved
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* Manual Save (Optional, for force save) */}
                    {isDirty && (
                        <Button size="xs" variant="ghost" onClick={() => debouncedSave.flush()} title="Save now">
                            <Save size={14} />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">Estimated Minutes</label>
                        <input
                            type="number"
                            value={formData.estimatedMinutes}
                            onChange={(e) => handleChange('estimatedMinutes', parseInt(e.target.value))}
                            min={1}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">XP Reward</label>
                        <input
                            type="number"
                            value={formData.xpReward}
                            onChange={(e) => handleChange('xpReward', parseInt(e.target.value))}
                            min={0}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isPublished}
                            onChange={(e) => handleChange('isPublished', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                            <span className="block text-sm font-medium text-[var(--text)]">Publish Chapter</span>
                            <span className="block text-xs text-[var(--text-secondary)]">Visible to students when enabled</span>
                        </div>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">Content</label>
                    <div className="bg-white rounded-xl overflow-hidden text-black shadow-inner">
                        <ReactQuill
                            theme="snow"
                            value={formData.content}
                            onChange={(content) => handleChange('content', content)}
                            modules={modules}
                            formats={formats}
                            className="h-[500px] mb-12"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
