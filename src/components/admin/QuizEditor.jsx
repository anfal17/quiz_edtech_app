import { useState, useEffect, useRef } from 'react';
import {
    Code, Sparkles, Save, Plus, Trash2, GripVertical, CheckCircle
} from 'lucide-react';
import { Button, Card, Badge, toast, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui';
import { quizzesAPI } from '../../services/api';
import { useDebouncedCallback } from 'use-debounce';

export default function QuizEditor({ quizId, courseId, chapterId, onSave, onClose }) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('visual');
    const [jsonInput, setJsonInput] = useState('');
    const [parsedQuiz, setParsedQuiz] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const [visualQuiz, setVisualQuiz] = useState({
        title: '',
        description: '',
        courseId: courseId || '',
        chapterId: chapterId || '',
        questions: [],
        passingScore: 70,
        xpReward: 100,
        isPublished: true,
        timeLimit: 15
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (quizId) {
            fetchQuizData();
            setIsDirty(false);
        }
    }, [quizId]);

    // .... fetchQuizData same as before ....

    const fetchQuizData = async () => {
        setLoading(true);
        try {
            const quizData = await quizzesAPI.getByIdAdmin(quizId);
            // ... (mapping logic) ...
            const mappedQuestions = quizData.questions.map(q => {
                if (q.type === 'mcq') {
                    return {
                        ...q,
                        id: q._id || `q_${Math.random()}`,
                        options: q.options.map((opt, i) => ({ id: ['a', 'b', 'c', 'd'][i], text: opt })),
                        correctAnswer: ['a', 'b', 'c', 'd'][q.correctAnswer]
                    };
                } else {
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
            setJsonInput(JSON.stringify(quizData, null, 2));

        } catch (error) {
            console.error(error);
            toast.error('Failed to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const validateJson = () => {
        // ... same ...
        try {
            const parsed = JSON.parse(jsonInput);
            if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error("Missing questions array");
            setParsedQuiz(parsed);
            toast.success('JSON validated!');
            return true;
        } catch (error) {
            toast.error('Invalid JSON');
            return false;
        }
    };

    // --- AUTO SAVE LOGIC ---
    const debouncedSave = useDebouncedCallback((quizState) => {
        if (!quizId) return; // Should not happen
        handleSavePayload(quizState);
    }, 60000);

    const handleSavePayload = async (quizToSave) => {
        // Transform questions
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
            _id: quizId,
            questions: formattedQuestions,
            courseId: quizToSave.courseId || null,
            chapterId: quizToSave.chapterId || null,
            isPublished: quizToSave.isPublished
        };

        if (onSave) onSave(payload); // Parent handles API trigger in new seamless flow
        setIsDirty(false);
    };

    const updateVisualQuiz = (updates) => {
        setIsDirty(true);
        setVisualQuiz(prev => {
            const newItem = { ...prev, ...updates };
            debouncedSave(newItem);
            return newItem;
        });
    };

    // UI Helpers rewritten to use updateVisualQuiz
    const addQuestion = () => {
        const newQuestions = [
            ...visualQuiz.questions,
            { id: `q_${Date.now()}`, type: 'mcq', question: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }], correctAnswer: 'a', explanation: '' }
        ];
        updateVisualQuiz({ questions: newQuestions });
    };

    const updateQuestion = (index, qUpdates) => {
        const newQuestions = visualQuiz.questions.map((q, i) => i === index ? { ...q, ...qUpdates } : q);
        updateVisualQuiz({ questions: newQuestions });
    };

    const removeQuestion = (index) => {
        const newQuestions = visualQuiz.questions.filter((_, i) => i !== index);
        updateVisualQuiz({ questions: newQuestions });
    };

    const toggleQuestionType = (index) => {
        const current = visualQuiz.questions[index];
        const newType = current.type === 'mcq' ? 'true-false' : 'mcq';
        updateQuestion(index, {
            type: newType,
            correctAnswer: newType === 'mcq' ? 'a' : true,
            options: newType === 'mcq'
                ? [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }]
                : undefined
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--bg)] z-10 py-2 border-b border-[var(--border)]">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {visualQuiz.title || 'Untitled Quiz'}
                        {isDirty ? (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-warning-500/10 text-warning-500 animate-pulse">Saving...</span>
                        ) : (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-success-500/10 text-success-500 flex items-center gap-1">
                                <CheckCircle size={10} /> Saved
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex gap-2">
                    {isDirty && (
                        <Button size="xs" variant="ghost" onClick={() => debouncedSave.flush()} title="Save now">
                            <Save size={14} />
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList>
                    <TabsTrigger value="visual"><Sparkles size={14} className="mr-2" /> Visual</TabsTrigger>
                    <TabsTrigger value="json"><Code size={14} className="mr-2" /> JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-6">
                    {/* Settings */}
                    <Card>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={visualQuiz.title}
                                onChange={(e) => updateVisualQuiz({ title: e.target.value })}
                                className="w-full px-4 py-2 text-lg font-bold rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500"
                                placeholder="Quiz Title"
                            />
                            <textarea
                                value={visualQuiz.description}
                                onChange={(e) => updateVisualQuiz({ description: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary-500 resize-none"
                                placeholder="Description (optional)"
                                rows={2}
                            />
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)]">Time Limit (min)</label>
                                    <input type="number" value={visualQuiz.timeLimit} onChange={e => updateVisualQuiz({ timeLimit: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)]">Pass Score (%)</label>
                                    <input type="number" value={visualQuiz.passingScore} onChange={e => updateVisualQuiz({ passingScore: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)]">XP Reward</label>
                                    <input type="number" value={visualQuiz.xpReward} onChange={e => updateVisualQuiz({ xpReward: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Questions */}
                    <div className="space-y-4">
                        {visualQuiz.questions.map((q, index) => (
                            <Card key={q.id || index} padding="sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <Badge variant="primary">Q{index + 1}</Badge>
                                    <button onClick={() => toggleQuestionType(index)} className="text-xs text-primary-400 hover:underline uppercase font-bold">
                                        {q.type === 'mcq' ? 'Multiple Choice' : 'True/False'}
                                    </button>
                                    <button onClick={() => removeQuestion(index)} className="ml-auto text-error-400 p-1 hover:bg-error-500/10 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={q.question}
                                        onChange={(e) => updateQuestion(index, { question: e.target.value })}
                                        placeholder="Question text"
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]"
                                    />

                                    {q.type === 'mcq' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options.map((opt, optIndex) => (
                                                <div key={opt.id} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={q.correctAnswer === opt.id}
                                                        onChange={() => updateQuestion(index, { correctAnswer: opt.id })}
                                                        className="w-4 h-4 accent-success-500 shrink-0"
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
                                                        className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'true-false' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateQuestion(index, { correctAnswer: true })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${q.correctAnswer === true ? 'bg-success-500 text-white' : 'bg-[var(--surface-hover)]'}`}>True</button>
                                            <button onClick={() => updateQuestion(index, { correctAnswer: false })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${q.correctAnswer === false ? 'bg-error-500 text-white' : 'bg-[var(--surface-hover)]'}`}>False</button>
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        value={q.explanation}
                                        onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
                                        placeholder="Explanation (shown after answer)"
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-sm"
                                    />
                                </div>
                            </Card>
                        ))}
                        <Button onClick={addQuestion} leftIcon={<Plus size={16} />} fullWidth variant="outline" className="border-dashed">Add Question</Button>
                    </div>
                </TabsContent>

                <TabsContent value="json" className="flex-1 flex flex-col mt-4">
                    <div className="bg-primary-500/10 p-4 rounded-xl mb-4 text-sm text-primary-400">
                        <strong>💡 Tip:</strong> Paste a JSON array of questions here. The format should be:
                        <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                            {`[
  {
    "type": "mcq",
    "question": "What is 2+2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": 1, // Index of correct option (0-3) OR string matching option text
    "explanation": "Math."
  }
]`}
                        </pre>
                    </div>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste JSON here..."
                        className="flex-1 p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 mb-4"
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            onClick={() => {
                                try {
                                    const parsed = JSON.parse(jsonInput);
                                    let newQuestions = [];

                                    // Handle single object or array
                                    const items = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);

                                    newQuestions = items.map((q, idx) => {
                                        // Normalize options
                                        let options = [];
                                        if (q.options) {
                                            options = q.options.map((opt, i) => ({
                                                id: ['a', 'b', 'c', 'd'][i] || `opt${i}`,
                                                text: typeof opt === 'string' ? opt : (opt.text || '')
                                            }));
                                        } else {
                                            // Default options if missing
                                            options = Array(4).fill(null).map((_, i) => ({ id: ['a', 'b', 'c', 'd'][i], text: '' }));
                                        }

                                        // Normalize Type
                                        const type = q.type === 'true-false' ? 'true-false' : 'mcq';

                                        // Normalize Answer
                                        let correctAnswer = null;
                                        if (type === 'mcq') {
                                            // Support index (0-3) or string match
                                            if (typeof q.correctAnswer === 'number' && options[q.correctAnswer]) {
                                                correctAnswer = options[q.correctAnswer].id;
                                            } else if (typeof q.correctAnswer === 'string') {
                                                // Try to find matching option text or ID
                                                const match = options.find(o => o.text === q.correctAnswer || o.id === q.correctAnswer);
                                                correctAnswer = match ? match.id : 'a';
                                            } else {
                                                correctAnswer = 'a';
                                            }
                                        } else {
                                            correctAnswer = q.correctAnswer === true || String(q.correctAnswer).toLowerCase() === 'true';
                                        }

                                        return {
                                            id: `q_${Date.now()}_${idx}`,
                                            type,
                                            question: q.question || '',
                                            options,
                                            correctAnswer,
                                            explanation: q.explanation || ''
                                        };
                                    });

                                    updateVisualQuiz({ questions: newQuestions });
                                    toast.success(`Imported ${newQuestions.length} questions!`);
                                    setActiveTab('visual');
                                } catch (e) {
                                    toast.error('Invalid JSON format');
                                    console.error(e);
                                }
                            }}
                            variant="primary"
                            disabled={!jsonInput.trim()}
                        >
                            Import & Replace Questions
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
