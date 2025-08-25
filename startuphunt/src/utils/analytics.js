// Google Analytics utility functions
export const trackEvent = (action, category, label, value) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

export const trackPageView = (pageTitle, pageLocation) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: pageLocation
    });
  }
};

export const trackUserRegistration = (method = 'google') => {
  trackEvent('sign_up', 'engagement', method);
};

export const trackProjectSubmission = (category = 'startup') => {
  trackEvent('submit_project', 'engagement', category);
};

export const trackSearch = (searchTerm) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'search', {
      search_term: searchTerm
    });
  }
};

export const trackUserInteraction = (action, itemType, itemId) => {
  trackEvent(action, 'user_interaction', `${itemType}_${itemId}`);
};

export const trackError = (errorType, errorMessage) => {
  trackEvent('exception', 'error', errorType, {
    description: errorMessage
  });
}; 