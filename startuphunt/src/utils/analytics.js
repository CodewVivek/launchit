// Google Analytics Utility Functions
// Make sure to replace 'G-XXXXXXX' with your actual Measurement ID

// Initialize Google Analytics
export const initGA = () => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
            page_title: 'LaunchIT',
            custom_map: {
                dimension1: 'user_type',
                dimension2: 'user_role',
                dimension3: 'project_category'
            },
            send_page_view: true,
            anonymize_ip: true,
            custom_parameters: {
                platform: 'LaunchIT',
                version: '1.0.0'
            }
        });
    }
};

// Track page views
export const trackPageView = (pageTitle, pagePath) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
            page_title: pageTitle,
            page_location: window.location.href,
            page_path: pagePath
        });
    }
};

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, {
            event_category: 'LaunchIT',
            event_label: window.location.pathname,
            ...parameters
        });
    }
};

// Track user actions
export const trackUserAction = (action, category = 'User', label = '', value = 1) => {
    trackEvent(action, {
        event_category: category,
        event_label: label,
        value: value
    });
};

// Track project interactions
export const trackProjectInteraction = (action, projectName, projectCategory) => {
    trackEvent(action, {
        event_category: 'Project',
        event_label: projectName,
        project_category: projectCategory,
        value: 1
    });
};

// Track form submissions
export const trackFormSubmission = (formName, success = true) => {
    trackEvent('form_submit', {
        event_category: 'Form',
        event_label: formName,
        success: success,
        value: 1
    });
};

// Track search queries
export const trackSearch = (query, resultsCount) => {
    trackEvent('search', {
        event_category: 'Search',
        event_label: query,
        search_results: resultsCount,
        value: 1
    });
};

// Track authentication events
export const trackAuth = (action, method = 'email') => {
    trackEvent(action, {
        event_category: 'Authentication',
        event_label: method,
        value: 1
    });
};

// Track performance metrics
export const trackPerformance = (metric, value) => {
    trackEvent('performance', {
        event_category: 'Performance',
        event_label: metric,
        value: value
    });
};

// Track errors
export const trackError = (error, context) => {
    trackEvent('error', {
        event_category: 'Error',
        event_label: error.message || error,
        error_context: context,
        value: 1
    });
};

// Track user engagement
export const trackEngagement = (action, content = '') => {
    trackEvent(action, {
        event_category: 'Engagement',
        event_label: content,
        value: 1
    });
};

// Track business metrics
export const trackBusinessMetric = (metric, value, category = 'Business') => {
    trackEvent(metric, {
        event_category: category,
        value: value
    });
}; 