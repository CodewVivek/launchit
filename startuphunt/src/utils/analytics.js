// Analytics utility functions for Google Analytics
export const trackEvent = (action, category = 'User Interaction', label = '', value = null) => {
    if (window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }
};

export const trackPageView = (pagePath) => {
    if (window.gtag) {
        window.gtag('config', 'G-8DJ5RD98ZL', {
            page_path: pagePath
        });
    }
};

export const trackUserAction = (action, details = {}) => {
    if (window.gtag) {
        window.gtag('event', action, {
            event_category: 'User Action',
            event_label: details.label || action,
            custom_parameters: details
        });
    }
};

// Basic tracking functions - only essential events
export const trackError = (errorType, errorMessage) => {
    trackEvent('error', 'System', `${errorType}: ${errorMessage}`);
}; 