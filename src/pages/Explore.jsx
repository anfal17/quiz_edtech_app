import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Grid3X3, List, Filter, X } from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from '../components/ui';
import { coursesAPI } from '../services/api';

export default function Explore() {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [selectedTag, setSelectedTag] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [showFilters, setShowFilters] = useState(false);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await coursesAPI.getAll();
                setCourses(data);
            } catch (error) {
                console.error('Failed to fetch courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

    // Get unique tags from loaded courses
    const allTags = useMemo(() => {
        return [...new Set(courses.flatMap((c) => c.tags || []))];
    }, [courses]);

    const sortOptions = [
        { value: 'popular', label: 'Most Popular' },
        { value: 'newest', label: 'Newest First' },
        { value: 'alphabetical', label: 'A-Z' },
        { value: 'chapters', label: 'Most Content' },
    ];

    const filteredDomains = useMemo(() => {
        let result = [...courses];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (d) =>
                    d.title.toLowerCase().includes(query) ||
                    d.description.toLowerCase().includes(query) ||
                    (d.tags || []).some((t) => t.includes(query))
            );
        }

        // Difficulty filter
        if (selectedDifficulty !== 'all') {
            result = result.filter((d) => d.difficulty === selectedDifficulty);
        }

        // Tag filter
        if (selectedTag !== 'all') {
            result = result.filter((d) => (d.tags || []).includes(selectedTag));
        }

        // Sorting
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'alphabetical':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'chapters':
                result.sort((a, b) => (b.totalChapters || 0) - (a.totalChapters || 0));
                break;
            default:
                // popular - default order (usually by order field in backend)
                result.sort((a, b) => (a.order || 0) - (b.order || 0));
                break;
        }

        return result;
    }, [courses, searchQuery, selectedDifficulty, selectedTag, sortBy]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedDifficulty('all');
        setSelectedTag('all');
        setSortBy('popular');
    };

    const hasActiveFilters =
        searchQuery || selectedDifficulty !== 'all' || selectedTag !== 'all';

    if (loading) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-2">
                        Explore Domains
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Discover learning paths and start your journey
                    </p>
                </div>

                {/* Search and Controls */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search domains, topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="
                w-full pl-12 pr-4 py-3 rounded-xl
                bg-[var(--surface)] border border-[var(--border)]
                text-[var(--text)] placeholder:text-[var(--text-secondary)]
                focus:outline-none focus:ring-2 focus:ring-primary-500
                transition-all
              "
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--surface-hover)]"
                            >
                                <X size={16} className="text-[var(--text-secondary)]" />
                            </button>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {/* Filter Toggle (Mobile) */}
                        <Button
                            variant="outline"
                            className="lg:hidden"
                            onClick={() => setShowFilters(!showFilters)}
                            leftIcon={<Filter size={18} />}
                        >
                            Filters
                        </Button>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="
                px-4 py-3 rounded-xl
                bg-[var(--surface)] border border-[var(--border)]
                text-[var(--text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500
                cursor-pointer
              "
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-3 ${viewMode === 'grid'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                                    } transition-colors`}
                            >
                                <Grid3X3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-3 ${viewMode === 'list'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                                    } transition-colors`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Filters Sidebar */}
                    <aside className={`
            ${showFilters ? 'block' : 'hidden'} lg:block
            w-full lg:w-64 flex-shrink-0
            fixed lg:relative inset-0 lg:inset-auto
            z-40 lg:z-auto
            bg-[var(--bg)] lg:bg-transparent
            p-4 lg:p-0
            overflow-y-auto
          `}>
                        {/* Mobile Close Button */}
                        <div className="flex justify-between items-center mb-4 lg:hidden">
                            <h3 className="text-lg font-bold text-[var(--text)]">Filters</h3>
                            <button onClick={() => setShowFilters(false)}>
                                <X size={24} className="text-[var(--text-secondary)]" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Difficulty Filter */}
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
                                    Difficulty
                                </h3>
                                <div className="space-y-2">
                                    {difficulties.map((diff) => (
                                        <button
                                            key={diff}
                                            onClick={() => setSelectedDifficulty(diff)}
                                            className={`
                        w-full px-4 py-2 rounded-xl text-left text-sm font-medium
                        transition-colors capitalize
                        ${selectedDifficulty === diff
                                                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                                                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                                                }
                      `}
                                        >
                                            {diff === 'all' ? 'All Levels' : diff}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags Filter */}
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
                                    Category
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedTag('all')}
                                        className={`
                      px-3 py-1.5 rounded-full text-xs font-medium
                      transition-colors
                      ${selectedTag === 'all'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                                            }
                    `}
                                    >
                                        All
                                    </button>
                                    {allTags.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => setSelectedTag(tag)}
                                            className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        transition-colors
                        ${selectedTag === tag
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                                                }
                      `}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <Button variant="ghost" fullWidth onClick={clearFilters}>
                                    Clear All Filters
                                </Button>
                            )}
                        </div>
                    </aside>

                    {/* Domains Grid/List */}
                    <div className="flex-1">
                        {/* Active Filters Display */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <span className="text-sm text-[var(--text-secondary)]">Active filters:</span>
                                {searchQuery && (
                                    <Badge variant="primary" className="gap-1">
                                        Search: {searchQuery}
                                        <button onClick={() => setSearchQuery('')}>
                                            <X size={14} />
                                        </button>
                                    </Badge>
                                )}
                                {selectedDifficulty !== 'all' && (
                                    <Badge variant="primary" className="gap-1 capitalize">
                                        {selectedDifficulty}
                                        <button onClick={() => setSelectedDifficulty('all')}>
                                            <X size={14} />
                                        </button>
                                    </Badge>
                                )}
                                {selectedTag !== 'all' && (
                                    <Badge variant="primary" className="gap-1">
                                        {selectedTag}
                                        <button onClick={() => setSelectedTag('all')}>
                                            <X size={14} />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Results Count */}
                        <div className="mb-6">
                            <span className="text-sm text-[var(--text-secondary)]">
                                Showing {filteredDomains.length} domain{filteredDomains.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Domains */}
                        {filteredDomains.length > 0 ? (
                            <div className={
                                viewMode === 'grid'
                                    ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'space-y-4'
                            }>
                                {filteredDomains.map((domain, index) => (
                                    viewMode === 'grid' ? (
                                        <DomainGridCard key={domain._id} domain={domain} index={index} />
                                    ) : (
                                        <DomainListCard key={domain._id} domain={domain} index={index} />
                                    )
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="text-center py-16">
                                <div className="w-20 h-20 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-10 h-10 text-[var(--text-secondary)]" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)] mb-2">
                                    No domains found
                                </h3>
                                <p className="text-[var(--text-secondary)] mb-4">
                                    Try adjusting your search or filters
                                </p>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DomainGridCard({ domain, index }) {
    return (
        <Link to={`/domain/${domain._id}`}>
            <Card
                variant="default"
                padding="none"
                hoverable
                className="overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
            >
                {/* Cover Image */}
                <div className="relative h-40 overflow-hidden">
                    <div className={`w-full h-full bg-gradient-to-br ${domain.color} transition-transform duration-300 group-hover:scale-110`} />
                    <div className="absolute top-3 left-3 text-4xl">
                        {domain.icon}
                    </div>
                    <div className="absolute top-3 right-3">
                        <Badge variant={domain.difficulty} size="sm">
                            {domain.difficulty}
                        </Badge>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-[var(--text)] mb-1">
                        {domain.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">
                        {domain.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-4">
                        <span>{domain.totalChapters} chapters</span>
                        <span>•</span>
                        <span>{domain.totalQuizzes} quizzes</span>
                        {/* <span>•</span>
                        <span>{domain.estimatedHours}h</span> */}
                        {/* estimatedHours might not be in backend yet, hiding for now */}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                        {(domain.tags || []).slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="default" size="sm">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    {/* Progress - removing static 0 */}
                    {/* <ProgressBar value={0} max={100} size="sm" /> */}

                    <div className="mt-4">
                        <Button fullWidth variant="primary" size="sm">
                            Start Learning
                        </Button>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

function DomainListCard({ domain, index }) {
    return (
        <Link to={`/domain/${domain._id}`}>
            <Card
                variant="default"
                hoverable
                className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
            >
                {/* Cover Image */}
                <div className="relative w-full sm:w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                    <div className={`w-full h-full bg-gradient-to-br ${domain.color}`} />
                    <div className="absolute top-2 left-2 text-3xl">
                        {domain.icon}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text)] mb-1">
                                {domain.title}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                {domain.description}
                            </p>
                        </div>
                        <Badge variant={domain.difficulty} size="sm" className="flex-shrink-0">
                            {domain.difficulty}
                        </Badge>
                    </div>

                    {/* Stats and Tags */}
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
                        <span>{domain.totalChapters} chapters</span>
                        <span>•</span>
                        <span>{domain.totalQuizzes} quizzes</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-1">
                            {(domain.tags || []).slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="default" size="sm">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <Button variant="primary" size="sm">
                            Start
                        </Button>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
