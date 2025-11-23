// Configuration for the application
export const config = {
    // AI Backend API URL - Set via Netlify environment variables
    // Main branch: Set VITE_API_URL to main Railway URL
    // Dev branch: Set VITE_API_URL to dev Railway URL
    API_URL: import.meta.env.VITE_API_URL || null,

    // Google Analytics Measurement ID (from environment variable only)
    GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || null,

    // Environment detection
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,

    // Domain detection
    isCustomDomain: window.location.hostname === 'launchit.site',
    isNetlifyDev: window.location.hostname.includes('netlify.app'),

    // Backend URLs for different environments
    // How it works:
    // 1. Netlify sets VITE_API_URL based on branch (main vs dev)
    // 2. This function uses that env var automatically
    // 3. Railway only - no Render fallback
    getBackendUrl: () => {
        // Use environment variable from Netlify (Railway URL)
        // Netlify will set different values for main vs dev branches:
        // - Main branch → uses main Railway backend URL
        // - Dev branch → uses dev Railway backend URL
        if (import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }

        // No fallback - VITE_API_URL must be set in Netlify
        // This ensures we only use Railway, never Render
        console.error('⚠️ VITE_API_URL environment variable is not set. Please configure it in Netlify for your branch.');
        return null; // Return null so calling code can handle it gracefully
    }
};

