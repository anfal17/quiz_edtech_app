import { Link } from 'react-router-dom';
import { Github, Twitter, Heart, Mail } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        learn: [
            { label: 'Explore Courses', path: '/explore' },
            { label: 'My Progress', path: '/dashboard' },
            { label: 'Create Quiz', path: '/create-quiz' },
        ],
        topics: [
            { label: 'Quran', path: '/explore?tag=quran' },
            { label: 'Hadith', path: '/explore?tag=hadith' },
            { label: 'Fiqh', path: '/explore?tag=fiqh' },
            { label: 'Seerah', path: '/explore?tag=seerah' },
        ],
        about: [
            { label: 'About Us', path: '/about' },
            { label: 'Privacy Policy', path: '/privacy' },
            { label: 'Terms of Service', path: '/terms' },
            { label: 'Contact', path: '/contact' },
        ],
    };

    return (
        <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer */}
                <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <span className="text-xl">📖</span>
                            </div>
                            <span className="text-xl font-bold gradient-text">Ilm Path</span>
                        </Link>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            Your journey to Islamic knowledge. Learn, quiz yourself, and grow in faith.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="p-2 rounded-lg bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                                aria-label="Email"
                            >
                                <Mail size={18} />
                            </a>
                            <a
                                href="#"
                                className="p-2 rounded-lg bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Learn Links */}
                    <div>
                        <h4 className="font-semibold text-[var(--text)] mb-4">Learn</h4>
                        <ul className="space-y-2">
                            {footerLinks.learn.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-[var(--text-secondary)] hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Topics Links */}
                    <div>
                        <h4 className="font-semibold text-[var(--text)] mb-4">Topics</h4>
                        <ul className="space-y-2">
                            {footerLinks.topics.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-[var(--text-secondary)] hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* About Links */}
                    <div>
                        <h4 className="font-semibold text-[var(--text)] mb-4">About</h4>
                        <ul className="space-y-2">
                            {footerLinks.about.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-[var(--text-secondary)] hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="py-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                        © {currentYear} Ilm Path. All rights reserved.
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                        Made with <Heart className="w-4 h-4 text-error-500 fill-current" /> for the Ummah
                    </p>
                </div>
            </div>
        </footer>
    );
}

