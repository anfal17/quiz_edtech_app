import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit, Trash2, Eye, ChevronDown,
    BookOpen, Filter
} from 'lucide-react';
import { Button, Card, Badge, Modal, toast, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { COURSE_ICONS, COURSE_GRADIENTS } from '../../constants';
import { coursesAPI } from '../../services/api';

// import CourseBuilder from '../../components/admin/CourseBuilder';

export default function ManageCourses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [editingStructure, setEditingStructure] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const data = await coursesAPI.getAllAdmin();
            setCourses(data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleDelete = async () => {
        if (!showDeleteModal) return;
        try {
            await coursesAPI.delete(showDeleteModal._id);
            toast.success('Course deleted successfully');
            fetchCourses(); // Refresh
        } catch (error) {
            console.error('Failed to delete course:', error);
            toast.error('Failed to delete course');
        } finally {
            setShowDeleteModal(null);
        }
    };

    const handleSave = async (courseData) => {
        try {
            if (editingCourse) {
                await coursesAPI.update(editingCourse._id, courseData);
                toast.success('Course updated successfully');
            } else {
                const newCourse = await coursesAPI.create(courseData);
                toast.success('Course created! Redirecting to editor...');
                // Auto-redirect to structure builder
                navigate(`/admin/course-editor/${newCourse._id}`);
                return;
            }
            fetchCourses();
            setShowAddModal(false);
            setEditingCourse(null);
        } catch (error) {
            console.error('Failed to save course:', error);
            toast.error(error.message || 'Failed to save course');
        }
    };

    // Filter courses
    const filteredCourses = useMemo(() => {
        let result = [...courses];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (d) =>
                    d.title.toLowerCase().includes(query) ||
                    d.description.toLowerCase().includes(query)
            );
        }

        if (filterDifficulty !== 'all') {
            result = result.filter((d) => d.difficulty === filterDifficulty);
        }

        return result;
    }, [courses, searchQuery, filterDifficulty]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Manage Courses</h1>
                    <p className="text-[var(--text-secondary)]">Add, edit, and manage your learning courses.</p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus size={18} />}
                    onClick={() => setShowAddModal(true)}
                >
                    Add Course
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="
                w-full pl-12 pr-4 py-2.5 rounded-xl
                bg-[var(--surface-hover)] border border-[var(--border)]
                text-[var(--text)] placeholder:text-[var(--text-secondary)]
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
                        />
                    </div>

                    {/* Difficulty Filter */}
                    <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="
              px-4 py-2.5 rounded-xl
              bg-[var(--surface-hover)] border border-[var(--border)]
              text-[var(--text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
                    >
                        <option value="all">All Difficulties</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            </Card>

            {/* Courses Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Course</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Difficulty</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Chapters</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Quizzes</th>
                                <th className="text-right py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center">
                                        <div className="inline-block animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
                                    </td>
                                </tr>
                            ) : filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-[var(--text-secondary)]">
                                        No courses found
                                    </td>
                                </tr>
                            ) : (
                                filteredCourses.map((course) => (
                                    <tr key={course._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center text-xl">
                                                    {course.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-[var(--text)]">{course.title}</h3>
                                                    <p className="text-sm text-[var(--text-secondary)] line-clamp-1 max-w-xs">
                                                        {course.description}
                                                    </p>
                                                    {!course.isPublished && (
                                                        <Badge variant="warning" size="sm" className="mt-1">
                                                            Draft
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge variant={course.difficulty || 'beginner'}>{course.difficulty || 'beginner'}</Badge>
                                        </td>
                                        <td className="py-4 px-6 text-[var(--text)]">
                                            -
                                        </td>
                                        <td className="py-4 px-6 text-[var(--text)]">
                                            -
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/domain/${course._id}`}>
                                                    <button className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-primary-400">
                                                        <Eye size={18} />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => navigate(`/admin/course-editor/${course._id}`)}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-primary-400"
                                                    title="Open Course Editor"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteModal(course)}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-error-400"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showAddModal || !!editingCourse}
                onClose={() => { setShowAddModal(false); setEditingCourse(null); }}
                title={editingCourse ? 'Edit Course' : 'Add New Course'}
                size="lg"
            >
                <CourseForm
                    course={editingCourse}
                    onClose={() => { setShowAddModal(false); setEditingCourse(null); }}
                    onSave={handleSave}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!showDeleteModal}
                onClose={() => setShowDeleteModal(null)}
                title="Delete Course"
                size="sm"
            >
                <div className="text-center">
                    <p className="text-[var(--text-secondary)] mb-6">
                        Are you sure you want to delete <strong className="text-[var(--text)]">{showDeleteModal?.title}</strong>?
                        This action cannot be undone. Associated chapters and quizzes will also be deleted.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => setShowDeleteModal(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            className="bg-error-500 hover:bg-error-600"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function CourseForm({ course, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || '',
        icon: course?.icon || '📚',
        difficulty: course?.difficulty || 'beginner',
        tags: course?.tags?.join(', ') || '',
        color: course?.color || 'from-emerald-500 to-teal-500',
        isPublished: course ? course.isPublished : true,
    });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const tagsArray = formData.tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        await onSave({
            ...formData,
            tags: tagsArray
        });
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="h-[60vh] flex flex-col">
            <Tabs value={activeTab} onChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <TabsContent value="general" className="space-y-4 data-[state=inactive]:hidden">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500 resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-2">Difficulty</label>
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
                                    placeholder="e.g. math, science"
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-4 data-[state=inactive]:hidden">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">Icon</label>
                            <div className="grid grid-cols-6 gap-2 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] max-h-48 overflow-y-auto">
                                {COURSE_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon })}
                                        className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${formData.icon === icon ? 'bg-primary-500 text-white shadow-lg scale-110' : 'hover:bg-[var(--surface)] text-[var(--text)]'}`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">Theme Color</label>
                            <div className="grid grid-cols-2 gap-2">
                                {COURSE_GRADIENTS.map((gradient) => (
                                    <button
                                        key={gradient.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: gradient.value })}
                                        className={`relative h-12 rounded-xl overflow-hidden group transition-all ${formData.color === gradient.value ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-[var(--bg)]' : ''}`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient.value}`} />
                                        <span className="relative z-10 text-xs font-bold text-white shadow-sm">{gradient.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4 data-[state=inactive]:hidden">
                        <div>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-[var(--text)]">Publish Course</span>
                                    <span className="block text-xs text-[var(--text-secondary)]">Visible to all students when enabled</span>
                                </div>
                            </label>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t border-[var(--border)] mt-4">
                <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={saving}>Cancel</Button>
                {activeTab !== 'settings' ? (
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                            if (activeTab === 'general') setActiveTab('appearance');
                            else if (activeTab === 'appearance') setActiveTab('settings');
                        }}
                    >
                        Next
                    </Button>
                ) : (
                    <Button type="submit" variant="primary" fullWidth disabled={saving}>
                        {saving ? 'Saving...' : (course ? 'Save Changes' : 'Create Course')}
                    </Button>
                )}
            </div>
        </form>
    );
}
