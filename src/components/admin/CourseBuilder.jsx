import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookOpen, Brain, GripVertical, Plus, Save, X } from 'lucide-react';
import { Button, Card, Badge, toast, Modal } from '../ui';
import { coursesAPI, chaptersAPI, quizzesAPI } from '../../services/api';
import ChapterForm from './ChapterForm';
import QuizForm from './QuizForm';

export default function CourseBuilder({ courseId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([]); // Mixed array { id, type, title, ... }
    const [availableChapters, setAvailableChapters] = useState([]);
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [activeId, setActiveId] = useState(null);

    // Modal States
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [course, chapters, quizzes] = await Promise.all([
                coursesAPI.getById(courseId),
                chaptersAPI.getAllAdmin(courseId),
                quizzesAPI.getAllAdmin() // We might need to filter by courseId manually or API support
            ]);

            // Filter quizzes for this course
            const courseQuizzes = quizzes.filter(q =>
                (typeof q.courseId === 'object' ? q.courseId?._id : q.courseId) === courseId
            );

            // Construct current path from course data or init from existing items
            let currentPath = [];
            if (course.learningPath && course.learningPath.length > 0) {
                currentPath = course.learningPath.map(item => {
                    const detailedItem = item.itemType === 'Chapter'
                        ? chapters.find(c => c._id === item.itemId)
                        : courseQuizzes.find(q => q._id === item.itemId);

                    if (!detailedItem) return null; // Skip deleted items

                    return {
                        id: `${item.itemType}-${item.itemId}`, // Unique ID for dnd
                        realId: item.itemId,
                        type: item.itemType,
                        title: detailedItem.title,
                        isPublished: detailedItem.isPublished
                    };
                }).filter(Boolean);
            } else {
                // If no path, start with existing chapters as default logic found previously
                currentPath = chapters.map(c => ({
                    id: `Chapter-${c._id}`,
                    realId: c._id,
                    type: 'Chapter',
                    title: c.title,
                    isPublished: c.isPublished
                }));
            }

            setItems(currentPath);
            setAvailableChapters(chapters);
            setAvailableQuizzes(courseQuizzes);

        } catch (error) {
            console.error('Failed to load builder data:', error);
            toast.error('Failed to load course data');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const learningPath = items.map(item => ({
                itemType: item.type,
                itemId: item.realId
            }));

            await coursesAPI.updateLearningPath(courseId, learningPath);
            toast.success('Course structure saved!');
            onClose();
        } catch (error) {
            console.error('Failed to save:', error);
            toast.error('Failed to save course structure');
        } finally {
            setSaving(false);
        }
    };

    const addToPath = (item, type) => {
        // Check if already in path
        const exists = items.find(i => i.realId === item._id && i.type === type);
        if (exists) {
            toast.info('Item already added');
            return;
        }

        setItems(prev => [
            ...prev,
            {
                id: `${type}-${item._id}`,
                realId: item._id,
                type: type,
                title: item.title,
                isPublished: item.isPublished
            }
        ]);
    };

    const removeFromPath = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    // creation Handlers
    const handleChapterCreate = async (data) => {
        try {
            const newChapter = await chaptersAPI.create(data);
            toast.success('Chapter created!');
            setShowChapterModal(false);

            // Refresh local data
            const allChapters = await chaptersAPI.getAllAdmin(courseId);
            setAvailableChapters(allChapters);

            // Auto add to path
            addToPath(newChapter, 'Chapter');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create chapter');
        }
    };

    const handleQuizCreate = async (data) => {
        try {
            const newQuiz = await quizzesAPI.create(data);
            toast.success('Quiz created!');
            setShowQuizModal(false);

            // Refresh local data (We need to fetch again to be sure)
            const allQuizzes = await quizzesAPI.getAllAdmin();
            const courseQuizzes = allQuizzes.filter(q =>
                (typeof q.courseId === 'object' ? q.courseId?._id : q.courseId) === courseId
            );
            setAvailableQuizzes(courseQuizzes);

            // Auto add to path
            addToPath(newQuiz, 'Quiz');
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to create quiz');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading builder...</div>;

    // Filter available items to show only those NOT in the path
    const unusedChapters = availableChapters.filter(c => !items.find(i => i.realId === c._id && i.type === 'Chapter'));
    const unusedQuizzes = availableQuizzes.filter(q => !items.find(i => i.realId === q._id && i.type === 'Quiz'));

    return (
        <div className="h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text)]">Course Builder</h2>
                    <p className="text-[var(--text-secondary)]">Drag and drop to structure your course learning path.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} leftIcon={<Save size={18} />}>
                        {saving ? 'Saving...' : 'Save Structure'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
                {/* Available Items Sidebar */}
                <div className="col-span-1 flex flex-col gap-4 overflow-y-auto pr-2">
                    <Card className="flex-1 overflow-auto">
                        <div className="sticky top-0 bg-[var(--surface)] z-10 pb-4 mb-2 border-b border-[var(--border)]">
                            <h3 className="font-semibold text-[var(--text)] mb-3">Available Items</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<Plus size={14} />}
                                    onClick={() => setShowChapterModal(true)}
                                >
                                    Chapter
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<Plus size={14} />}
                                    onClick={() => setShowQuizModal(true)}
                                >
                                    Quiz
                                </Button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Chapters</h4>
                            <div className="space-y-2">
                                {unusedChapters.length === 0 && <p className="text-sm text-[var(--text-secondary)] italic">All chapters added</p>}
                                {unusedChapters.map(chapter => (
                                    <div key={chapter._id} className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex justify-between items-center group">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <BookOpen size={16} className="text-primary-400 flex-shrink-0" />
                                            <span className="text-sm truncate">{chapter.title}</span>
                                        </div>
                                        <button
                                            onClick={() => addToPath(chapter, 'Chapter')}
                                            className="p-1 rounded hover:bg-primary-500/20 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Quizzes</h4>
                            <div className="space-y-2">
                                {unusedQuizzes.length === 0 && <p className="text-sm text-[var(--text-secondary)] italic">All quizzes added</p>}
                                {unusedQuizzes.map(quiz => (
                                    <div key={quiz._id} className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex justify-between items-center group">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Brain size={16} className="text-secondary-400 flex-shrink-0" />
                                            <span className="text-sm truncate">{quiz.title}</span>
                                        </div>
                                        <button
                                            onClick={() => addToPath(quiz, 'Quiz')}
                                            className="p-1 rounded hover:bg-primary-500/20 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Drag and Drop Area */}
                <div className="col-span-2 flex flex-col overflow-hidden">
                    <Card className="flex-1 flex flex-col overflow-hidden bg-[var(--bg)]">
                        <div className="flex-1 overflow-y-auto p-4">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={items.map(i => i.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {items.length === 0 && (
                                            <div className="h-40 flex items-center justify-center border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)]">
                                                Drag items here or use the sidebar to find and create content
                                            </div>
                                        )}
                                        {items.map((item, index) => (
                                            <SortableItem key={item.id} id={item.id} item={item} index={index} onRemove={() => removeFromPath(item.id)} />
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {activeId ? (
                                        <div className="p-4 rounded-xl bg-[var(--surface)] border-2 border-primary-500 shadow-xl opacity-90 flex items-center gap-4">
                                            <div className="text-[var(--text-secondary)]"><GripVertical size={20} /></div>
                                            <div className={`
                                                w-10 h-10 rounded-lg flex items-center justify-center
                                                ${activeId.startsWith('Chapter') ? 'bg-primary-500/20 text-primary-400' : 'bg-secondary-500/20 text-secondary-400'}
                                            `}>
                                                {activeId.startsWith('Chapter') ? <BookOpen size={20} /> : <Brain size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-[var(--text)]">Dragging...</div>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Creation Modals */}
            <Modal
                isOpen={showChapterModal}
                onClose={() => setShowChapterModal(false)}
                title="Create New Chapter"
                size="xl"
            >
                <ChapterForm
                    courseId={courseId}
                    courses={[]} // Not needed as courseId is fixed
                    onClose={() => setShowChapterModal(false)}
                    onSave={handleChapterCreate}
                />
            </Modal>

            <Modal
                isOpen={showQuizModal}
                onClose={() => setShowQuizModal(false)}
                title="Create New Quiz"
                size="lg"
            >
                <QuizForm
                    courseId={courseId}
                    courses={[]} // Not needed as courseId is fixed
                    onClose={() => setShowQuizModal(false)}
                    onSave={handleQuizCreate}
                />
            </Modal>
        </div>
    );
}

function SortableItem({ id, item, index, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center gap-4 group hover:border-primary-500/50 transition-colors"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-[var(--text-secondary)] hover:text-[var(--text)]">
                <GripVertical size={20} />
            </div>

            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface)] text-xs font-bold text-[var(--text-secondary)] border border-[var(--border)]">
                {index + 1}
            </div>

            <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${item.type === 'Chapter' ? 'bg-primary-500/20 text-primary-400' : 'bg-secondary-500/20 text-secondary-400'}
            `}>
                {item.type === 'Chapter' ? <BookOpen size={20} /> : <Brain size={20} />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-[var(--text-secondary)] tracking-wider">{item.type}</span>
                    {!item.isPublished && <Badge variant="warning" size="sm">Draft</Badge>}
                </div>
                <div className="font-semibold text-[var(--text)] truncate">{item.title}</div>
            </div>

            <button
                onClick={onRemove}
                className="p-2 rounded-lg hover:bg-error-500/10 text-[var(--text-secondary)] hover:text-error-500 transition-colors"
            >
                <X size={18} />
            </button>
        </div>
    );
}
