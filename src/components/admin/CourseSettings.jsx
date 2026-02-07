import { useState, useEffect } from 'react';
import { Save, Image, Type, Settings as SettingsIcon, Palette } from 'lucide-react';
import { Button, Card, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui';
import { COURSE_ICONS, COURSE_GRADIENTS } from '../../constants';

export default function CourseSettings({ course, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: '📚',
        difficulty: 'beginner',
        tags: '',
        color: 'from-emerald-500 to-teal-500',
        isPublished: false,
    });
    const [activeTab, setActiveTab] = useState('general');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (course) {
            setFormData({
                title: course.title || '',
                description: course.description || '',
                icon: course.icon || '📚',
                difficulty: course.difficulty || 'beginner',
                tags: course.tags?.join(', ') || '',
                color: course.color || 'from-emerald-500 to-teal-500',
                isPublished: course.isPublished || false,
            });
        }
    }, [course]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const tagsArray = formData.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            await onSave({
                ...formData,
                tags: tagsArray
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text)]">Course Settings</h2>
                    <p className="text-[var(--text-secondary)]">Manage general information and appearance.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} leftIcon={<Save size={18} />}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <Tabs value={activeTab} onChange={setActiveTab} className="flex-col">
                <TabsList className="w-full justify-start mb-6 bg-transparent border-b border-[var(--border)] p-0 rounded-none h-auto">
                    <TabsTrigger
                        value="general"
                        className={`rounded-b-none border-b-2 border-transparent px-6 py-3 ${activeTab === 'general' ? '!border-primary-500 !text-primary-500 !bg-transparent shadow-none' : '!bg-transparent'}`}
                    >
                        <Type size={16} className="mr-2" /> General
                    </TabsTrigger>
                    <TabsTrigger
                        value="appearance"
                        className={`rounded-b-none border-b-2 border-transparent px-6 py-3 ${activeTab === 'appearance' ? '!border-primary-500 !text-primary-500 !bg-transparent shadow-none' : '!bg-transparent'}`}
                    >
                        <Palette size={16} className="mr-2" /> Appearance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card title="Basic Information">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-2">Course Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. Introduction to Islamic History"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500 resize-none"
                                    placeholder="What will students learn in this course?"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card title="Categorization">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-2">Difficulty Level</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-2">Tags</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. history, faith, ethics (comma separated)"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isPublished}
                                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                                <span className="block text-sm font-medium text-[var(--text)]">Publish Course</span>
                                <span className="block text-xs text-[var(--text-secondary)]">Make this course visible to all students</span>
                            </div>
                        </label>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6">
                    <Card title="Visual Identity">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-3">Course Icon</label>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] max-h-60 overflow-y-auto">
                                    {COURSE_ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon })}
                                            className={`
                                                aspect-square flex items-center justify-center text-2xl rounded-lg transition-all
                                                ${formData.icon === icon
                                                    ? 'bg-primary-500 text-white shadow-lg scale-110 ring-2 ring-primary-500 ring-offset-2 ring-offset-[var(--bg)]'
                                                    : 'hover:bg-[var(--surface)] text-[var(--text)] hover:scale-105'}
                                            `}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-3">Theme Gradient</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {COURSE_GRADIENTS.map((gradient) => (
                                        <button
                                            key={gradient.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: gradient.value })}
                                            className={`
                                                relative h-16 rounded-xl overflow-hidden group transition-all text-left
                                                ${formData.color === gradient.value
                                                    ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-[var(--bg)] scale-105'
                                                    : 'hover:opacity-90'}
                                            `}
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient.value}`} />
                                            <span className="absolute bottom-2 left-3 text-xs font-bold text-white shadow-sm drop-shadow-md">
                                                {gradient.label}
                                            </span>
                                            {formData.color === gradient.value && (
                                                <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full shadow-sm" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${formData.color} flex items-center justify-center text-2xl text-white shadow-md`}>
                                    {formData.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--text)]">{formData.title || 'Course Title'}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">Preview of course card style</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
