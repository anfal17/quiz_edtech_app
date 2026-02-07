import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit, Trash2, Eye,
    HelpCircle, Download, Upload
} from 'lucide-react';
import { Button, Card, Badge, Modal, toast } from '../../components/ui';
import { quizzesAPI, coursesAPI } from '../../services/api';

export default function ManageQuizzes() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDomain, setFilterDomain] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(null);


    useEffect(() => {
        fetchData();
        fetchCourses();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await quizzesAPI.getAllAdmin(); // Get all quizzes (including drafts)
            setQuizzes(data);
        } catch (error) {
            toast.error('Failed to fetch quizzes');
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

    const handleDelete = async () => {
        if (!showDeleteModal) return;
        try {
            await quizzesAPI.delete(showDeleteModal._id);
            setQuizzes(quizzes.filter((q) => q._id !== showDeleteModal._id));
            toast.success('Quiz deleted successfully');
            setShowDeleteModal(null);
        } catch (error) {
            toast.error('Failed to delete quiz');
        }
    };

    const getDomainTitle = (courseId) => {
        if (!courseId) return 'Unassigned';
        const id = typeof courseId === 'object' ? courseId._id : courseId;
        const course = courses.find((c) => c._id === id);
        return course ? course.title : 'Unknown Course';
    };

    const isDetached = (quiz) => {
        if (!quiz.courseId) return true;
        const courseId = typeof quiz.courseId === 'object' ? quiz.courseId._id : quiz.courseId;
        const course = courses.find(c => c._id === courseId);
        if (!course) return true;

        if (course.learningPath && course.learningPath.length > 0) {
            const inLearningPath = course.learningPath.some(item =>
                (item.itemId === quiz._id || item.itemId?._id === quiz._id) && item.itemType === 'Quiz'
            );
            if (inLearningPath) return false;
        }

        // If course has learningPath but this quiz isn't in it, it's orphan.
        // If course has no learningPath, assume detached (since we migrated).
        return true;
    };

    // Filter quizzes
    const filteredQuizzes = useMemo(() => {
        let result = [...quizzes];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (q) =>
                    q.title.toLowerCase().includes(query) ||
                    (q.description && q.description.toLowerCase().includes(query))
            );
        }

        if (filterDomain !== 'all') {
            result = result.filter((q) => {
                const qDomainId = typeof q.courseId === 'object' ? q.courseId?._id : q.courseId;
                return qDomainId === filterDomain;
            });
        }

        // Status Filter
        if (filterStatus !== 'all') {
            if (filterStatus === 'published') {
                result = result.filter(q => q.isPublished);
            } else if (filterStatus === 'draft') {
                result = result.filter(q => !q.isPublished);
            } else if (filterStatus === 'detached') {
                result = result.filter(q => isDetached(q));
            }
        }

        return result;
    }, [quizzes, searchQuery, filterDomain, filterStatus]);

    // ...

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Manage Quizzes</h1>
                    <p className="text-[var(--text-secondary)]">Create and manage quizzes for your courses.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/create-quiz">
                        <Button variant="primary" leftIcon={<Plus size={18} />}>
                            Create Quiz
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search quizzes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

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

            {/* Quizzes Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Quiz</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Course</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Questions</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Pass Score</th>
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
                            ) : filteredQuizzes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-[var(--text-secondary)]">
                                        No quizzes found
                                    </td>
                                </tr>
                            ) : (
                                filteredQuizzes.map((quiz) => (
                                    <tr key={quiz._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]">
                                        <td className="py-4 px-6">
                                            <h3 className="font-medium text-[var(--text)]">{quiz.title}</h3>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-1 max-w-xs">
                                                {quiz.description || 'No description'}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6 text-[var(--text-secondary)]">
                                            {getDomainTitle(quiz.courseId)}
                                        </td>
                                        <td className="py-4 px-6 text-[var(--text)]">
                                            {quiz.questions?.length || quiz.totalQuestions || 0}
                                        </td>
                                        <td className="py-4 px-6 text-[var(--text)]">
                                            {quiz.passingScore}%
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <Badge variant={quiz.isPublished ? 'success' : 'warning'}>
                                                    {quiz.isPublished ? 'Published' : 'Draft'}
                                                </Badge>
                                                {isDetached(quiz) && (
                                                    <Badge variant="error" title="Not part of any course Learning Path">Detached</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/create-quiz?id=${quiz._id}`}>
                                                    <button className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-primary-400">
                                                        <Edit size={18} />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => setShowDeleteModal(quiz)}
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

            {/* Delete Modal */}
            <Modal
                isOpen={!!showDeleteModal}
                onClose={() => setShowDeleteModal(null)}
                title="Delete Quiz"
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
