// Analytics utility functions for Google Analytics
import { config } from '../config';

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
        window.gtag('config', config.GA_MEASUREMENT_ID, {
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

// Track real users - fires after 4 seconds to filter out bots
// Bots typically don't stay on a page for 4 seconds, so this helps identify real human users
export const trackRealUser = () => {
    setTimeout(() => {
        if (window.gtag) {
            window.gtag('event', 'real_user', {
                event_category: 'User Quality',
                event_label: 'Real Human User'
            });
        }
    }, 4000);
}; 