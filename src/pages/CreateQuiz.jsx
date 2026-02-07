import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Code, Sparkles, Eye, Save, AlertCircle,
    CheckCircle, Copy, Plus, Trash2, GripVertical
} from 'lucide-react';
import { Button, Card, Badge, toast, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { quizzesAPI, coursesAPI, chaptersAPI } from '../services/api';

// LLM Prompt Template
const LLM_PROMPT_TEMPLATE = `# Quiz Generation Prompt

Create a quiz in JSON format about [TOPIC] with the following specifications:

**Requirements:**
- Number of questions: [X]
- Difficulty: [beginner/intermediate/advanced]
- Question types: MCQ (4 options) and True/False
- Include detailed explanations for each answer

**Output Format:**
\`\`\`json
{
  "title": "Quiz title",
  "description": "Brief quiz description",
  "questions": [
    {
      "type": "mcq",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0, // Index 0-3
      "explanation": "Why this answer is correct"
    },
    {
      "type": "true-false",
      "question": "Statement?",
      "correctAnswer": 0, // 0 for True, 1 for False
      "explanation": "Explanation"
    }
  ]
}
\`\`\`
`;

export default function CreateQuiz() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const quizId = searchParams.get('id');
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('visual'); // Default to visual
    const [jsonInput, setJsonInput] = useState('');
    const [parsedQuiz, setParsedQuiz] = useState(null);
    const [validationError, setValidationError] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Data for dropdowns
    const [courses, setCourses] = useState([]);
    const [chapters, setChapters] = useState([]);

    // Visual builder state
    const [visualQuiz, setVisualQuiz] = useState({
        title: '',
        description: '',
        courseId: '',
        chapterId: '',
        questions: [],
        passingScore: 70,
        xpReward: 100,
        isPublished: false
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch courses for dropdown
                const coursesData = await coursesAPI.getAllAdmin(); // or getAll if user?
                setCourses(coursesData);

                // If editing, fetch quiz data
                if (quizId) {
                    const quizData = await quizzesAPI.getByIdAdmin(quizId); // Assuming getByIdAdmin returns full data with answers
                    // Transform backend data to frontend state if needed
                    // Backend questions: options is string[], correctAnswer is number
                    // Frontend 'visualQuiz' logic below uses mapped options objects for UI inputs
                    // We need to map back.

                    const mappedQuestions = quizData.questions.map(q => {
                        if (q.type === 'mcq') {
                            return {
                                ...q,
                                id: q._id || `q_${Math.random()}`,
                                options: q.options.map((opt, i) => ({ id: ['a', 'b', 'c', 'd'][i], text: opt })),
                                correctAnswer: ['a', 'b', 'c', 'd'][q.correctAnswer]
                            };
                        } else {
                            // true-false
                            return {
                                ...q,
                                id: q._id || `q_${Math.random()}`,
                                correctAnswer: q.correctAnswer === 0 // 0 is True
                            };
                        }
                    });

                    setVisualQuiz({
                        ...quizData,
                        courseId: typeof quizData.courseId === 'object' ? quizData.courseId?._id : quizData.courseId,
                        chapterId: typeof quizData.chapterId === 'object' ? quizData.chapterId?._id : quizData.chapterId,
                        questions: mappedQuestions
                    });

                    if (quizData.courseId) {
                        // Fetch chapters for the selected course
                        const cid = typeof quizData.courseId === 'object' ? quizData.courseId._id : quizData.courseId;
                        const chaptersData = await chaptersAPI.getAllAdmin(cid);
                        setChapters(chaptersData);
                    }
                }
            } catch (error) {
                console.error('Failed to load data:', error);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [quizId]);

    // Fetch chapters when course changes
    useEffect(() => {
        const fetchChapters = async () => {
            if (visualQuiz.courseId) {
                try {
                    const chaptersData = await chaptersAPI.getAllAdmin(visualQuiz.courseId);
                    setChapters(chaptersData);
                } catch (error) {
                    console.error("Failed to fetch chapters", error);
                }
            } else {
                setChapters([]);
            }
        };
        fetchChapters();
    }, [visualQuiz.courseId]);

    const validateJson = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            // Basic validation...
            if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error("Missing questions array");

            setParsedQuiz(parsed);
            setValidationError(null);
            toast.success('JSON validated!');
            return true;
        } catch (error) {
            setValidationError(error.message);
            toast.error('Invalid JSON');
            return false;
        }
    };

    const handleSave = async () => {
        const quizToSave = activeTab === 'json' ? parsedQuiz : visualQuiz;
        if (!quizToSave || !quizToSave.title) {
            toast.error('Please enter a title');
            return;
        }

        setLoading(true);
        try {
            // Transform questions to backend format
            const formattedQuestions = quizToSave.questions.map(q => {
                const isMcq = q.type === 'mcq';
                let options = [];
                let correctAnswer = 0;

                if (isMcq) {
                    options = q.options.map(o => o.text);
                    correctAnswer = ['a', 'b', 'c', 'd'].indexOf(q.correctAnswer);
                } else {
                    options = ['True', 'False'];
                    correctAnswer = q.correctAnswer === true ? 0 : 1;
                }

                return {
                    type: q.type,
                    question: q.question,
                    options,
                    correctAnswer,
                    explanation: q.explanation
                };
            });

            const payload = {
                ...quizToSave,
                questions: formattedQuestions,
                // courseId, chapterId are already in visualQuiz (if using visual tab). 
                // If using JSON, we might need to merge them from UI selection?
                // For now assuming JSON tab users include ids or don't care about linking.
                // But better to allow linking in JSON mode too?
                // Let's assume Visual Builder is the primary way for Admin to link.
                courseId: visualQuiz.courseId || undefined,
                chapterId: visualQuiz.chapterId || undefined,
                isPublished: activeTab === 'visual' ? visualQuiz.isPublished : (parsedQuiz?.isPublished || false)
            };

            if (quizId) {
                await quizzesAPI.update(quizId, payload);
                toast.success('Quiz updated successfully');
            } else {
                await quizzesAPI.create(payload);
                toast.success('Quiz created successfully');
            }
            navigate('/admin/quizzes'); // Go back to admin list
        } catch (error) {
            console.error('Failed to save quiz:', error);
            toast.error(error.message || 'Failed to save quiz');
        } finally {
            setLoading(false);
        }
    };

    // Visual Builder Helpers
    const addQuestion = () => {
        setVisualQuiz(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    id: `q_${Date.now()}`,
                    type: 'mcq',
                    question: '',
                    options: [
                        { id: 'a', text: '' },
                        { id: 'b', text: '' },
                        { id: 'c', text: '' },
                        { id: 'd', text: '' },
                    ],
                    correctAnswer: 'a',
                    explanation: '',
                },
            ],
        }));
    };

    const updateQuestion = (index, updates) => {
        setVisualQuiz(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === index ? { ...q, ...updates } : q),
        }));
    };

    const removeQuestion = (index) => {
        setVisualQuiz(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
    };

    const toggleQuestionType = (index) => {
        const current = visualQuiz.questions[index];
        const newType = current.type === 'mcq' ? 'true-false' : 'mcq';
        updateQuestion(index, {
            type: newType,
            correctAnswer: newType === 'mcq' ? 'a' : true,
            options: newType === 'mcq'
                ? [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }]
                : undefined,
        });
    };

    // UI Render
    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text)]">{quizId ? 'Edit Quiz' : 'Create Quiz'}</h1>
                        <p className="text-[var(--text-secondary)] mt-1">
                            Use the visual builder or import JSON
                        </p>
                    </div>
                </div>

                <Tabs value={activeTab} onChange={setActiveTab} className="mb-6">
                    <TabsList>
                        <TabsTrigger value="visual">
                            <Sparkles size={16} className="mr-2" />
                            Visual Builder
                        </TabsTrigger>
                        <TabsTrigger value="json">
                            <Code size={16} className="mr-2" />
                            JSON Import
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="visual" className="mt-6">
                        <div className="space-y-6">
                            {/* Quiz Metadata */}
                            <Card>
                                <h3 className="font-bold text-[var(--text)] mb-4">Quiz Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Title</label>
                                        <input
                                            type="text"
                                            value={visualQuiz.title}
                                            onChange={(e) => setVisualQuiz(p => ({ ...p, title: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Quiz Title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description</label>
                                        <textarea
                                            value={visualQuiz.description}
                                            onChange={(e) => setVisualQuiz(p => ({ ...p, description: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Quiz Description"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Course (Optional)</label>
                                            <select
                                                value={visualQuiz.courseId}
                                                onChange={(e) => setVisualQuiz(p => ({ ...p, courseId: e.target.value, chapterId: '' }))}
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">Select Course</option>
                                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Chapter (Optional)</label>
                                            <select
                                                value={visualQuiz.chapterId}
                                                onChange={(e) => setVisualQuiz(p => ({ ...p, chapterId: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                disabled={!visualQuiz.courseId}
                                            >
                                                <option value="">Select Chapter</option>
                                                {chapters.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Passing Score (%)</label>
                                            <input type="number" value={visualQuiz.passingScore} onChange={e => setVisualQuiz(p => ({ ...p, passingScore: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">XP Reward</label>
                                            <input type="number" value={visualQuiz.xpReward} onChange={e => setVisualQuiz(p => ({ ...p, xpReward: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={visualQuiz.isPublished}
                                                onChange={(e) => setVisualQuiz(p => ({ ...p, isPublished: e.target.checked }))}
                                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-[var(--text)]">Publish Quiz</span>
                                                <span className="block text-xs text-[var(--text-secondary)]">Visible to students when enabled</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </Card>

                            {/* Questions */}
                            <div className="space-y-4">
                                {visualQuiz.questions.map((q, index) => (
                                    <Card key={q.id || index} className="relative">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Badge variant="primary">Q{index + 1}</Badge>
                                            <button onClick={() => toggleQuestionType(index)} className="text-sm text-primary-400 hover:underline">
                                                {q.type === 'mcq' ? 'MCQ' : 'True/False'}
                                            </button>
                                            <button onClick={() => removeQuestion(index)} className="ml-auto text-error-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={q.question}
                                                onChange={(e) => updateQuestion(index, { question: e.target.value })}
                                                placeholder="Enter question"
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]"
                                            />

                                            {q.type === 'mcq' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {q.options.map((opt, optIndex) => (
                                                        <div key={opt.id} className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                checked={q.correctAnswer === opt.id}
                                                                onChange={() => updateQuestion(index, { correctAnswer: opt.id })}
                                                                className="w-4 h-4 accent-success-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={opt.text}
                                                                onChange={(e) => {
                                                                    const newOpts = [...q.options];
                                                                    newOpts[optIndex] = { ...opt, text: e.target.value };
                                                                    updateQuestion(index, { options: newOpts });
                                                                }}
                                                                placeholder={`Option ${opt.id.toUpperCase()}`}
                                                                className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {q.type === 'true-false' && (
                                                <div className="flex gap-4">
                                                    <button type="button" onClick={() => updateQuestion(index, { correctAnswer: true })} className={`flex-1 py-3 rounded-xl ${q.correctAnswer === true ? 'bg-success-500 text-white' : 'bg-[var(--surface-hover)]'}`}>True</button>
                                                    <button type="button" onClick={() => updateQuestion(index, { correctAnswer: false })} className={`flex-1 py-3 rounded-xl ${q.correctAnswer === false ? 'bg-success-500 text-white' : 'bg-[var(--surface-hover)]'}`}>False</button>
                                                </div>
                                            )}

                                            <input
                                                type="text"
                                                value={q.explanation}
                                                onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
                                                placeholder="Explanation"
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]"
                                            />
                                        </div>
                                    </Card>
                                ))}
                                <Button onClick={addQuestion} leftIcon={<Plus size={16} />} fullWidth variant="outline">Add Question</Button>
                            </div>

                            <Button onClick={handleSave} fullWidth size="lg" disabled={loading} leftIcon={<Save size={18} />}>
                                {loading ? 'Saving...' : 'Save Quiz'}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="json">
                        <Card>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder="Paste JSON here..."
                                className="w-full h-80 p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-mono text-sm"
                            />
                            <div className="flex gap-3 mt-4">
                                <Button onClick={validateJson} variant="outline">Validate</Button>
                                <Button onClick={handleSave} disabled={!parsedQuiz || loading}>Save JSON Quiz</Button>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
