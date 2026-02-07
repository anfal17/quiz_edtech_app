import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-error-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-12 h-12 text-error-400" />
                </div>
                <h1 className="text-6xl font-bold bg-gradient-to-r from-error-400 to-orange-400 bg-clip-text text-transparent mb-4">
                    404
                </h1>
                <h2 className="text-2xl font-bold text-[var(--text)] mb-4">
                    Page Not Found
                </h2>
                <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <Link to="/">
                    <Button
                        variant="primary"
                        size="lg"
                        leftIcon={<Home size={20} />}
                    >
                        Go Back Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
