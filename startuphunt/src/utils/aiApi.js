// AI API utility functions
import { config } from '../config';

// Use config to get backend URL (respects VITE_API_URL env var for branch-specific URLs)
const API_BASE_URL = config.getBackendUrl();

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
    // Error handled silently for production
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
    // Error handled silently for production
    throw error;
  }
};

// All moderation and notification functions - REMOVED FOR MERGE 