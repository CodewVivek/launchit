/**
 * Utility functions for Register form
 */

export function getLinkType(url) {
    if (!url) return { label: 'Website', icon: '🌐' };
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', icon: '▶️' };
    if (url.includes('instagram.com')) return { label: 'Instagram', icon: '📸' };
    if (url.includes('play.google.com')) return { label: 'Play Store', icon: '🤖' };
    if (url.includes('apps.apple.com')) return { label: 'App Store', icon: '🍎' };
    if (url.includes('linkedin.com')) return { label: 'LinkedIn', icon: '💼' };
    if (url.includes('twitter.com') || url.includes('x.com')) return { label: 'Twitter/X', icon: '🐦' };
    if (url.includes('facebook.com')) return { label: 'Facebook', icon: '📘' };
    return { label: 'Website', icon: '🌐' };
}

export const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
};

export const slugify = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

export const sanitizeFileName = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return 'file';
    return fileName
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9.-_]/g, '') // Remove special characters except dots, hyphens, underscores
        .toLowerCase();
};

export const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const saved = new Date(date);
    const diffSeconds = Math.floor((now - saved) / 1000);

    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
};

