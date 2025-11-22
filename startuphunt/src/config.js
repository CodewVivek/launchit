// Configuration for the application
export const config = {
    // AI Backend API URL - Update this to match your backend server
    API_URL: import.meta.env.VITE_API_URL || 'https://launchit-ai-backend.onrender.com',

    // Google Analytics Measurement ID (from environment variable only)
    GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || null,

    // Environment detection
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,

    // Domain detection
    isCustomDomain: window.location.hostname === 'launchit.site',
    isNetlifyDev: window.location.hostname.includes('netlify.app'),

    // Backend URLs for different environments
    getBackendUrl: () => {
        if (import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }

        // Always use production backend
        return 'https://launchit-ai-backend.onrender.com';
    }
};

