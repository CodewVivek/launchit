// Configuration for the application
export const config = {
    // AI Backend API URL - Update this to match your backend server
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',

    // Environment detection
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    environment: import.meta.env.VITE_ENV || 'development',
    
    // Domain detection
    isCustomDomain: window.location.hostname === 'launchit.site',
    isNetlifyDev: window.location.hostname.includes('netlify.app'),
    
    // Backend URLs for different environments
    getBackendUrl: () => {
        if (import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }
        
        // Fallback based on domain
        if (window.location.hostname === 'launchit.site') {
            return 'https://your-production-backend.onrender.com';
        }
        
        return 'http://localhost:3001';
    }
};

// Log configuration for debugging
console.log('🌍 Environment:', config.environment);
console.log('🏠 Domain:', window.location.hostname);
console.log('🤖 Backend URL:', config.getBackendUrl());