import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';

export default function Login() {
    const navigate = useNavigate();
    const { login, loginAsGuest, error: authError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(email, password);
            // Redirect based on role
            if (user.role === ROLES.ADMIN || user.role === ROLES.SUPERADMIN) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
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
                        Welcome back
                    </h2>
                    <p className="mt-2 text-[var(--text-secondary)]">
                        Sign in to continue your learning journey
                    </p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
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
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-[var(--border)] text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-400 hover:text-primary-300"
                            >
                                Forgot password?
                            </Link>
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
                            Sign In
                        </Button>
                    </form>

                    {/* Divider Removed */}



                    {/* Guest Login */}
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => {
                                loginAsGuest();
                                navigate('/dashboard');
                            }}
                            className="border-dashed"
                        >
                            Continue as Guest
                        </Button>
                    </div>
                </Card>

                {/* Sign Up Link */}
                <p className="mt-6 text-center text-[var(--text-secondary)]">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
                        Sign up for free
                    </Link>
                </p>
            </div >
        </div >
    );
}
