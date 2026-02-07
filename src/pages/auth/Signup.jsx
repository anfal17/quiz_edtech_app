import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Check } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
    const navigate = useNavigate();
    const { register, loginAsGuest, error: authError } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const passwordRequirements = [
        { label: 'At least 6 characters', met: formData.password.length >= 6 },
        { label: 'Contains a number', met: /\d/.test(formData.password) },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!acceptTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        setIsLoading(true);

        try {
            await register(formData.name, formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-2xl">
                            📖
                        </div>
                        <span className="text-2xl font-bold gradient-text">Ilm Path</span>
                    </Link>
                    <h2 className="mt-6 text-2xl font-bold text-[var(--text)]">
                        Create your account
                    </h2>
                    <p className="mt-2 text-[var(--text-secondary)]">
                        Start your journey of Islamic knowledge
                    </p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    required
                                    className="
                    w-full pl-12 pr-4 py-3 rounded-xl
                    bg-[var(--surface-hover)] border border-[var(--border)]
                    text-[var(--text)] placeholder:text-[var(--text-secondary)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    transition-all
                  "
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                    className="
                    w-full pl-12 pr-4 py-3 rounded-xl
                    bg-[var(--surface-hover)] border border-[var(--border)]
                    text-[var(--text)] placeholder:text-[var(--text-secondary)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    transition-all
                  "
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a password"
                                    required
                                    className="
                    w-full pl-12 pr-12 py-3 rounded-xl
                    bg-[var(--surface-hover)] border border-[var(--border)]
                    text-[var(--text)] placeholder:text-[var(--text-secondary)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    transition-all
                  "
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text)]"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {/* Password Requirements */}
                            {formData.password && (
                                <div className="mt-2 space-y-1">
                                    {passwordRequirements.map((req) => (
                                        <div
                                            key={req.label}
                                            className={`flex items-center gap-2 text-xs ${req.met ? 'text-success-400' : 'text-[var(--text-secondary)]'
                                                }`}
                                        >
                                            <Check size={14} className={req.met ? 'opacity-100' : 'opacity-30'} />
                                            {req.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    required
                                    className={`
                    w-full pl-12 pr-4 py-3 rounded-xl
                    bg-[var(--surface-hover)] border
                    text-[var(--text)] placeholder:text-[var(--text-secondary)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    transition-all
                    ${formData.confirmPassword && formData.password !== formData.confirmPassword
                                            ? 'border-error-500'
                                            : 'border-[var(--border)]'
                                        }
                  `}
                                />
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="mt-1 text-xs text-error-400">Passwords do not match</p>
                            )}
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-[var(--border)] text-primary-500 focus:ring-primary-500"
                            />
                            <label htmlFor="terms" className="text-sm text-[var(--text-secondary)]">
                                I agree to the{' '}
                                <Link to="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
                            </label>
                        </div>

                        {/* Error Message */}
                        {(error || authError) && (
                            <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-400 text-sm">
                                {error || authError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={isLoading}
                            rightIcon={<ArrowRight size={20} />}
                        >
                            Create Account
                        </Button>
                    </form>

                    {/* Divider Removed */}


                </Card>

                {/* Guest Login */}
                <div className="mt-4">
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={() => {
                            loginAsGuest();
                            navigate('/dashboard');
                        }}
                        className="bg-[var(--surface)] border-dashed"
                    >
                        Continue as Guest
                    </Button>
                </div>

                {/* Sign In Link */}
                <p className="mt-6 text-center text-[var(--text-secondary)]">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
