import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Clock, BookOpen, Brain, Trophy,
    CheckCircle, Lock, PlayCircle, ChevronRight
} from 'lucide-react';
import { Button, Card, Badge, CircularProgress, Tabs, TabsList, TabsTrigger, TabsContent, ProgressBar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { coursesAPI, chaptersAPI, progressAPI } from '../services/api';

export default function DomainDetail() {
    const { domainId } = useParams();
    const { user } = useAuth();
    const [domain, setDomain] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [completedChapterIds, setCompletedChapterIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch course and chapters
                const [courseData, chaptersData] = await Promise.all([
                    coursesAPI.getById(domainId),
                    chaptersAPI.getByCourse(domainId)
                ]);

                // Sync Lists with Learning Path
                let finalChapters = chaptersData.sort((a, b) => a.order - b.order);
                let finalQuizzes = courseData.quizzes || [];

                if (courseData.learningPath && courseData.learningPath.length > 0) {
                    // Extract items from Learning Path to ensure consistency
                    const lpChapters = courseData.learningPath
                        .filter(item => item.itemType === 'Chapter' && item.itemId)
                        .map(item => item.itemId);

                    const lpQuizzes = courseData.learningPath
                        .filter(item => item.itemType === 'Quiz' && item.itemId)
                        .map(item => item.itemId);

                    // If we have items in LP, prefer them
                    if (lpChapters.length > 0) finalChapters = lpChapters;
                    if (lpQuizzes.length > 0) finalQuizzes = lpQuizzes;
                }

                setDomain({ ...courseData, quizzes: finalQuizzes });
                setChapters(finalChapters);

                // Fetch progress if user is logged in
                if (user) {
                    try {
                        const progressData = await progressAPI.getByCourse(domainId);
                        const completedCh = progressData.completedChapters.map(c =>
                            typeof c.chapterId === 'object' ? c.chapterId._id : c.chapterId
                        );
                        const completedQz = progressData.quizResults?.filter(q => q.passed).map(q => q.quizId) || [];
                        const allCompleted = [...completedCh, ...completedQz];
                        setCompletedChapterIds(allCompleted);

                        setProgress({
                            completed: allCompleted.length,
                            total: progressData.totalChapters // Now includes quizzes from backend
                        });
                    } catch (err) {
                        console.error('Failed to fetch progress:', err);
                        // Start with empty progress if none exists
                        setProgress({
                            completed: 0,
                            total: (chaptersData.length + (courseData.quizzes?.length || 0))
                        });
                        setCompletedChapterIds([]);
                    }
                } else {
                    setProgress({
                        completed: 0,
                        total: (chaptersData.length + (courseData.quizzes?.length || 0))
                    });
                }

            } catch (error) {
                console.error('Failed to fetch domain details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [domainId, user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!domain) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Domain Not Found</h2>
                    <p className="text-[var(--text-secondary)] mb-4">The domain you're looking for doesn't exist.</p>
                    <Link to="/explore">
                        <Button variant="primary">Back to Explore</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Determine next chapter to play
    const nextChapterId = chapters.find(c => !completedChapterIds.includes(c._id))?._id || chapters[0]?._id;

    // Determine next item from Learning Path
    let nextItem = null;
    if (domain.learningPath && domain.learningPath.length > 0) {
        nextItem = domain.learningPath.find(item => {
            if (!item.itemId) return false;
            const id = item.itemId._id || item.itemId; // Handle populated or raw
            return !completedChapterIds.includes(id);
        });
        // If all completed, maybe null or first?
        if (!nextItem && progress.completed === 0) {
            nextItem = domain.learningPath[0];
        }
    } else {
        // Fallback to legacy chapters
        const nextChapter = chapters.find(c => !completedChapterIds.includes(c._id));
        if (nextChapter) {
            nextItem = { itemType: 'Chapter', itemId: nextChapter };
        }
    }

    return (
        <div className="min-h-screen pb-24 lg:pb-12 bg-[var(--bg)]">
            {/* Hero Header */}
            <div className="relative h-80 sm:h-96 overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-br ${domain.color}`} />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />

                {/* Back Button */}
                <div className="absolute top-6 left-4 lg:left-8 z-10">
                    <Link to="/explore">
                        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10">
                            Back
                        </Button>
                    </Link>
                </div>

                {/* Domain Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:px-12 pb-12 flex flex-col sm:flex-row items-end gap-6 animate-fade-in-up">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-[var(--surface)] border-4 border-[var(--bg)] flex items-center justify-center text-5xl sm:text-6xl shadow-2xl shadow-black/20">
                        {domain.icon}
                    </div>
                    <div className="flex-1 pb-2">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <Badge variant={domain.difficulty} className="text-sm px-3 py-1 shadow-lg">
                                {domain.difficulty}
                            </Badge>
                            {domain.tags && domain.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="default" className="bg-black/30 text-white border-white/10 backdrop-blur-sm">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg mb-2 leading-tight">
                            {domain.title}
                        </h1>
                        <p className="text-white/80 max-w-2xl text-lg line-clamp-2 md:line-clamp-none">
                            {domain.description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Highlights / Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Card className="p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-[var(--surface-hover)] transition-colors cursor-default">
                                <BookOpen className="w-5 h-5 text-primary-400 mb-1" />
                                <div className="text-xl font-bold text-[var(--text)]">{domain.totalChapters || chapters.length}</div>
                                <div className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Chapters</div>
                            </Card>
                            <Card className="p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-[var(--surface-hover)] transition-colors cursor-default">
                                <Brain className="w-5 h-5 text-secondary-400 mb-1" />
                                <div className="text-xl font-bold text-[var(--text)]">{domain.totalQuizzes || domain.quizzes?.length || 0}</div>
                                <div className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Quizzes</div>
                            </Card>
                            <Card className="p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-[var(--surface-hover)] transition-colors cursor-default">
                                <Clock className="w-5 h-5 text-warning-400 mb-1" />
                                <div className="text-xl font-bold text-[var(--text)]">{domain.estimatedHours || Math.ceil((chapters.length * 15) / 60)}h</div>
                                <div className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Duration</div>
                            </Card>
                            <Card className="p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-[var(--surface-hover)] transition-colors cursor-default">
                                <Trophy className="w-5 h-5 text-success-400 mb-1" />
                                <div className="text-xl font-bold text-[var(--text)]">{(domain.totalChapters || chapters.length) * 50 + (domain.totalQuizzes || 0) * 100}</div>
                                <div className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Total XP</div>
                            </Card>
                        </div>

                        {/* Chapters List */}
                        {/* Content Tabs */}
                        <div className="mt-2">
                            <Tabs defaultValue="path">
                                <TabsList className="mb-8 w-full sm:w-auto p-1 bg-[var(--surface)] text-[var(--text-secondary)] rounded-xl border border-[var(--border)]">
                                    <TabsTrigger value="path" className="gap-2 flex-1 sm:flex-none data-[state=active]:bg-[var(--bg)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                            Learning Path
                                        </div>
                                    </TabsTrigger>
                                    <TabsTrigger value="chapters" className="gap-2 flex-1 sm:flex-none data-[state=active]:bg-[var(--bg)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-sm">
                                        <BookOpen size={16} />
                                        Chapters
                                    </TabsTrigger>
                                    <TabsTrigger value="quizzes" className="gap-2 flex-1 sm:flex-none data-[state=active]:bg-[var(--bg)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-sm">
                                        <Brain size={16} />
                                        Quizzes
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="path">
                                    <div className="relative pl-8 space-y-8">
                                        {/* Vertical Timeline Line */}
                                        <div className="absolute top-4 bottom-4 left-[15px] w-0.5 bg-[var(--border)]" />

                                        {(!domain.learningPath || domain.learningPath.length === 0) && (
                                            <div className="text-center p-8 bg-[var(--surface-hover)] rounded-xl border border-dashed border-[var(--border)] ml-4">
                                                <p className="text-[var(--text-secondary)]">No learning path defined. Check the Chapters and Quizzes tabs.</p>
                                            </div>
                                        )}
                                        {domain.learningPath && domain.learningPath.map((item, index) => {
                                            if (!item.itemId) return null;

                                            const content = item.itemId;
                                            const isLast = index === domain.learningPath.length - 1;
                                            const isCompleted = completedChapterIds.includes(content._id) || (item.itemType === 'Quiz' && content.userProgress?.passed);
                                            // Note: User progress for quiz is fetched via separate API, handling simply here based on general completion list for now.
                                            // Actually completedChapterIds includes quizIds if they are in the list.

                                            return (
                                                <div key={`path-${index}`} className="relative animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                    {/* Timeline Dot */}
                                                    <div className={`
                                                        absolute -left-8 top-6 w-8 h-8 rounded-full border-4 border-[var(--bg)] 
                                                        flex items-center justify-center z-10 shadow-sm
                                                        ${completedChapterIds.includes(content._id)
                                                            ? 'bg-success-500 text-white'
                                                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]'
                                                        }
                                                    `}>
                                                        {completedChapterIds.includes(content._id) ? (
                                                            <CheckCircle size={14} fill="currentColor" className="text-white" />
                                                        ) : (
                                                            <span className="text-xs font-bold">{index + 1}</span>
                                                        )}
                                                    </div>

                                                    {item.itemType === 'Chapter' ? (
                                                        content.isPublished ? (
                                                            <ChapterCard
                                                                chapter={content}
                                                                domainId={domainId}
                                                                index={index}
                                                                isCompleted={completedChapterIds.includes(content._id)}
                                                                label={`Step ${index + 1}`}
                                                                timelineMode={true}
                                                            />
                                                        ) : null
                                                    ) : item.itemType === 'Quiz' ? (
                                                        content.isPublished ? (
                                                            <Link to={`/domain/${domainId}/quiz/${content._id}`}>
                                                                <Card
                                                                    hoverable
                                                                    className="flex items-center gap-4 hover:bg-[var(--surface-hover)] ring-1 ring-[var(--border)] group transition-all"
                                                                >
                                                                    <div className="w-12 h-12 rounded-xl bg-secondary-500/10 text-secondary-500 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-500 group-hover:text-white transition-colors">
                                                                        <Brain size={24} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Badge variant="secondary" size="sm">Quiz</Badge>
                                                                            <h3 className="font-semibold text-[var(--text)] truncate group-hover:text-secondary-400 transition-colors">
                                                                                {content.title}
                                                                            </h3>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                                                                            <span>{content.questions?.length || content.totalQuestions || 0} Questions</span>
                                                                            <span>•</span>
                                                                            <span>{content.xpReward} XP</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium group-hover:bg-secondary-500 group-hover:text-white group-hover:border-secondary-500 transition-all">
                                                                        Start
                                                                    </div>
                                                                </Card>
                                                            </Link>
                                                        ) : null
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>

                                <TabsContent value="chapters">
                                    <div className="space-y-4">
                                        {chapters.length > 0 ? chapters.map((chapter, index) => (
                                            <ChapterCard
                                                key={chapter._id}
                                                chapter={chapter}
                                                domainId={domainId}
                                                index={index}
                                                isCompleted={completedChapterIds.includes(chapter._id)}
                                            />
                                        )) : (
                                            <p className="text-[var(--text-secondary)] text-center py-8">No chapters available.</p>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="quizzes">
                                    <div className="space-y-4">
                                        {domain.quizzes && domain.quizzes.length > 0 ? domain.quizzes.map((quiz, index) => (
                                            <Link key={quiz._id} to={`/domain/${domainId}/quiz/${quiz._id}`}>
                                                <Card
                                                    hoverable
                                                    className="flex items-center gap-4 hover:bg-[var(--surface-hover)]"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-secondary-500/20 text-secondary-400 flex items-center justify-center flex-shrink-0">
                                                        <Brain className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-[var(--text)] truncate">
                                                            {quiz.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                                                            <span>{quiz.questions?.length || quiz.totalQuestions || 0} Questions</span>
                                                            <span>•</span>
                                                            <span>{quiz.xpReward} XP</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                                                </Card>
                                            </Link>
                                        )) : (
                                            <p className="text-[var(--text-secondary)] text-center py-8">No quizzes available.</p>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Progress Card */}
                            <Card variant="gradient" className="overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Trophy size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-center mb-6 mt-2">
                                        <CircularProgress
                                            value={progress.completed}
                                            max={progress.total || 1}
                                            size={160}
                                            strokeWidth={12}
                                            variant="xp"
                                            label="Complete"
                                        />
                                    </div>

                                    <div className="text-center mb-6">
                                        <div className="text-sm font-medium text-[var(--text-secondary)]">
                                            Your Progress
                                        </div>
                                        <div className="text-2xl font-bold text-[var(--text)]">
                                            {progress.completed} <span className="text-[var(--text-secondary)] text-base font-normal">/ {progress.total} items</span>
                                        </div>
                                    </div>

                                    {progress.completed < progress.total && nextItem ? (
                                        <Link to={
                                            nextItem.itemType === 'Quiz'
                                                ? `/domain/${domainId}/quiz/${nextItem.itemId._id}`
                                                : `/domain/${domainId}/chapter/${nextItem.itemId._id}/read`
                                        }>
                                            <Button fullWidth size="lg" className="shadow-lg shadow-primary-500/20" rightIcon={<PlayCircle size={20} />}>
                                                {progress.completed === 0 ? 'Start Learning' : 'Continue Learning'}
                                            </Button>
                                        </Link>
                                    ) : progress.completed > 0 && progress.completed >= progress.total ? (
                                        <div className="flex flex-col items-center justify-center gap-2 p-4 bg-success-500/10 rounded-xl border border-success-500/20 text-success-500 animate-pulse-slow">
                                            <Trophy className="w-8 h-8" />
                                            <span className="font-bold text-lg">Domain Completed!</span>
                                        </div>
                                    ) : null}
                                </div>
                            </Card>

                            {/* Tags/Topics - Enhanced */}
                            {domain.tags && domain.tags.length > 0 && (
                                <Card>
                                    <h3 className="text-sm font-bold text-[var(--text)] mb-4 uppercase tracking-wider">Topics Covered</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {domain.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="px-3 py-1.5 hover:border-primary-500 transition-colors cursor-default">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--surface)] border-t border-[var(--border)] lg:hidden z-50 animate-slide-up shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between text-xs font-semibold text-[var(--text)] mb-1">
                            <span>Progress</span>
                            <span>{Math.round((progress.completed / (progress.total || 1)) * 100)}%</span>
                        </div>
                        <ProgressBar value={progress.completed} max={progress.total || 1} size="sm" variant="success" />
                    </div>

                    {progress.completed < progress.total && nextItem ? (
                        <Link to={
                            nextItem.itemType === 'Quiz'
                                ? `/domain/${domainId}/quiz/${nextItem.itemId._id}`
                                : `/domain/${domainId}/chapter/${nextItem.itemId._id}/read`
                        }>
                            <Button size="md" rightIcon={<PlayCircle size={18} />} className="whitespace-nowrap shadow-lg shadow-primary-500/20">
                                {progress.completed === 0 ? 'Start' : 'Continue'}
                            </Button>
                        </Link>
                    ) : progress.completed > 0 && progress.completed >= progress.total ? (
                        <div className="flex items-center gap-2 text-success-500 font-bold px-4">
                            <Trophy size={20} />
                            <span>Done!</span>
                        </div>
                    ) : null}
                </div>
            </div>
        </div >
    );
}

function ChapterCard({ chapter, domainId, index, isCompleted, label, timelineMode }) {
    const isLocked = false; // For now, all chapters are unlocked

    return (
        <Link to={`/domain/${domainId}/chapter/${chapter._id}/read`}>
            <Card
                hoverable
                className={`
          flex items-center gap-4 animate-fade-in-up
          ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
          ${isCompleted ? 'border-success-500/30 bg-success-500/5' : ''}
        `}
                style={{ animationDelay: `${index * 50}ms` }}
            >
                {/* Chapter Number/Icon - Hidden in Timeline Mode as we use the dot */}
                {!timelineMode && (
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${isCompleted
                            ? 'bg-success-500 text-white'
                            : isLocked
                                ? 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                                : 'bg-primary-500/20 text-primary-400'
                        }
                    `}>
                        {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                        ) : isLocked ? (
                            <Lock className="w-5 h-5" />
                        ) : (
                            <span className="text-lg font-bold">{label ? label.replace('Step ', '') : chapter.order}</span>
                        )}
                    </div>
                )}

                {timelineMode && (
                    <div className={`
                         w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                         ${isCompleted ? 'bg-success-500/10 text-success-500' : 'bg-primary-500/10 text-primary-500'}
                     `}>
                        <BookOpen size={24} />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text)] truncate">
                        {chapter.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            Reading
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {chapter.estimatedMinutes} min
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
            </Card>
        </Link>
    );
}
