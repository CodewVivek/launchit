// Configuration for the application
export const config = {
    // AI Backend API URL - Update this to match your backend server
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',

    // Other configuration can go here
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
};

// For development, ensure the API URL is set
if (config.isDevelopment && !import.meta.env.VITE_API_URL) {
    console.log('🤖 AI Backend configured at:', config.API_URL);
}