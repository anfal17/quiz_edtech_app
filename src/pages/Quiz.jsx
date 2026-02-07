import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle, XCircle,
    RotateCcw, Trophy, Zap, Target, Clock,
    ChevronRight, BookOpen, AlertCircle
} from 'lucide-react';
import { Button, Card, ProgressBar, toast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { quizzesAPI, coursesAPI, chaptersAPI } from '../services/api';

// Quiz States
const QUIZ_STATE = {
    START: 'start',
    QUESTION: 'question',
    RESULTS: 'results',
    REVIEW: 'review',
};

export default function Quiz() {
    const { domainId, chapterId, quizId: standaloneQuizId } = useParams();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    const [quizState, setQuizState] = useState(QUIZ_STATE.START);
    const [quiz, setQuiz] = useState(null);
    const [domain, setDomain] = useState(null);
    const [nextItem, setNextItem] = useState(null);
    const [prevItem, setPrevItem] = useState(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: answer }
    const [startTime, setStartTime] = useState(null);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Quiz
                let quizData;
                if (standaloneQuizId) {
                    quizData = await quizzesAPI.getById(standaloneQuizId);
                } else if (chapterId) {
                    const quizzes = await quizzesAPI.getAll({ chapterId });
                    quizData = quizzes[0];
                    if (quizData) {
                        // Fetch full details (questions)
                        quizData = await quizzesAPI.getById(quizData._id);
                    }
                }

                if (!quizData) {
                    toast.error('Quiz not found');
                    // navigate(-1); // Don't navigate immediately to avoid flash
                    setLoading(false);
                    return;
                }



                // Fetch Context (Domain & Next/Prev Chapter)
                if (domainId) {
                    const [courseRes, chaptersRes] = await Promise.all([
                        coursesAPI.getById(domainId),
                        chaptersAPI.getByCourse(domainId)
                    ]);
                    setDomain(courseRes);

                    // Find next/prev item in Learning Path
                    if (courseRes.learningPath && courseRes.learningPath.length > 0) {
                        const currentId = standaloneQuizId || chapterId;
                        const currentIndex = courseRes.learningPath.findIndex(item =>
                            (item.itemId?._id || item.itemId) === currentId
                        );

                        if (currentIndex !== -1) {
                            if (currentIndex > 0) {
                                setPrevItem(courseRes.learningPath[currentIndex - 1]);
                            }
                            if (currentIndex < courseRes.learningPath.length - 1) {
                                setNextItem(courseRes.learningPath[currentIndex + 1]);
                            }
                        }
                    } else if (chapterId && chaptersRes) {
                        // Fallback logic
                        const sortedChapters = chaptersRes.sort((a, b) => a.order - b.order);
                        const currentIndex = sortedChapters.findIndex(c => c._id === chapterId);

                        // This logic is slightly flawed for Quizzes as they aren't in sortedChapters usually?
                        // But if we are in legacy mode... strict quiz flow might be tricky without learningPath.
                        // Let's stick to learningPath priority.
                    }
                }

                // Transform Request Data to match Frontend expected structure
                // Backend: options is [string], Frontend expects [{id: 'a', text: string}]
                const formattedQuestions = quizData.questions.map(q => {
                    if (q.type === 'mcq') {
                        return {
                            ...q,
                            options: q.options.map((optText, idx) => ({
                                id: ['a', 'b', 'c', 'd'][idx] || String.fromCharCode(97 + idx),
                                text: optText
                            }))
                        };
                    }
                    return q;
                });

                setQuiz({ ...quizData, questions: formattedQuestions });

            } catch (error) {
                console.error('Failed to fetch quiz data:', error);
                toast.error('Failed to load quiz');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [domainId, chapterId, standaloneQuizId]);

    const startQuiz = () => {
        setQuizState(QUIZ_STATE.QUESTION);
        setStartTime(Date.now());
        setCurrentQuestionIndex(0);
        setAnswers({});
        setSelectedAnswer(null);
    };

    const handleAnswerSelect = (answer) => {
        setSelectedAnswer(answer);
        // Auto-save answer to state
        const questionId = quiz.questions[currentQuestionIndex]._id;
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            // Restore selection if already answered (e.g. going back/forth)
            const nextQId = quiz.questions[currentQuestionIndex + 1]._id;
            setSelectedAnswer(answers[nextQId] ?? null);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            const prevQId = quiz.questions[currentQuestionIndex - 1]._id;
            setSelectedAnswer(answers[prevQId] ?? null);
        }
    };

    const submitQuiz = async () => {
        // Allow Guest or User
        if (!user) {
            toast.error("You must be logged in to submit.");
            return;
        }

        setSubmitting(true);
        try {
            // Format answers for API (Convert UI values to Backend indices)
            const formattedAnswers = Object.entries(answers).map(([qId, ans]) => {
                const question = quiz.questions.find(q => q._id === qId);
                let backendAnswer = ans;

                if (question.type === 'mcq') {
                    // Convert 'a' -> 0, 'b' -> 1
                    backendAnswer = ['a', 'b', 'c', 'd'].indexOf(ans);
                } else {
                    // True/False: True -> 0, False -> 1
                    backendAnswer = ans === true ? 0 : 1;
                }

                return {
                    questionId: qId,
                    answer: backendAnswer
                };
            });

            let result;
            if (user.role === 'guest') {
                result = await quizzesAPI.submitGuest(quiz._id, formattedAnswers);
            } else {
                result = await quizzesAPI.submit(quiz._id, formattedAnswers);
            }

            setSubmissionResult(result);
            setQuizState(QUIZ_STATE.RESULTS);

            if (result.passed) {
                if (user.role === 'guest') {
                    toast.success(`Quiz passed! (Sign up to save XP)`);
                } else {
                    toast.success(`Quiz passed! +${result.xpEarned} XP`);
                    refreshUser(); // Sync XP immediately
                }
            } else {
                toast.info(`Quiz finished. Score: ${result.score}%`);
            }

        } catch (error) {
            console.error('Failed to submit quiz:', error);
            toast.error('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const retakeQuiz = () => {
        setSubmissionResult(null);
        startQuiz();
    };

    const viewReview = () => {
        setCurrentQuestionIndex(0);
        setQuizState(QUIZ_STATE.REVIEW);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-bold">Quiz not found</h2>
                <Link to={domainId ? `/domain/${domainId}` : '/explore'}>
                    <Button variant="primary">Back to Course</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header removed - handled by CoursePlayerLayout */}

                {/* Quiz Start Screen */}
                {quizState === QUIZ_STATE.START && (
                    <QuizStartScreen
                        quiz={quiz}
                        onStart={startQuiz}
                        user={user}
                        prevItem={prevItem}
                        nextItem={nextItem}
                        domainId={domainId}
                    />
                )}

                {/* Question Screen */}
                {quizState === QUIZ_STATE.QUESTION && (
                    <QuestionScreen
                        quiz={quiz}
                        questionIndex={currentQuestionIndex}
                        selectedAnswer={selectedAnswer}
                        onSelectAnswer={handleAnswerSelect}
                        onNext={nextQuestion}
                        onPrev={prevQuestion}
                        onSubmit={submitQuiz}
                        answers={answers}
                        submitting={submitting}
                    />
                )}

                {/* Results Screen */}
                {quizState === QUIZ_STATE.RESULTS && submissionResult && (
                    <ResultsScreen
                        quiz={quiz}
                        result={submissionResult}
                        startTime={startTime}
                        domainId={domainId}
                        nextItem={nextItem}
                        prevItem={prevItem}
                        onRetake={retakeQuiz}
                        onReview={viewReview}
                    />
                )}

                {/* Review Mode */}
                {quizState === QUIZ_STATE.REVIEW && submissionResult && (
                    <ReviewScreen
                        quiz={quiz}
                        result={submissionResult}
                        currentIndex={currentQuestionIndex}
                        onIndexChange={setCurrentQuestionIndex}
                        onExit={() => setQuizState(QUIZ_STATE.RESULTS)}
                    />
                )}
            </div>
        </div>
    );
}

// Subcomponents...

function QuizStartScreen({ quiz, onStart, user, prevItem, nextItem, domainId }) {
    return (
        <Card className="text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
                {quiz.title}
            </h1>

            <p className="text-[var(--text-secondary)] mb-6">
                {quiz.description}
            </p>

            <div className="flex justify-center gap-6 mb-8">
                <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--text)]">{quiz.questions.length}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Questions</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--text)]">{quiz.xpReward}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Max XP</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--text)]">{quiz.passingScore}%</div>
                    <div className="text-sm text-[var(--text-secondary)]">To Pass</div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {!user ? (
                    <div className="mb-6 text-warning-400">
                        <p>Please login to take this quiz.</p>
                        <Link to="/login" className="underline">Login</Link>
                    </div>
                ) : (
                    <Button size="lg" onClick={onStart} className="px-12 w-full">
                        {user.role === 'guest' ? 'Start Quiz (Guest Mode)' : 'Start Quiz'}
                    </Button>
                )}

                <div className="flex gap-4">
                    {/* Previous Button */}
                    {prevItem ? (
                        <Link to={
                            prevItem.itemType === 'Quiz'
                                ? `/domain/${domainId}/quiz/${prevItem.itemId?._id || prevItem.itemId}`
                                : `/domain/${domainId}/chapter/${prevItem.itemId?._id || prevItem.itemId}/read`
                        } className="flex-1">
                            <Button variant="ghost" fullWidth leftIcon={<ArrowLeft size={18} />}>
                                Previous
                            </Button>
                        </Link>
                    ) : (
                        domainId && (
                            <Link to={`/domain/${domainId}`} className="flex-1">
                                <Button variant="ghost" fullWidth leftIcon={<ArrowLeft size={18} />}>
                                    Back to Course
                                </Button>
                            </Link>
                        )
                    )}

                    {/* Next Button (Skip) */}
                    {nextItem ? (
                        <Link to={
                            nextItem.itemType === 'Quiz'
                                ? `/domain/${domainId}/quiz/${nextItem.itemId?._id || nextItem.itemId}`
                                : `/domain/${domainId}/chapter/${nextItem.itemId?._id || nextItem.itemId}/read`
                        } className="flex-1">
                            <Button variant="ghost" fullWidth rightIcon={<ArrowRight size={18} />}>
                                Skip / Next
                            </Button>
                        </Link>
                    ) : (
                        <Link to={`/domain/${domainId}`} className="flex-1">
                            <Button variant="ghost" fullWidth rightIcon={<CheckCircle size={18} />}>
                                Finish
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </Card>
    );
}

function QuestionScreen({
    quiz, questionIndex, selectedAnswer,
    onSelectAnswer, onNext, onPrev, onSubmit,
    answers, submitting
}) {
    const question = quiz.questions[questionIndex];
    const isLastInfo = questionIndex === quiz.questions.length - 1;
    const isAnswered = answers[question._id] !== undefined;

    return (
        <div className="animate-fade-in-up">
            {/* Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-2">
                    <span>Question {questionIndex + 1} of {quiz.questions.length}</span>
                </div>
                <ProgressBar
                    value={questionIndex + 1}
                    max={quiz.questions.length}
                    variant="primary"
                    size="sm"
                />
            </div>

            <Card className="mb-6">
                <div className="mb-6">
                    <span className="inline-block px-3 py-1 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-medium mb-4">
                        {question.type === 'mcq' ? 'Multiple Choice' : 'True / False'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                        {question.question}
                    </h2>
                </div>

                <div className="space-y-3">
                    {question.type === 'mcq' ? (
                        question.options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onSelectAnswer(option.id)}
                                className={`
                                    w-full p-4 rounded-xl text-left
                                    flex items-center gap-4
                                    transition-all duration-200
                                    ${selectedAnswer === option.id
                                        ? 'bg-primary-500/20 border-2 border-primary-500 text-primary-400'
                                        : 'bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text)] hover:border-primary-500/50'
                                    }
                                `}
                            >
                                <span className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                                    ${selectedAnswer === option.id
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-[var(--surface-hover)]'
                                    }
                                  `}>
                                    {option.id.toUpperCase()}
                                </span>
                                <span className="flex-1">{option.text}</span>
                            </button>
                        ))
                    ) : (
                        // True/False
                        <>
                            {[true, false].map((value) => (
                                <button
                                    key={String(value)}
                                    onClick={() => onSelectAnswer(value)}
                                    className={`
                                      w-full p-4 rounded-xl
                                      flex items-center justify-center gap-3
                                      text-lg font-semibold
                                      transition-all duration-200
                                      ${selectedAnswer === value
                                            ? 'bg-primary-500/20 border-2 border-primary-500 text-primary-400'
                                            : 'bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text)] hover:border-primary-500/50'
                                        }
                                    `}
                                >
                                    {value ? 'True' : 'False'}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </Card>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={onPrev}
                    disabled={questionIndex === 0}
                    leftIcon={<ArrowLeft size={18} />}
                >
                    Previous
                </Button>

                {isLastInfo ? (
                    <Button
                        onClick={onSubmit}
                        disabled={submitting || Object.keys(answers).length < quiz.questions.length} // Enforce all answered? Or verify on submit. Let's enforce answering.
                        // Actually, user might want to submit not all. But simpler to enforce.
                        rightIcon={submitting ? null : <CheckCircle size={18} />}
                        variant="success"
                    >
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                ) : (
                    <Button
                        onClick={onNext}
                        // disabled={!isAnswered} // Allow skipping? Let's say yes for now, but UI should show it's unanswered.
                        // For better UX in learning app, usually enforce answer.
                        disabled={selectedAnswer === null} // Enforce answer to proceed
                        rightIcon={<ArrowRight size={18} />}
                    >
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
}

function ResultsScreen({ quiz, result, startTime, domainId, nextItem, prevItem, onRetake, onReview }) {
    // result contains: score, passed, xpEarned, correctAnswers, totalQuestions, results[]
    return (
        <div className="animate-fade-in-up">
            <Card className="text-center mb-6">
                <div className={`
                    w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center
                    ${result.passed
                        ? 'bg-gradient-to-br from-success-500 to-emerald-400'
                        : 'bg-gradient-to-br from-warning-500 to-orange-400'
                    }
                `}>
                    {result.passed ? <Trophy size={48} className="text-white" /> : <Target size={48} className="text-white" />}
                </div>

                <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
                    {result.passed ? 'Congratulations!' : 'Keep Practicing!'}
                </h1>
                <p className="text-[var(--text-secondary)] mb-8">
                    {result.passed ? 'You passed the quiz!' : `You need ${quiz.passingScore}% to pass.`}
                </p>

                <div className="flex justify-center gap-8 mb-8">
                    <div className="text-center">
                        <div className={`text-5xl font-bold ${result.passed ? 'text-success-400' : 'text-warning-400'}`}>
                            {result.score}%
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">Score</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
                        <CheckCircle className="w-6 h-6 text-success-400 mx-auto mb-2" />
                        <div className="text-xl font-bold text-[var(--text)]">{result.correctAnswers}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Correct</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
                        <Zap className="w-6 h-6 text-secondary-400 mx-auto mb-2" />
                        <div className="text-xl font-bold text-[var(--text)]">+{result.xpEarned}</div>
                        <div className="text-xs text-[var(--text-secondary)]">XP Earned</div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" onClick={onReview} leftIcon={<BookOpen size={18} />} fullWidth>
                        Review Answers
                    </Button>
                    <Button variant="ghost" onClick={onRetake} leftIcon={<RotateCcw size={18} />} fullWidth>
                        Retake Quiz
                    </Button>
                </div>

                {/* Navigation Actions */}
                <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row gap-4">
                    {prevItem && (
                        <Link to={
                            prevItem.itemType === 'Quiz'
                                ? `/domain/${domainId}/quiz/${prevItem.itemId?._id || prevItem.itemId}`
                                : `/domain/${domainId}/chapter/${prevItem.itemId?._id || prevItem.itemId}/read`
                        } className="flex-1">
                            <Button fullWidth variant="outline" leftIcon={<ArrowLeft size={18} />}>
                                Previous
                            </Button>
                        </Link>
                    )}

                    {nextItem ? (
                        <Link to={
                            nextItem.itemType === 'Quiz'
                                ? `/domain/${domainId}/quiz/${nextItem.itemId?._id || nextItem.itemId}`
                                : `/domain/${domainId}/chapter/${nextItem.itemId?._id || nextItem.itemId}/read`
                        } className="flex-1">
                            <Button fullWidth variant="primary" rightIcon={<ArrowRight size={18} />}>
                                Next Lesson
                            </Button>
                        </Link>
                    ) : domainId ? (
                        <Link to={`/domain/${domainId}`} className="flex-1">
                            <Button fullWidth rightIcon={<ArrowRight size={18} />}>
                                Finish Domain
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/explore" className="flex-1">
                            <Button fullWidth rightIcon={<ArrowRight size={18} />}>
                                Explore More
                            </Button>
                        </Link>
                    )}
                </div>
            </Card>
        </div>
    );
}

function ReviewScreen({ quiz, result, currentIndex, onIndexChange, onExit }) {
    // result.results has array of { questionId, isCorrect, correctAnswer, userAnswer, explanation }
    // We need to map result.results to quiz.questions order
    const question = quiz.questions[currentIndex];
    const questionResult = result.results.find(r => r.questionId === question._id);

    const isCorrect = questionResult?.isCorrect;

    return (
        <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--text)]">Review Answers</h2>
                <Button variant="ghost" onClick={onExit}>
                    Exit Review
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {quiz.questions.map((q, i) => {
                    const qRes = result.results.find(r => r.questionId === q._id);
                    return (
                        <button
                            key={q._id}
                            onClick={() => onIndexChange(i)}
                            className={`
                                w-10 h-10 rounded-xl flex-shrink-0
                                flex items-center justify-center font-bold
                                transition-all
                                ${i === currentIndex ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-[var(--bg)]' : ''}
                                ${qRes?.isCorrect ? 'bg-success-500 text-white' : 'bg-error-500 text-white'}
                            `}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            <Card className={`mb-6 ${isCorrect ? 'border-success-500/30' : 'border-error-500/30'}`}>
                <div className="flex items-center gap-2 mb-4">
                    {isCorrect ? (
                        <CheckCircle className="text-success-500" size={24} />
                    ) : (
                        <XCircle className="text-error-500" size={24} />
                    )}
                    <span className={`font-bold ${isCorrect ? 'text-success-400' : 'text-error-400'}`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text)] mb-4">
                    {question.question}
                </h3>

                {/* Options Display */}
                <div className="space-y-2 mb-4">
                    {question.type === 'mcq' ? (
                        question.options.map((option) => {
                            // Map backend index (0,1,2,3) to frontend ID ('a','b','c','d')
                            const userAnswerId = ['a', 'b', 'c', 'd'][questionResult?.userAnswer];
                            const correctAnswerId = ['a', 'b', 'c', 'd'][questionResult?.correctAnswer];

                            const isSelected = userAnswerId === option.id;
                            const isCorrectAnswer = correctAnswerId === option.id;

                            return (
                                <div
                                    key={option.id}
                                    className={`
                                        p-3 rounded-lg flex items-center gap-3
                                        ${isCorrectAnswer
                                            ? 'bg-success-500/20 text-success-400'
                                            : isSelected
                                                ? 'bg-error-500/20 text-error-400'
                                                : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                                        }
                                    `}
                                >
                                    <span className="font-bold">{option.id.toUpperCase()}.</span>
                                    <span>{option.text}</span>
                                    {isCorrectAnswer && <CheckCircle size={16} className="ml-auto" />}
                                    {isSelected && !isCorrectAnswer && <XCircle size={16} className="ml-auto" />}
                                </div>
                            );
                        })
                    ) : (
                        // True/False
                        <div className="flex gap-4">
                            {[true, false].map(val => {
                                // Map backend index (0=True, 1=False) to boolean
                                // 0 -> True, 1 -> False
                                const userVal = questionResult?.userAnswer === 0;
                                const correctVal = questionResult?.correctAnswer === 0;

                                const isSelected = userVal === val;
                                const isCorrectAnswer = correctVal === val;
                                return (
                                    <div key={String(val)} className={`
                                        flex-1 p-3 rounded-lg text-center
                                        ${isCorrectAnswer
                                            ? 'bg-success-500/20 text-success-400'
                                            : isSelected
                                                ? 'bg-error-500/20 text-error-400'
                                                : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                                        }
                                    `}>
                                        {val ? 'True' : 'False'}
                                        {isCorrectAnswer && <CheckCircle size={14} className="inline ml-1" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
                    <h4 className="font-semibold text-[var(--text)] mb-1">Explanation</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{questionResult?.explanation}</p>
                </div>
            </Card>

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    leftIcon={<ArrowLeft size={18} />}
                    fullWidth
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    onClick={() => onIndexChange(Math.min(quiz.questions.length - 1, currentIndex + 1))}
                    disabled={currentIndex === quiz.questions.length - 1}
                    rightIcon={<ArrowRight size={18} />}
                    fullWidth
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
