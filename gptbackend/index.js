import express from "express";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
// fetch is built-in to Node.js 18+
import cors from "cors";
import { semanticSearch, generateEmbedding } from "./utils/aiUtils.js";

dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    'https://launchit.site',
    'https://launchitsite.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple in-memory rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 50; // 50 requests per 15 minutes

const rateLimitMiddleware = (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const clientData = requestCounts.get(clientId);
    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + RATE_LIMIT_WINDOW;
    } else if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        error: true,
        message: 'Rate limit exceeded. Please try again later.'
      });
    } else {
      clientData.count++;
    }
  }
  next();
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Microlink.io API function to generate thumbnail and logo
async function generateMicrolinkAssets(url) {
  try {
    // Generate thumbnail (16:9 aspect ratio - 1200x675)
    const thumbnailResponse = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&width=1200&height=675&format=png&meta=false`
    );

    // Get metadata including logo
    const metadataResponse = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true`
    );

    const thumbnailData = await thumbnailResponse.json();
    const metadataData = await metadataResponse.json();

    // Extract logo URL from metadata
    let logoUrl = "";
    if (metadataData.data?.logo?.url) {
      logoUrl = metadataData.data.logo.url;
    } else if (metadataData.data?.image?.url) {
      logoUrl = metadataData.data.image.url;
    } else if (metadataData.data?.favicon?.url) {
      // Only use favicon as last resort, and check if it's a proper image
      const faviconUrl = metadataData.data.favicon.url;
      if (faviconUrl && !faviconUrl.includes('favicon.ico')) {
        logoUrl = faviconUrl;
      }
    }

    return {
      thumbnail_url: thumbnailData.data?.screenshot?.url || "",
      logo_url: logoUrl
    };
  } catch (error) {
    // Microlink.io error occurred
    return {
      thumbnail_url: "",
      logo_url: ""
    };
  }
}

app.post("/generatelaunchdata", rateLimitMiddleware, async (req, res) => {
  const { url, user_id } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  try {
    const htmlResponse = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await htmlResponse.text();

    // Generate Microlink.io assets (thumbnail + logo)
    const microlinkAssets = await generateMicrolinkAssets(url);

    const prompt = `
      You are a data extraction AI. Extract information from this website and return ONLY a valid JSON object with no additional text.
      
      Required JSON format:
      {
        "name": "company/product name",
        "tagline": "short compelling tagline",
        "description": "detailed description (2-3 sentences)",
        "category": "detected category (saas, ai, fintech, ecommerce, etc.)",
        "features": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "emails": ["email@example.com"],
        "social_links": ["https://twitter.com/...", "https://linkedin.com/..."],
        "other_links": ["https://app.example.com", "https://github.com/..."]
      }
      
      Website HTML (first 7000 chars):
      ${html.slice(0, 7000)}
      
      Return only the JSON object, no other text:
    `;

    let gptresponse;
    try {
      gptresponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      });
    } catch (openaiError) {
      // OpenAI API error occurred
      return res.status(500).json({
        err: true,
        message: "OpenAI API failed: " + openaiError.message
      });
    }

    let result;
    try {
      const rawContent = gptresponse.choices[0].message.content.trim();
      // Remove any markdown code blocks if present
      const jsonContent = rawContent.replace(/```json\s*|\s*```/g, '').trim();
      result = JSON.parse(jsonContent);
    } catch (e) {
      // GPT JSON parse error occurred

      // Fallback: create basic data from URL
      const fallbackResult = {
        name: url.replace(/https?:\/\/(www\.)?/, '').split('/')[0].replace(/\./g, ' ').toUpperCase(),
        tagline: "Innovative solution for modern needs",
        description: "This product offers cutting-edge features designed to solve real-world problems and enhance user experience.",
        category: "startup ecosystem",
        features: ["User-friendly", "Scalable", "Secure"],
        emails: [],
        social_links: [],
        other_links: []
      };

      result = fallbackResult;
    }

    
    const responseData = {
      name: result.name || "",
      website_url: url,
      tagline: result.tagline || "",
      description: result.description || "",
      category: result.category || "",
      links: [...(result.social_links || []), ...(result.other_links || [])],
      features: result.features || [],
      logo_url: microlinkAssets.logo_url,
      thumbnail_url: microlinkAssets.thumbnail_url,
      success: true
    };

    res.json(responseData);

  } catch (err) {
    // Server error occurred
    res.status(500).json({ error: true, message: err.message });
  }
});

// ==================== AI FEATURES ENDPOINTS ====================

// 2. SEMANTIC SEARCH ENDPOINT
app.post('/api/search/semantic', rateLimitMiddleware, async (req, res) => {
  try {
    const { query, limit = 10, filters = {} } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: true,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Get all projects from database
    let { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      throw new Error('Failed to fetch projects: ' + fetchError.message);
    }

    if (!projects || projects.length === 0) {
      return res.json({
        success: true,
        results: [],
        total: 0,
        query: query
      });
    }

    // Generate embeddings for projects that don't have them
    const projectsWithEmbeddings = await Promise.all(
      projects.map(async (project) => {
        if (!project.embedding) {
          try {
            const projectText = [
              project.title || '',
              project.description || '',
              project.category || '',
              project.tags ? project.tags.join(' ') : ''
            ].join(' ').trim();

            if (projectText) {
              const embedding = await generateEmbedding(projectText);

              // Store embedding in database
              await supabase
                .from('projects')
                .update({ embedding: embedding })
                .eq('id', project.id);

              return { ...project, embedding };
            }
          } catch (error) {
            // Silently continue if embedding generation fails
          }
        }
        return project;
      })
    );

    // Perform semantic search
    const searchResults = await semanticSearch(query, projectsWithEmbeddings, limit);

    // Apply additional filters if provided
    let filteredResults = searchResults;

    if (filters.category) {
      filteredResults = filteredResults.filter(project =>
        project.category === filters.category
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredResults = filteredResults.filter(project =>
        project.tags && filters.tags.some(tag => project.tags.includes(tag))
      );
    }

    res.json({
      success: true,
      results: filteredResults,
      total: filteredResults.length,
      query: query,
      searchTime: new Date().toISOString()
    });

  } catch (error) {
    // Semantic search error occurred
    res.status(500).json({
      error: true,
      message: 'Semantic search failed: ' + error.message
    });
  }
});

// 3. GENERATE EMBEDDINGS FOR EXISTING PROJECTS
app.post('/api/embeddings/generate', rateLimitMiddleware, async (req, res) => {
  try {
    const { projectId, projectText } = req.body;

    if (!projectId) {
      return res.status(400).json({
        error: true,
        message: 'Project ID is required'
      });
    }

    // Get project data
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({
        error: true,
        message: 'Project not found'
      });
    }

    // Use provided projectText or generate from project data
    let textForEmbedding = projectText;
    if (!textForEmbedding) {
      textForEmbedding = [
        project.name || '',
        project.description || '',
        project.tagline || '',
        project.category_type || '',
        project.tags ? project.tags.join(' ') : ''
      ].filter(text => text.trim()).join(' ').trim();
    }

    if (!textForEmbedding) {
      return res.status(400).json({
        error: true,
        message: 'Project has no text content for embedding'
      });
    }

    const embedding = await generateEmbedding(textForEmbedding);

    // Update project with embedding
    const { error: updateError } = await supabase
      .from('projects')
      .update({ embedding: embedding })
      .eq('id', projectId);

    if (updateError) {
      throw new Error('Failed to update project: ' + updateError.message);
    }

    res.json({
      success: true,
      message: 'Embedding generated successfully',
      projectId: projectId,
      projectName: project.name
    });

  } catch (error) {
    // Embedding generation error occurred
    res.status(500).json({
      error: true,
      message: 'Embedding generation failed: ' + error.message
    });
  }
});

// 4. GET MODERATION QUEUE (Admin only) - REMOVED FOR MERGE
// app.get('/api/moderation/queue', rateLimitMiddleware, async (req, res) => { ... });

// 5. UPDATE MODERATION STATUS (Admin only) - REMOVED FOR MERGE  
// app.put('/api/moderation/status', rateLimitMiddleware, async (req, res) => { ... });

// 6. GET USER NOTIFICATIONS (User only) - REMOVED FOR MERGE
// app.get('/api/notifications/:userId', rateLimitMiddleware, async (req, res) => { ... });

// 7. MARK NOTIFICATION AS READ (User only) - REMOVED FOR MERGE
// app.put('/api/notifications/:notificationId/read', rateLimitMiddleware, async (req, res) => { ... });

// 8. GET ADMIN NOTIFICATIONS (Admin only) - REMOVED FOR MERGE
// app.get('/api/admin/notifications', rateLimitMiddleware, async (req, res) => { ... });

// 9. GET MODERATION QUEUE WITH NOTIFICATIONS (Admin only) - REMOVED FOR MERGE
// app.get('/api/admin/moderation/queue', rateLimitMiddleware, async (req, res) => { ... });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'launchit-ai-backend'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    error: true,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  // Server started successfully
});