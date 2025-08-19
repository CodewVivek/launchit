// AI API utility functions
// Temporarily hardcode production backend for dev site
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://launchit-ai-backend.onrender.com';

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

// All moderation and notification functions - REMOVED FOR MERGE 