import { useState, useMemo, useEffect } from 'react';
import {
    Plus, Search, Edit, Trash2, Eye,
    FileText, BookOpen
} from 'lucide-react';
import { Button, Card, Badge, Modal, toast } from '../../components/ui';
import { chaptersAPI, coursesAPI } from '../../services/api';
import ChapterForm from '../../components/admin/ChapterForm';

export default function ManageChapters() {
    const [chapters, setChapters] = useState([]); // Chapters list
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'published', 'draft', 'detached'
    const [filterDomain, setFilterDomain] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingChapter, setEditingChapter] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);


    useEffect(() => {
        fetchData();
        fetchCourses();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await chaptersAPI.getAllAdmin();
            setChapters(data);
        } catch (error) {
            toast.error('Failed to fetch chapters');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const data = await coursesAPI.getAll();
            setCourses(data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    const handleSave = async (chapterData) => {
        try {
            let savedChapter;
            if (chapterData._id) {
                savedChapter = await chaptersAPI.update(chapterData._id, chapterData);
                setChapters(chapters.map((c) => (c._id === savedChapter._id ? savedChapter : c)));
                toast.success('Chapter updated successfully');
            } else {
                savedChapter = await chaptersAPI.create(chapterData);
                setChapters([...chapters, savedChapter]);
                toast.success('Chapter created successfully');
            }
            setShowAddModal(false);
            setEditingChapter(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save chapter');
        }
    };

    const handleDelete = async () => {
        if (!showDeleteModal) return;
        try {
            await chaptersAPI.delete(showDeleteModal._id);
            setChapters(chapters.filter((c) => c._id !== showDeleteModal._id));
            toast.success('Chapter deleted successfully');
            setShowDeleteModal(null);
        } catch (error) {
            toast.error('Failed to delete chapter');
        }
    };

    const getDomainTitle = (courseId) => {
        if (!courseId) return 'Unassigned';
        const id = typeof courseId === 'object' ? courseId._id : courseId;
        const course = courses.find((c) => c._id === id);
        return course ? course.title : 'Unknown Course';
    };

    // Helper to check if chapter is "connected" to its course
    const isDetached = (chapter) => {
        if (!chapter.courseId) return true;
        const courseId = typeof chapter.courseId === 'object' ? chapter.courseId._id : chapter.courseId;
        const course = courses.find(c => c._id === courseId);
        if (!course) return true; // Course doesn't exist

        // Check compatibility with both new learningPath and old chapters array
        // If course has learningPath, check if chapter is in it
        if (course.learningPath && course.learningPath.length > 0) {
            const inLearningPath = course.learningPath.some(item =>
                (item.itemId === chapter._id || item.itemId?._id === chapter._id) && item.itemType === 'Chapter'
            );
            if (inLearningPath) return false;
        }

        // Fallback: If no learningPath or empty, maybe check old chapters array? 
        // But we migrated to learningPath. If learningPath is empty, but chapter says it belongs to course, 
        // it IS detached unless the course is purely old-school. 
        // Let's rely on LearningPath as the truth for "Active" courses.
        // If the course claims to have 0 items in stats, but we see this chapter, it's detached.

        return true;
    };

    // Filter chapters
    const filteredChapters = useMemo(() => {
        let result = [...chapters];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((c) => c.title.toLowerCase().includes(query));
        }

        if (filterDomain !== 'all') {
            result = result.filter((c) => {
                const cDomainId = typeof c.courseId === 'object' ? c.courseId._id : c.courseId;
                return cDomainId === filterDomain;
            });
        }

        // Status Filter
        if (filterStatus !== 'all') {
            if (filterStatus === 'published') {
                result = result.filter(r => r.isPublished);
            } else if (filterStatus === 'draft') {
                result = result.filter(r => !r.isPublished);
            } else if (filterStatus === 'detached') {
                result = result.filter(chapter => isDetached(chapter));
            }
        }

        return result.sort((a, b) => {
            const aCourseId = typeof a.courseId === 'object' ? a.courseId._id : a.courseId;
            const bCourseId = typeof b.courseId === 'object' ? b.courseId._id : b.courseId;
            if (aCourseId === bCourseId) return a.order - b.order;
            return (aCourseId || '').localeCompare(bCourseId || '');
        });
    }, [chapters, searchQuery, filterDomain, filterStatus]); // Add filterStatus dependancy

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">ManageChapters</h1>
                    <p className="text-[var(--text-secondary)]">Organize and edit chapter content for each course.</p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus size={18} />}
                    onClick={() => setShowAddModal(true)}
                >
                    Add Chapter
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search chapters..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="detached">Detached / Orphaned</option>
                    </select>

                    {/* Course Filter */}
                    <select
                        value={filterDomain}
                        onChange={(e) => setFilterDomain(e.target.value)}
                        className="px-4 py-2.5 rounded-xl min-w-[200px] bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Courses</option>
                        {courses.map((course) => (
                            <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Chapters Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">#</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Chapter</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Course</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Status</th>
                                <th className="text-right py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center">
                                        <div className="inline-block animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
                                    </td>
                                </tr>
                            ) : filteredChapters.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-[var(--text-secondary)]">
                                        No chapters found
                                    </td>
                                </tr>
                            ) : (
                                filteredChapters.map((chapter) => (
                                    <tr key={chapter._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]">
                                        <td className="py-4 px-6 text-[var(--text-secondary)]">{chapter.order}</td>
                                        <td className="py-4 px-6">
                                            <h3 className="font-medium text-[var(--text)]">{chapter.title}</h3>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                {chapter.estimatedMinutes} min • {chapter.xpReward} XP
                                            </p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-[var(--text-secondary)]">
                                                {getDomainTitle(chapter.courseId)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                {chapter.isPublished ? (
                                                    <Badge variant="success">Published</Badge>
                                                ) : (
                                                    <Badge variant="warning">Draft</Badge>
                                                )}
                                                {isDetached(chapter) && (
                                                    <Badge variant="error" title="Not part of any course Learning Path">Detached</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingChapter(chapter)}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-primary-400"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteModal(chapter)}
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
                isOpen={showAddModal || !!editingChapter}
                onClose={() => { setShowAddModal(false); setEditingChapter(null); }}
                title={editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
                size="xl"
            >
                <ChapterForm
                    chapter={editingChapter}
                    courses={courses}
                    onClose={() => { setShowAddModal(false); setEditingChapter(null); }}
                    onSave={handleSave}
                />
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!showDeleteModal}
                onClose={() => setShowDeleteModal(null)}
                title="Delete Chapter"
                size="sm"
            >
                <div className="text-center">
                    <p className="text-[var(--text-secondary)] mb-6">
                        Are you sure you want to delete <strong className="text-[var(--text)]">{showDeleteModal?.title}</strong>?
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => setShowDeleteModal(null)}>Cancel</Button>
                        <Button variant="primary" fullWidth className="bg-error-500 hover:bg-error-600" onClick={handleDelete}>Delete</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
