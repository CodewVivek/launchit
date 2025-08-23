import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateEmbedding, semanticSearch, generateProjectSuggestions, getOpenAIClient } from './utils/aiUtils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LaunchIT Backend is running' });
});

// Basic AI endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'LaunchIT AI Backend' });
});

// Generate launch data endpoint (for project creation)
app.post('/generatelaunchdata', async (req, res) => {
  try {
    const { projectName, category, description } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Generate AI-powered launch data
    const client = await getOpenAIClient();

    const prompt = `Generate launch data for a startup project:
    
Project Name: ${projectName}
Category: ${category || 'General'}
Description: ${description || 'No description provided'}

Please generate:
1. A compelling tagline (max 100 characters)
2. A detailed description (max 500 characters)
3. 5 relevant tags
4. Suggested category if none provided
5. Marketing tips

Format as JSON with keys: tagline, description, tags, category, marketingTips`;

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a startup expert helping founders create compelling launch materials. Provide practical, engaging content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const generatedData = response.choices[0].message.content;

    res.json({
      success: true,
      data: generatedData,
      message: 'Launch data generated successfully'
    });

  } catch (error) {
    console.error('Launch data generation error:', error);
    res.status(500).json({
      error: 'Failed to generate launch data',
      details: error.message
    });
  }
});

// Generate embeddings for text
app.post('/api/embeddings', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embedding = await generateEmbedding(text);
    res.json({ embedding, success: true });
  } catch (error) {
    console.error('Embedding generation error:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});

// Semantic search endpoint
app.post('/api/semantic-search', async (req, res) => {
  try {
    const { query, projects, limit = 10 } = req.body;

    if (!query || !projects) {
      return res.status(400).json({ error: 'Query and projects are required' });
    }

    const results = await semanticSearch(query, projects, limit);
    res.json({ results, success: true });
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ error: 'Semantic search failed' });
  }
});

// Generate project suggestions
app.post('/api/project-suggestions', async (req, res) => {
  try {
    const { projectData } = req.body;

    if (!projectData || !projectData.name) {
      return res.status(400).json({ error: 'Project data is required' });
    }

    const suggestions = await generateProjectSuggestions(projectData);
    res.json({ suggestions, success: true });
  } catch (error) {
    console.error('Project suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate project suggestions' });
  }
});

// Batch embeddings generation
app.post('/api/batch-embeddings', async (req, res) => {
  try {
    const { texts } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    const embeddings = await Promise.all(
      texts.map(text => generateEmbedding(text))
    );

    res.json({ embeddings, success: true });
  } catch (error) {
    console.error('Batch embeddings error:', error);
    res.status(500).json({ error: 'Failed to generate batch embeddings' });
  }
});

app.listen(PORT, () => {
  console.log(`LaunchIT Backend running on port ${PORT}`);
}); 