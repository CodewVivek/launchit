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

// Generate image suggestions for projects
app.post('/api/generate-images', async (req, res) => {
  try {
    const { projectName, category, description, tagline } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const client = await getOpenAIClient();

    const prompt = `Generate visual content suggestions for a startup project:

Project: ${projectName}
Category: ${category || 'General'}
Description: ${description || 'No description provided'}
Tagline: ${tagline || 'No tagline provided'}

Generate detailed descriptions for:

1. Logo Design:
   - Style, colors, symbols, typography
   - Modern startup aesthetic
   - Memorable and scalable

2. Hero Image/Thumbnail:
   - Composition, mood, colors
   - Should represent the project's value
   - Professional and engaging

3. Brand Colors:
   - Primary and secondary color palette
   - Hex codes for implementation
   - Psychology behind color choices

4. Visual Style Guide:
   - Overall aesthetic direction
   - Typography suggestions
   - Icon style recommendations

Format as JSON with keys: logo, heroImage, brandColors, visualStyle`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a visual designer and branding expert. Provide detailed, actionable design suggestions in valid JSON format."
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

    // Try to parse the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(generatedData);
    } catch (parseError) {
      parsedData = { rawResponse: generatedData };
    }

    res.json({
      success: true,
      data: parsedData,
      message: 'Image suggestions generated successfully with gpt-4o-mini'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate image suggestions',
      details: error.message
    });
  }
});

// Generate launch data endpoint (for project creation)
app.post('/generatelaunchdata', async (req, res) => {
  try {
    const { projectName, category, description, websiteUrl } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Generate AI-powered launch data with gpt-4o-mini
    const client = await getOpenAIClient();

    const prompt = `Generate a complete structured JSON for a startup project launch:

Project Name: ${projectName}
Category: ${category || 'General'}
Description: ${description || 'No description provided'}
Website URL: ${websiteUrl || 'No URL provided'}

Generate a full structured JSON with:

1. Basic info:
   - launchName (compelling project name)
   - websiteUrl (use provided or suggest one)
   - tagline (max 100 characters, compelling)
   - category (startup category)

2. Content:
   - description (short + long versions)
   - tags (5-8 AI-generated SEO-style tags)

3. Visuals:
   - logo (suggest logo description for AI generation)
   - thumbnail (hero-style screenshot description)

4. Links:
   - appLinks (suggest common startup links like Play Store, App Store, GitHub, etc.)

Format as valid JSON with these exact keys:
{
  "launchName": "",
  "websiteUrl": "",
  "tagline": "",
  "category": "",
  "description": {
    "short": "",
    "long": ""
  },
  "tags": [],
  "logo": "",
  "thumbnail": "",
  "appLinks": []
}

Make it compelling for startup investors and users.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a startup expert helping founders create compelling launch materials. Generate practical, engaging content in valid JSON format. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const generatedData = response.choices[0].message.content;

    // Try to parse the JSON to ensure it's valid
    let parsedData;
    try {
      parsedData = JSON.parse(generatedData);
    } catch (parseError) {
      // If JSON parsing fails, return the raw text
      parsedData = { rawResponse: generatedData };
    }

    res.json({
      success: true,
      data: parsedData,
      message: 'Launch data generated successfully with gpt-4o-mini'
    });

  } catch (error) {
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
    res.status(500).json({ error: 'Failed to generate project suggestions' });
  }
});

// Batch embeddings generation
app.post('/api/batch-embeddings', async (req, res) => {
  try {
    const { texts } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(500).json({ error: 'Texts array is required' });
    }

    const embeddings = await Promise.all(
      texts.map(text => generateEmbedding(text))
    );

    res.json({ embeddings, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate batch embeddings' });
  }
});

app.listen(PORT, () => {
  console.log(`LaunchIT Backend running on port ${PORT}`);
}); 