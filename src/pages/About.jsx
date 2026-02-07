import { Link } from 'react-router-dom';
import {
    ArrowRight, Zap, Trophy, Target, TrendingUp,
    Sparkles, BookOpen, Users, Award, Heart,
    Moon, Book, Star
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

export default function About() {
    const features = [
        {
            icon: Book,
            title: 'Authentic Content',
            description: 'Learn from carefully curated content based on authentic Islamic sources.',
            color: 'from-emerald-500 to-teal-500',
        },
        {
            icon: Zap,
            title: 'Gamified Learning',
            description: 'Earn XP, maintain streaks, and unlock achievements as you learn.',
            color: 'from-yellow-500 to-orange-500',
        },
        {
            icon: TrendingUp,
            title: 'Track Progress',
            description: 'Visual dashboards to monitor your learning journey and growth.',
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: Sparkles,
            title: 'Create Quizzes',
            description: 'Build your own quizzes and share them with the community.',
            color: 'from-purple-500 to-pink-500',
        },
    ];

    const steps = [
        { number: 1, title: 'Choose a Course', description: 'Pick from various Islamic topics' },
        { number: 2, title: 'Read & Learn', description: 'Study the authentic materials' },
        { number: 3, title: 'Take Quizzes', description: 'Test your knowledge' },
        { number: 4, title: 'Earn Rewards', description: 'Get XP and achievements' },
    ];

    const stats = [
        { label: 'Active Learners', value: '10K+', icon: Users },
        { label: 'Quizzes Available', value: '500+', icon: Target },
        { label: 'Courses', value: '50+', icon: BookOpen },
        { label: 'Achievements', value: '100+', icon: Award },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 lg:py-24">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 mb-6">
                            <Moon className="w-4 h-4 text-primary-400" />
                            <span className="text-sm font-medium text-primary-400">
                                Islamic Learning Platform
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                            <span className="gradient-text">Seeking Knowledge</span>
                            <br />
                            <span className="text-[var(--text)]">Made Beautiful</span>
                        </h1>

                        {/* Arabic Quote */}
                        <p className="text-xl text-primary-400 mb-4 font-arabic">
                            طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mb-8">
                            "Seeking knowledge is an obligation upon every Muslim" - Prophet Muhammad ﷺ
                        </p>

                        {/* Subheadline */}
                        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
                            Our mission is to make Islamic education accessible, engaging, and rewarding.
                            Learn at your own pace with interactive quizzes and track your spiritual growth.
                        </p>

                        {/* CTA */}
                        <Link to="/">
                            <Button size="lg" rightIcon={<ArrowRight size={20} />}>
                                Start Learning
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-[var(--surface)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="p-6 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-center"
                            >
                                <stat.icon className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                                <div className="text-2xl font-bold text-[var(--text)]">{stat.value}</div>
                                <div className="text-sm text-[var(--text-secondary)]">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <Badge variant="primary" className="mb-4">Features</Badge>
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-4">
                            Why Learn With Us?
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                            We combine authentic Islamic education with modern learning techniques
                            to make your journey of knowledge both effective and enjoyable.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <Card
                                key={feature.title}
                                variant="default"
                                hoverable
                                className="text-center animate-fade-in-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {feature.description}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 bg-[var(--surface)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <Badge variant="success" className="mb-4">How It Works</Badge>
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
                            Your Learning Journey
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div
                                key={step.number}
                                className="relative text-center animate-fade-in-up"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500" />
                                )}

                                {/* Step Number */}
                                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                                    <span className="text-2xl font-bold text-white">{step.number}</span>
                                </div>

                                <h3 className="text-lg font-bold text-[var(--text)] mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Badge variant="secondary" className="mb-4">Our Values</Badge>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-8">
                        Built on Islamic Principles
                    </h2>

                    <div className="grid sm:grid-cols-3 gap-6">
                        <Card>
                            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                                <Book className="w-6 h-6 text-primary-400" />
                            </div>
                            <h3 className="font-bold text-[var(--text)] mb-2">Authenticity</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Content verified from authentic Islamic sources
                            </p>
                        </Card>

                        <Card>
                            <div className="w-12 h-12 rounded-full bg-success-500/20 flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-6 h-6 text-success-400" />
                            </div>
                            <h3 className="font-bold text-[var(--text)] mb-2">Sincerity</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Learning for the sake of Allah SWT
                            </p>
                        </Card>

                        <Card>
                            <div className="w-12 h-12 rounded-full bg-warning-500/20 flex items-center justify-center mx-auto mb-4">
                                <Star className="w-6 h-6 text-warning-400" />
                            </div>
                            <h3 className="font-bold text-[var(--text)] mb-2">Excellence</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Striving for ihsan in everything we do
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 sm:p-14 text-center">
                        <div className="relative z-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                Begin Your Journey Today
                            </h2>
                            <p className="text-white/80 mb-6 max-w-xl mx-auto">
                                Join our community of learners seeking knowledge for the pleasure of Allah.
                                Start learning — it's completely free!
                            </p>
                            <Link to="/">
                                <Button
                                    size="lg"
                                    className="bg-white text-primary-600 hover:bg-white/90 shadow-xl"
                                    rightIcon={<ArrowRight size={20} />}
                                >
                                    Explore Courses
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
