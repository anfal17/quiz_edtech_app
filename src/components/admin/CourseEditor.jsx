import { useState, useEffect } from 'react';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    BookOpen, Brain, GripVertical, Plus, Save, Settings, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button, Card, Badge, toast, Modal } from '../ui';
import { coursesAPI, chaptersAPI, quizzesAPI } from '../../services/api';
import ChapterForm from './ChapterForm';
import QuizEditor from './QuizEditor';
import CourseSettings from './CourseSettings';
import { useNavigate, useParams } from 'react-router-dom';

export default function CourseEditor() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Core Data
    const [course, setCourse] = useState(null);
    const [items, setItems] = useState([]); // Ordered items: { id, type, title, ... }
    const [availableChapters, setAvailableChapters] = useState([]);
    const [availableQuizzes, setAvailableQuizzes] = useState([]);

    // Logic State
    const [selectedItem, setSelectedItem] = useState(null); // { type: 'course' | 'Chapter' | 'Quiz', id: string | null }
    const [activeId, setActiveId] = useState(null); // Dragging ID
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [itemToDelete, setItemToDelete] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [courseData, chaptersData, quizzesData] = await Promise.all([
                coursesAPI.getById(courseId),
                chaptersAPI.getAllAdmin(courseId),
                quizzesAPI.getAllAdmin()
            ]);

            setCourse(courseData);
            setSelectedItem({ type: 'course', id: null }); // Default to course settings

            // Filter quizzes for this course
            const courseQuizzes = quizzesData.filter(q =>
                (typeof q.courseId === 'object' ? q.courseId?._id : q.courseId) === courseId
            );

            // Construct Path
            let currentPath = [];
            if (courseData.learningPath?.length > 0) {
                currentPath = courseData.learningPath.map(item => {
                    // Logic: item.itemId is likely populated (Object) or just ID (String)
                    const rawId = item.itemId;
                    const isPopulated = rawId && typeof rawId === 'object' && rawId._id;

                    const idString = isPopulated ? rawId._id : rawId;

                    // If we have the object from populate, use it. Otherwise look it up.
                    // Note: 'chaptersData' might be more up-to-date than populate? 
                    // But assume populate is good for basic info.
                    // Actually, let's prefer looking up in the full lists `chaptersData`/`quizzesData` 
                    // to ensure we have consistent objects (and if populate failed we fallback).

                    const listToSearch = item.itemType === 'Chapter' ? chaptersData : courseQuizzes;
                    const detailedItem = listToSearch.find(x => x._id === idString);

                    // If not found in list but was populated, use populated data as fallback?
                    // Usually better to rely on found item.
                    const finalItem = detailedItem || (isPopulated ? rawId : null);

                    if (!finalItem) return null;

                    return {
                        id: `${item.itemType}-${finalItem._id}`,
                        realId: finalItem._id,
                        type: item.itemType,
                        title: finalItem.title,
                        isPublished: finalItem.isPublished,
                        data: finalItem
                    };
                }).filter(Boolean);
            } else {
                // Legacy fallback
                currentPath = chaptersData.map(c => ({
                    id: `Chapter-${c._id}`,
                    realId: c._id,
                    type: 'Chapter',
                    title: c.title,
                    isPublished: c.isPublished
                }));
            }

            setItems(currentPath);
            setAvailableChapters(chaptersData);
            setAvailableQuizzes(courseQuizzes);

        } catch (error) {
            console.error(error);
            toast.error('Failed to load course data');
        } finally {
            setLoading(false);
        }
    };

    // --- Drag & Drop Handlers ---
    const handleDragStart = (event) => setActiveId(event.active.id);
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Auto-save structure
                saveStructure(newItems);
                return newItems;
            });
        }
        setActiveId(null);
    };

    const saveStructure = async (currentItems) => {
        // Debounce managed by caller or backend? Ideally debounce here.
        // For structure, immediate save is usually fine unless rapid dragging.
        // Let's set a small 'saving' indicator without blocking.
        setSaving(true);
        try {
            const learningPath = currentItems.map(item => ({
                itemType: item.type,
                itemId: item.realId
            }));

            // Fire and forget (optimistic) or await? Await to show error if fails.
            await coursesAPI.updateLearningPath(courseId, learningPath);
        } catch (error) {
            console.error('Failed to save structure:', error);
            toast.error('Failed to save order');
        } finally {
            setSaving(false);
        }
    };

    // --- Creation Handlers ---
    const handleAddChapter = async () => {
        setLoading(true); // Small loading state
        try {
            const newChapter = await chaptersAPI.create({
                title: 'Untitled Chapter',
                courseId,
                isPublished: false,
                content: ''
            });

            const newItem = {
                id: `Chapter-${newChapter._id}`,
                realId: newChapter._id,
                type: 'Chapter',
                title: newChapter.title,
                isPublished: newChapter.isPublished
            };

            setItems(prev => [...prev, newItem]);
            setAvailableChapters(prev => [...prev, newChapter]);
            setSelectedItem({ type: 'Chapter', id: newChapter._id });

            // Save structure to include new item
            saveStructure([...items, newItem]);

        } catch (error) {
            toast.error('Failed to create chapter');
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuiz = async () => {
        setLoading(true);
        try {
            const newQuiz = await quizzesAPI.create({
                title: 'Untitled Quiz',
                courseId,
                isPublished: false,
                questions: []
            });

            const newItem = {
                id: `Quiz-${newQuiz._id}`,
                realId: newQuiz._id,
                type: 'Quiz',
                title: newQuiz.title,
                isPublished: newQuiz.isPublished
            };

            setItems(prev => [...prev, newItem]);
            setAvailableQuizzes(prev => [...prev, newQuiz]);
            setSelectedItem({ type: 'Quiz', id: newQuiz._id });

            // Save structure
            saveStructure([...items, newItem]);

        } catch (error) {
            toast.error('Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    // --- Save Handlers for Content (Auto-save) ---
    const onChapterUpdate = async (data) => {
        // data contains updated fields
        // We assume ChapterForm calls this debounced
        try {
            setSaving(true);
            await chaptersAPI.update(data._id, data);

            // Update local item title if changed
            if (data.title) {
                setItems(prev => prev.map(item =>
                    (item.realId === data._id && item.type === 'Chapter')
                        ? { ...item, title: data.title, isPublished: data.isPublished }
                        : item
                ));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to save chapter', { id: 'autosave-error' }); // Avoid spamming
        } finally {
            setSaving(false);
        }
    };

    const onQuizUpdate = async (data) => {
        try {
            setSaving(true);
            await quizzesAPI.update(data._id, data);
            if (data.title) {
                setItems(prev => prev.map(item =>
                    (item.realId === data._id && item.type === 'Quiz')
                        ? { ...item, title: data.title, isPublished: data.isPublished }
                        : item
                ));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to save quiz', { id: 'autosave-error' });
        } finally {
            setSaving(false);
        }
    };

    const onCourseSave = async (data) => {
        try {
            await coursesAPI.update(courseId, data);
            toast.success('Course settings saved');
            fetchData();
        } catch (error) {
            toast.error('Failed to save course');
        }
    };

    // --- Selection Logic ---
    const selectItem = (type, id) => {
        setSelectedItem({ type, id });
        // Maybe scroll to top of right panel?
    };

    if (loading) return <div className="p-12 text-center">Loading Editor...</div>;

    // Filter available items not in path (for drag from sidebar if we wanted that, but here we just show structure)
    // Actually, users might want to add existing items that were removed?
    // Let's rely on "Add Chapter" / "Add Quiz" creating NEW ones for now. 
    // Re-adding deleted ones is a "Library" feature we can skip for "Seamless" MVP.

    const handleDeleteClick = (e, item) => {
        e.stopPropagation(); // Prevent selection
        setItemToDelete(item);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setSaving(true);
        try {
            // 1. Remove from DB
            if (itemToDelete.type === 'Chapter') {
                await chaptersAPI.delete(itemToDelete.realId);
            } else {
                await quizzesAPI.delete(itemToDelete.realId);
            }

            // 2. Remove from local state and update structure
            const newItems = items.filter(i => i.id !== itemToDelete.id);
            setItems(newItems);

            // 3. Update Available Lists
            if (itemToDelete.type === 'Chapter') {
                setAvailableChapters(prev => prev.filter(c => c._id !== itemToDelete.realId));
            } else {
                setAvailableQuizzes(prev => prev.filter(q => q._id !== itemToDelete.realId));
            }

            // 4. Save Structure (DB update)
            await saveStructure(newItems);

            // 5. Deselect if needed
            if (selectedItem?.id === itemToDelete.realId) {
                setSelectedItem(null);
            }

            toast.success(`${itemToDelete.type} deleted`);

        } catch (error) {
            console.error('Failed to delete item:', error);
            toast.error('Failed to delete item');
        } finally {
            setSaving(false);
            setItemToDelete(null);
        }
    };


    return (
        <div className={`flex h-[calc(100vh-6rem)] border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg)] relative`}>
            {/* LEFT SIDEBAR: Structure */}
            <div
                className={`
                    flex-shrink-0 flex flex-col bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-300
                    ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden
                `}
            >
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)] min-w-[20rem]">
                    <h2 className="font-bold text-[var(--text)] truncate">{course?.title}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedItem({ type: 'course', id: null })}>
                        <Settings size={18} />
                    </Button>
                </div>

                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)] min-w-[20rem]">
                    <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                        <GripVertical size={20} className="text-[var(--text-secondary)]" />
                        Structure
                    </div>
                </div>

                <div className="p-2 grid grid-cols-2 gap-2 border-b border-[var(--border)] min-w-[20rem]">
                    <Button size="sm" leftIcon={<Plus size={14} />} variant="secondary" onClick={handleAddChapter}>Chapter</Button>
                    <Button size="sm" leftIcon={<Plus size={14} />} variant="secondary" onClick={handleAddQuiz}>Quiz</Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 min-w-[20rem]">
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
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        onClick={() => selectItem(item.type, item.realId)}
                                        className={`
                                            group relative p-2 rounded-xl border transition-all cursor-pointer mb-2 pr-8
                                            ${selectedItem?.id === item.realId && selectedItem?.type === item.type
                                                ? 'bg-[var(--surface)] border-primary-500 shadow-sm ring-1 ring-500/10'
                                                : 'bg-[var(--surface)] border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-hover)]'}
                                        `}
                                    >
                                        <SortableItemContent id={item.id} item={item} index={index} onDelete={(e) => handleDeleteClick(e, item)} />
                                    </div>
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeId ? (
                                <div className="p-3 rounded-lg bg-[var(--surface)] border-2 border-primary-500 shadow-xl opacity-90 w-80">
                                    Drag
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div className="p-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-secondary)] min-w-[20rem]">
                    {saving ? (
                        <span className="flex items-center justify-center gap-2 text-primary-500 animate-pulse">
                            <Save size={14} /> Saving changes...
                        </span>
                    ) : (
                        <span className="opacity-50">All changes saved</span>
                    )}
                </div>
            </div>

            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-r shadow-md text-[var(--text-secondary)]"
            >
                {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>


            {/* RIGHT PANEL: Editor */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg)] relative">
                {/* Header for Editor Pane */}
                <div className="h-14 border-b border-[var(--border)] flex items-center px-6 bg-[var(--surface)] justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                            {selectedItem?.type === 'course' ? 'Course Settings' : `Editing ${selectedItem?.type}`}
                        </span>
                        {saving && <span className="text-xs text-primary-500 animate-pulse ml-2">Saving...</span>}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {selectedItem?.type === 'course' && (
                        <div className="p-8 h-full overflow-y-auto">
                            <CourseSettings
                                course={course}
                                onSave={onCourseSave}
                            />
                        </div>
                    )}

                    {(selectedItem?.type === 'Chapter' || selectedItem?.type === 'Quiz') && (
                        <div className="h-full bg-[var(--bg)] p-6">
                            {selectedItem?.type === 'Chapter' && (
                                <ChapterForm
                                    key={selectedItem.id}
                                    courseId={courseId}
                                    chapter={availableChapters.find(c => c._id === selectedItem.id)}
                                    courses={[]}
                                    onClose={() => { }}
                                    onSave={onChapterUpdate}
                                />
                            )}

                            {selectedItem?.type === 'Quiz' && (
                                <QuizEditor
                                    key={selectedItem.id}
                                    courseId={courseId}
                                    quizId={selectedItem.id}
                                    onSave={onQuizUpdate}
                                    onClose={() => { }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                title={`Delete ${itemToDelete?.type}`}
                size="sm"
            >
                <div className="text-center">
                    <p className="text-[var(--text-secondary)] mb-6">
                        Are you sure you want to delete <strong className="text-[var(--text)]">{itemToDelete?.title}</strong>?
                        <br />This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => setItemToDelete(null)}>Cancel</Button>
                        <Button variant="primary" fullWidth className="bg-error-500 hover:bg-error-600" onClick={confirmDelete}>Delete</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Enhanced Item Component with better visuals
function SortableItemContent({ id, item, index, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className={`
            flex items-center gap-3 p-1 rounded-lg transition-colors
            ${isDragging ? 'bg-primary-500/10' : ''}
        `}>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-[var(--text-secondary)] hover:text-[var(--text)] p-2 rounded hover:bg-[var(--surface-hover)] transition-colors">
                <GripVertical size={18} />
            </div>
            <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${item.type === 'Chapter' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}
            `}>
                {item.type === 'Chapter' ? <BookOpen size={16} /> : <Brain size={16} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-[var(--text)]">{item.title}</p>
                <p className="text-xs text-[var(--text-secondary)] capitalize">{item.type} • {index + 1}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--surface)] shadow-sm rounded-lg border border-[var(--border)]">
                <button
                    onClick={onDelete}
                    className="p-1.5 text-error-400 hover:bg-error-500/10 hover:text-error-500 rounded-md transition-colors"
                    title="Delete"
                >
                    <X size={14} />
                </button>
            </div>

            {!item.isPublished && (
                <div className="w-2 h-2 rounded-full bg-warning-500 flex-shrink-0 absolute right-2 top-2" title="Draft" />
            )}
        </div>
    );
}
