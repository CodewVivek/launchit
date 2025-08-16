// AI API utility functions
// Temporarily hardcode production backend for dev site
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : 'https://launchit-ai-backend.onrender.com';

// Content Moderation API
export const moderateContent = async (content, contentType, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        contentType,
        userId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Content moderation error:', error);
    throw error;
  }
};

// Semantic Search API
export const semanticSearch = async (query, limit = 10, filters = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search/semantic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
        filters
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Semantic search error:', error);
    throw error;
  }
};

// Generate Embeddings API
export const generateEmbedding = async (projectId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
};

// Get Moderation Queue (Admin only)
export const getModerationQueue = async (status = 'pending_review', limit = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/moderation/queue?status=${status}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get moderation queue error:', error);
    throw error;
  }
};

// Update Moderation Status (Admin only)
export const updateModerationStatus = async (recordId, action, adminNotes = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/moderation/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordId,
        action,
        adminNotes
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Update moderation status error:', error);
    throw error;
  }
};

// Content moderation helper functions
export const getModerationLevel = (moderationResult) => {
  if (!moderationResult) return 'unknown';

  if (moderationResult.moderationLevel === 'flagged') {
    // Check for severe violations
    if (moderationResult.issues.some(issue =>
      issue.includes('Hate speech') ||
      issue.includes('Self-harm') ||
      issue.includes('Violent content')
    )) {
      return 'rejected';
    }
    return 'review';
  }

  return 'approved';
};

export const getModerationColor = (level) => {
  switch (level) {
    case 'approved':
      return 'text-green-600';
    case 'review':
      return 'text-yellow-600';
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const getModerationIcon = (level) => {
  switch (level) {
    case 'approved':
      return '✅';
    case 'review':
      return '⚠️';
    case 'rejected':
      return '❌';
    default:
      return '❓';
  }
}; 