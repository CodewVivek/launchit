import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { SEO } from '../Components/SEO';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <>
            <SEO
                title="Page Not Found"
                description="The page you're looking for doesn't exist."
                noindex={true}
            />
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
                    <p className="text-gray-600 mb-8">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold flex items-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Go Home
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-white text-black border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors font-semibold flex items-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotFound;

